package com.edumatch.scholarship.dto;
import lombok.Data;

@Data
public class OpportunityDetailDto {
    private OpportunityDto opportunity;
    private Float matchScore;

    public OpportunityDetailDto(OpportunityDto opportunity) {
        this.opportunity = opportunity;
        this.matchScore = null;
    }
}