"""
Service layer - Business logic for matching operations
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

from . import models, schemas
from .matching import matching_engine

logger = logging.getLogger(__name__)

class MatchingService:
    """Service layer for matching operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========== Score Calculation ==========
    
    def calculate_score(
        self,
        applicant_id: str,
        opportunity_id: str
    ) -> schemas.ScoreResponse:
        """
        Calculate matching score between applicant and opportunity
        Uses rule-based algorithm for speed
        """
        # Fetch applicant features
        applicant = self.db.query(models.ApplicantFeature).filter(
            models.ApplicantFeature.applicant_id == applicant_id
        ).first()
        
        if not applicant:
            logger.warning(f"Applicant {applicant_id} not found in features DB")
            # Return neutral score if not found
            return schemas.ScoreResponse(
                overallScore=50.0,
                breakdown=schemas.ScoreBreakdown(
                    gpaMatch=50.0,
                    skillsMatch=50.0,
                    researchMatch=50.0
                )
            )
        
        # Fetch opportunity features
        opportunity = self.db.query(models.OpportunityFeature).filter(
            models.OpportunityFeature.opportunity_id == opportunity_id
        ).first()
        
        if not opportunity:
            logger.warning(f"Opportunity {opportunity_id} not found in features DB")
            return schemas.ScoreResponse(
                overallScore=50.0,
                breakdown=schemas.ScoreBreakdown(
                    gpaMatch=50.0,
                    skillsMatch=50.0,
                    researchMatch=50.0
                )
            )
        
        # Prepare data for matching engine
        applicant_data = {
            'gpa': applicant.gpa,
            'skills': applicant.skills or [],
            'research_interests': applicant.research_interests or []
        }
        
        opportunity_data = {
            'min_gpa': opportunity.min_gpa,
            'required_skills': opportunity.required_skills or [],
            'research_areas': opportunity.research_areas or []
        }
        
        # Calculate score
        overall_score, breakdown = matching_engine.calculate_rule_based_score(
            applicant_data,
            opportunity_data
        )
        
        # Optionally cache the result
        self._cache_score(applicant_id, opportunity_id, overall_score, breakdown)
        
        return schemas.ScoreResponse(
            overallScore=overall_score,
            breakdown=schemas.ScoreBreakdown(
                gpaMatch=breakdown['gpaMatch'],
                skillsMatch=breakdown['skillsMatch'],
                researchMatch=breakdown.get('researchMatch', 50.0)
            )
        )
    
    def _cache_score(
        self,
        applicant_id: str,
        opportunity_id: str,
        overall_score: float,
        breakdown: Dict
    ):
        """Cache matching score in database"""
        try:
            # Check if exists
            existing = self.db.query(models.MatchingScore).filter(
                models.MatchingScore.applicant_id == applicant_id,
                models.MatchingScore.opportunity_id == opportunity_id
            ).first()
            
            if existing:
                # Update
                existing.overall_score = overall_score
                existing.gpa_score = breakdown.get('gpaMatch')
                existing.skills_score = breakdown.get('skillsMatch')
                existing.research_score = breakdown.get('researchMatch')
                existing.calculated_at = datetime.utcnow()
            else:
                # Create new
                score = models.MatchingScore(
                    applicant_id=applicant_id,
                    opportunity_id=opportunity_id,
                    overall_score=overall_score,
                    gpa_score=breakdown.get('gpaMatch'),
                    skills_score=breakdown.get('skillsMatch'),
                    research_score=breakdown.get('researchMatch')
                )
                self.db.add(score)
            
            self.db.commit()
        except Exception as e:
            logger.error(f"Error caching score: {e}")
            self.db.rollback()
    
    # ========== Recommendations for Applicant ==========
    
    def get_recommendations_for_applicant(
        self,
        applicant_id: str,
        limit: int = 10,
        page: int = 1
    ) -> schemas.RecommendationResponse:
        """
        Get opportunity recommendations for an applicant
        Uses ML-based scoring (SLOW)
        """
        # Fetch applicant features
        applicant = self.db.query(models.ApplicantFeature).filter(
            models.ApplicantFeature.applicant_id == applicant_id
        ).first()
        
        if not applicant:
            logger.warning(f"Applicant {applicant_id} not found")
            return schemas.RecommendationResponse(
                metadata=schemas.RecommendationMetadata(
                    total=0,
                    page=page,
                    limit=limit,
                    totalPages=0
                ),
                data=[]
            )
        
        # Fetch all opportunities
        opportunities = self.db.query(models.OpportunityFeature).all()
        
        if not opportunities:
            return schemas.RecommendationResponse(
                metadata=schemas.RecommendationMetadata(
                    total=0,
                    page=page,
                    limit=limit,
                    totalPages=0
                ),
                data=[]
            )
        
        # Prepare features for ML engine
        target_features = {
            'id': applicant.applicant_id,
            'skills_vector': applicant.skills_vector,
            'research_vector': applicant.research_vector,
            'combined_text': applicant.combined_text
        }
        
        candidates_features = []
        for opp in opportunities:
            candidates_features.append({
                'id': opp.opportunity_id,
                'skills_vector': opp.skills_vector,
                'research_vector': opp.research_vector,
                'combined_text': opp.combined_text
            })
        
        # Calculate ML-based scores
        logger.info(f"Calculating ML scores for {len(candidates_features)} opportunities")
        scored_results = matching_engine.calculate_ml_based_scores(
            target_features,
            candidates_features
        )
        
        # Pagination
        total = len(scored_results)
        total_pages = (total + limit - 1) // limit
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        paginated_results = scored_results[start_idx:end_idx]
        
        # Build response
        data = [
            schemas.RecommendationItem(
                opportunityId=opp_id,
                matchingScore=score
            )
            for opp_id, score in paginated_results
        ]
        
        return schemas.RecommendationResponse(
            metadata=schemas.RecommendationMetadata(
                total=total,
                page=page,
                limit=limit,
                totalPages=total_pages
            ),
            data=data
        )
    
    # ========== Recommendations for Opportunity ==========
    
    def get_recommendations_for_opportunity(
        self,
        opportunity_id: str,
        limit: int = 10,
        page: int = 1
    ) -> schemas.RecommendationResponse:
        """
        Get applicant recommendations for an opportunity
        Uses ML-based scoring (SLOW)
        """
        # Fetch opportunity features
        opportunity = self.db.query(models.OpportunityFeature).filter(
            models.OpportunityFeature.opportunity_id == opportunity_id
        ).first()
        
        if not opportunity:
            logger.warning(f"Opportunity {opportunity_id} not found")
            return schemas.RecommendationResponse(
                metadata=schemas.RecommendationMetadata(
                    total=0,
                    page=page,
                    limit=limit,
                    totalPages=0
                ),
                data=[]
            )
        
        # Fetch all applicants
        applicants = self.db.query(models.ApplicantFeature).all()
        
        if not applicants:
            return schemas.RecommendationResponse(
                metadata=schemas.RecommendationMetadata(
                    total=0,
                    page=page,
                    limit=limit,
                    totalPages=0
                ),
                data=[]
            )
        
        # Prepare features for ML engine
        target_features = {
            'id': opportunity.opportunity_id,
            'skills_vector': opportunity.skills_vector,
            'research_vector': opportunity.research_vector,
            'combined_text': opportunity.combined_text
        }
        
        candidates_features = []
        for app in applicants:
            candidates_features.append({
                'id': app.applicant_id,
                'skills_vector': app.skills_vector,
                'research_vector': app.research_vector,
                'combined_text': app.combined_text
            })
        
        # Calculate ML-based scores
        logger.info(f"Calculating ML scores for {len(candidates_features)} applicants")
        scored_results = matching_engine.calculate_ml_based_scores(
            target_features,
            candidates_features
        )
        
        # Pagination
        total = len(scored_results)
        total_pages = (total + limit - 1) // limit
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        paginated_results = scored_results[start_idx:end_idx]
        
        # Build response
        data = [
            schemas.RecommendationItem(
                applicantId=app_id,
                matchingScore=score
            )
            for app_id, score in paginated_results
        ]
        
        return schemas.RecommendationResponse(
            metadata=schemas.RecommendationMetadata(
                total=total,
                page=page,
                limit=limit,
                totalPages=total_pages
            ),
            data=data
        )
