"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============= Request Schemas =============

class ScoreRequest(BaseModel):
    """Request body for POST /api/v1/match/score"""
    applicantId: str = Field(..., description="UUID of the applicant")
    opportunityId: str = Field(..., description="UUID of the opportunity")

class BatchScoreRequest(BaseModel):
    """Request body for POST /api/v1/matching/batch-scores"""
    applicantId: str = Field(..., description="UUID of the applicant")
    opportunityIds: List[str] = Field(..., description="List of opportunity IDs")

class RecommendationQueryParams(BaseModel):
    """Query parameters for recommendation endpoints"""
    limit: int = Field(default=10, ge=1, le=100, description="Number of results")
    page: int = Field(default=1, ge=1, description="Page number")

# ============= Response Schemas =============

class ScoreBreakdown(BaseModel):
    """Breakdown of matching score"""
    gpaMatch: float = Field(..., ge=0, le=100)
    skillsMatch: float = Field(..., ge=0, le=100)
    researchMatch: Optional[float] = Field(None, ge=0, le=100)

class ScoreResponse(BaseModel):
    """Response for POST /api/v1/match/score"""
    overallScore: float = Field(..., ge=0, le=100)
    breakdown: ScoreBreakdown

class RecommendationItem(BaseModel):
    """Single recommendation item"""
    opportunityId: Optional[str] = None
    applicantId: Optional[str] = None
    matchingScore: float = Field(..., ge=0, le=100)

class RecommendationMetadata(BaseModel):
    """Metadata for recommendations"""
    total: int = Field(..., ge=0)
    page: int = Field(..., ge=1)
    limit: int = Field(..., ge=1)
    totalPages: int = Field(..., ge=0)

class RecommendationResponse(BaseModel):
    """Response for recommendation endpoints"""
    metadata: RecommendationMetadata
    data: List[RecommendationItem]

# ============= Event Schemas (for Celery workers) =============

class UserProfileUpdatedEvent(BaseModel):
    """Event schema for user.profile.updated"""
    userId: str
    gpa: Optional[float] = None
    major: Optional[str] = None
    university: Optional[str] = None
    yearOfStudy: Optional[int] = None
    skills: Optional[List[str]] = []
    researchInterests: Optional[List[str]] = []
    
class ScholarshipCreatedEvent(BaseModel):
    """Event schema for scholarship.created"""
    # Accept both 'opportunityId' (old) and 'id' (from Java service)
    opportunityId: Optional[str] = None
    id: Optional[int] = None  # Java sends 'id' instead of 'opportunityId'
    opportunityType: str = "scholarship"
    title: Optional[str] = None
    description: Optional[str] = None
    minGpa: Optional[float] = None
    requiredSkills: Optional[List[str]] = []
    preferredMajors: Optional[List[str]] = []
    researchAreas: Optional[List[str]] = []
    
    def get_opportunity_id(self) -> str:
        """Get opportunity ID from either field"""
        return str(self.opportunityId or self.id or "")

class ScholarshipUpdatedEvent(BaseModel):
    """Event schema for scholarship.updated (same as created)"""
    # Accept both 'opportunityId' (old) and 'id' (from Java service)
    opportunityId: Optional[str] = None
    id: Optional[int] = None  # Java sends 'id' instead of 'opportunityId'
    opportunityType: str = "scholarship"
    title: Optional[str] = None
    description: Optional[str] = None
    minGpa: Optional[float] = None
    requiredSkills: Optional[List[str]] = []
    preferredMajors: Optional[List[str]] = []
    researchAreas: Optional[List[str]] = []
    
    def get_opportunity_id(self) -> str:
        """Get opportunity ID from either field"""
        return str(self.opportunityId or self.id or "")

# ============= Health Check =============

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: datetime
    database: str
    rabbitmq: str
