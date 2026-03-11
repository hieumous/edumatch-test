"""
Matching algorithms - Rule-based and ML-based scoring
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional, Tuple
import json
import logging

logger = logging.getLogger(__name__)

class MatchingEngine:
    """Core matching algorithms"""
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            min_df=2,
            stop_words='english',
            ngram_range=(1, 2)
        )
    
    # ========== Rule-based Scoring (Fast, for real-time API) ==========
    
    def calculate_rule_based_score(
        self,
        applicant_data: Dict,
        opportunity_data: Dict
    ) -> Tuple[float, Dict[str, float]]:
        """
        Tính điểm tương thích dựa trên quy tắc đơn giản (rule-based)
        Đảm bảo tốc độ nhanh < 300ms
        
        Returns:
            (overall_score, breakdown)
        """
        scores = {}
        
        # 1. GPA Score (30% weight)
        scores['gpaMatch'] = self._calculate_gpa_score(
            applicant_data.get('gpa'),
            opportunity_data.get('min_gpa')
        )
        
        # 2. Skills Score (50% weight)
        scores['skillsMatch'] = self._calculate_skills_overlap(
            applicant_data.get('skills', []),
            opportunity_data.get('required_skills', [])
        )
        
        # 3. Research Score (20% weight) - optional
        scores['researchMatch'] = self._calculate_skills_overlap(
            applicant_data.get('research_interests', []),
            opportunity_data.get('research_areas', [])
        )
        
        # Calculate weighted overall score
        overall = (
            scores['gpaMatch'] * 0.3 +
            scores['skillsMatch'] * 0.5 +
            scores.get('researchMatch', 50) * 0.2  # Default 50 if no research data
        )
        
        return round(overall, 2), scores
    
    def _calculate_gpa_score(
        self,
        applicant_gpa: Optional[float],
        required_gpa: Optional[float]
    ) -> float:
        """Calculate GPA matching score"""
        if applicant_gpa is None:
            return 50.0  # Neutral score if no GPA data
        
        if required_gpa is None:
            return 75.0  # Good score if no requirement
        
        if applicant_gpa >= required_gpa:
            # Bonus for exceeding requirement
            bonus = min((applicant_gpa - required_gpa) * 20, 25)
            return min(75.0 + bonus, 100.0)
        else:
            # Penalty for not meeting requirement
            gap = required_gpa - applicant_gpa
            penalty = gap * 30
            return max(0, 50 - penalty)
    
    def _calculate_skills_overlap(
        self,
        applicant_skills: List[str],
        required_skills: List[str]
    ) -> float:
        """Calculate skill overlap score using Jaccard similarity"""
        if not required_skills:
            return 75.0  # Good score if no requirements
        
        if not applicant_skills:
            return 0.0  # No skills = 0 score
        
        # Normalize to lowercase for comparison
        applicant_set = set(skill.lower().strip() for skill in applicant_skills)
        required_set = set(skill.lower().strip() for skill in required_skills)
        
        # Jaccard similarity
        intersection = len(applicant_set & required_set)
        union = len(applicant_set | required_set)
        
        if union == 0:
            return 0.0
        
        jaccard = intersection / union
        
        # Also check coverage of required skills
        coverage = intersection / len(required_set) if len(required_set) > 0 else 0
        
        # Weighted combination: 60% coverage + 40% jaccard
        score = (coverage * 0.6 + jaccard * 0.4) * 100
        
        return round(score, 2)
    
    # ========== ML-based Scoring (Slower, for recommendations) ==========
    
    def calculate_ml_based_scores(
        self,
        target_features: Dict,
        candidates_features: List[Dict]
    ) -> List[Tuple[str, float]]:
        """
        Tính điểm ML-based sử dụng TF-IDF + Cosine Similarity
        Dùng cho API recommendations (chấp nhận chậm)
        
        Args:
            target_features: Features của applicant HOẶC opportunity (target)
            candidates_features: List features của các candidates
        
        Returns:
            List of (candidate_id, matching_score) sorted by score descending
        """
        try:
            # Extract vectors from features
            target_vector = self._get_combined_vector(target_features)
            
            results = []
            for candidate in candidates_features:
                candidate_id = candidate.get('id')
                candidate_vector = self._get_combined_vector(candidate)
                
                # Calculate cosine similarity
                similarity = self._cosine_similarity(target_vector, candidate_vector)
                score = round(similarity * 100, 2)
                
                results.append((candidate_id, score))
            
            # Sort by score descending
            results.sort(key=lambda x: x[1], reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in ML-based scoring: {e}")
            return []
    
    def _get_combined_vector(self, features: Dict) -> Optional[np.ndarray]:
        """Get or create combined feature vector"""
        # Try to use precomputed vectors
        skills_vector = features.get('skills_vector')
        research_vector = features.get('research_vector')
        
        if skills_vector and research_vector:
            # Combine precomputed vectors
            try:
                skills_arr = np.array(skills_vector) if isinstance(skills_vector, list) else np.array(json.loads(skills_vector))
                research_arr = np.array(research_vector) if isinstance(research_vector, list) else np.array(json.loads(research_vector))
                
                # Concatenate and normalize
                combined = np.concatenate([skills_arr, research_arr])
                return combined / (np.linalg.norm(combined) + 1e-10)
            except Exception as e:
                logger.warning(f"Error loading precomputed vectors: {e}")
        
        # Fallback: use combined text
        combined_text = features.get('combined_text', '')
        if combined_text:
            # Simple TF-IDF on-the-fly (not ideal, but works)
            try:
                vector = self.tfidf_vectorizer.fit_transform([combined_text])
                return vector.toarray()[0]
            except Exception as e:
                logger.error(f"Error creating TF-IDF vector: {e}")
        
        return None
    
    def _cosine_similarity(self, vec1: Optional[np.ndarray], vec2: Optional[np.ndarray]) -> float:
        """Calculate cosine similarity between two vectors"""
        if vec1 is None or vec2 is None:
            return 0.5  # Neutral score if vectors missing
        
        try:
            # Ensure same length (pad with zeros if needed)
            max_len = max(len(vec1), len(vec2))
            vec1_padded = np.pad(vec1, (0, max_len - len(vec1)))
            vec2_padded = np.pad(vec2, (0, max_len - len(vec2)))
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1_padded, vec2_padded)
            norm1 = np.linalg.norm(vec1_padded)
            norm2 = np.linalg.norm(vec2_padded)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            
            # Ensure result is between 0 and 1
            return max(0.0, min(1.0, similarity))
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.5
    
    # ========== Feature Preprocessing (for Celery workers) ==========
    
    def preprocess_text_features(
        self,
        skills: List[str],
        research_interests: List[str],
        additional_text: str = ""
    ) -> Dict:
        """
        Tiền xử lý text thành vectors (chạy trong Celery worker)
        
        Returns:
            Dict with 'combined_text', 'skills_vector', 'research_vector'
        """
        try:
            # Combine all text
            skills_text = " ".join(skills) if skills else ""
            research_text = " ".join(research_interests) if research_interests else ""
            combined = f"{skills_text} {research_text} {additional_text}".strip()
            
            # Create TF-IDF vectors (simplified - in production use trained vectorizer)
            result = {
                'combined_text': combined,
                'skills_vector': [],
                'research_vector': []
            }
            
            # For now, store simple word frequency vectors
            # In production, use fitted TfidfVectorizer and save vectors
            if skills_text:
                result['skills_vector'] = self._simple_vectorize(skills_text)
            
            if research_text:
                result['research_vector'] = self._simple_vectorize(research_text)
            
            return result
            
        except Exception as e:
            logger.error(f"Error preprocessing features: {e}")
            return {
                'combined_text': "",
                'skills_vector': [],
                'research_vector': []
            }
    
    def _simple_vectorize(self, text: str, max_features: int = 100) -> List[float]:
        """Simple word frequency vectorization"""
        words = text.lower().split()
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Return as list (JSON serializable)
        return list(word_freq.values())[:max_features]


# Global instance
matching_engine = MatchingEngine()
