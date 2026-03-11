"""
Database models for Matching Service
"""
from sqlalchemy import Column, String, Float, JSON, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
from .database import Base

class ApplicantFeature(Base):
    """
    Lưu trữ các features đã được tiền xử lý của Applicant
    """
    __tablename__ = "applicant_features"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    applicant_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Profile data
    gpa = Column(Float, nullable=True)
    major = Column(String(255), nullable=True)
    university = Column(String(255), nullable=True)
    year_of_study = Column(Integer, nullable=True)
    
    # Skills (original list)
    skills = Column(ARRAY(String), nullable=True)
    
    # Research interests (original list)
    research_interests = Column(ARRAY(String), nullable=True)
    
    # Preprocessed features (for ML)
    skills_vector = Column(JSON, nullable=True)  # TF-IDF vector as JSON
    research_vector = Column(JSON, nullable=True)  # TF-IDF vector as JSON
    combined_text = Column(Text, nullable=True)  # Combined text for vectorization
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_processed_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<ApplicantFeature(applicant_id='{self.applicant_id}', gpa={self.gpa})>"


class OpportunityFeature(Base):
    """
    Lưu trữ các features đã được tiền xử lý của Opportunity (Scholarship/Lab)
    """
    __tablename__ = "opportunity_features"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Opportunity data
    opportunity_type = Column(String(50), nullable=False)  # 'scholarship' or 'lab'
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Requirements
    min_gpa = Column(Float, nullable=True)
    required_skills = Column(ARRAY(String), nullable=True)
    preferred_majors = Column(ARRAY(String), nullable=True)
    research_areas = Column(ARRAY(String), nullable=True)
    
    # Preprocessed features (for ML)
    skills_vector = Column(JSON, nullable=True)
    research_vector = Column(JSON, nullable=True)
    combined_text = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_processed_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<OpportunityFeature(opportunity_id='{self.opportunity_id}', type='{self.opportunity_type}')>"


class MatchingScore(Base):
    """
    Cache tính toán điểm matching (optional, để optimize performance)
    """
    __tablename__ = "matching_scores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    applicant_id = Column(String(255), nullable=False, index=True)
    opportunity_id = Column(String(255), nullable=False, index=True)
    
    # Scores
    overall_score = Column(Float, nullable=False)
    gpa_score = Column(Float, nullable=True)
    skills_score = Column(Float, nullable=True)
    research_score = Column(Float, nullable=True)
    
    # Metadata
    calculated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<MatchingScore(applicant='{self.applicant_id}', opportunity='{self.opportunity_id}', score={self.overall_score})>"
