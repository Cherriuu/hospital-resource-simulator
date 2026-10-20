export type WorkloadType = 'NORMAL' | 'MASS_CASUALTY' | 'FLU_SURGE';

export interface PriorityDistributions {
    readonly non_urgent: number;
    readonly less_urgent: number;
    readonly urgent: number;
    readonly emergent: number;
    readonly resuscitation: number;
}

export interface WorkloadSurge {
    readonly start_hour: number;
    readonly duration_hours: number;
    readonly patient_rate: number;
    readonly priority_distribution: PriorityDistributions;
    // Optional: share of patients who need isolation during the surge. Falls back to the profile's value.
    readonly isolation_probability?: number;
}

export interface WorkloadProfile {
    readonly event_type: WorkloadType;
    readonly patient_rate: number;
    readonly priority_distribution: PriorityDistributions;
    readonly isolation_probability: number;
    readonly surge?: WorkloadSurge;
}

