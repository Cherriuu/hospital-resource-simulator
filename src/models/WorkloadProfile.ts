export type WorkloadType = 'NORMAL' | 'MASS_CASUALTY' | 'FLU_SURGE';

export interface PriorityDistributions {
    readonly non_urgent: number;
    readonly less_urgent: number;
    readonly urgent: number;
    readonly emergent: number;
    readonly resuscitation: number;
}

export interface NumericRange {
    readonly min: number;
    readonly max: number;
}

export interface TreatmentTimeRanges {
    readonly non_urgent_range: NumericRange;
    readonly less_urgent_range: NumericRange;
    readonly urgent_range: NumericRange;
    readonly emergent_range: NumericRange;
    readonly resuscitation_range: NumericRange;
}

export interface ResourceProbabilities {
    readonly general_ward_bed: number;
    readonly icu_bed: number;
    readonly operating_room: number;
    readonly isolation_room: number;
    readonly imaging_room: number;
}

export interface WorkloadProfile {
    readonly event_type: WorkloadType;
    readonly patient_rate: number;
    readonly priority_distribution: PriorityDistributions;
    readonly treatment_range: TreatmentTimeRanges;
    readonly resource_probability: ResourceProbabilities;
}

