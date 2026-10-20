import type { WorkloadProfile } from "../models/WorkloadProfile.js";

// Normal triage mix from CDC NHAMCS 2022 Table 6, rescaled to exclude untriaged/unknown visits.
export const NormalProfile: WorkloadProfile = {
    event_type: "NORMAL",

    patient_rate: 10,

    priority_distribution: {
        non_urgent: 0.028,
        less_urgent: 0.297,
        urgent: 0.506,
        emergent: 0.154,
        resuscitation: 0.015
    },
    isolation_probability: 0.03
};


export const FluSurgeProfile: WorkloadProfile = {
    event_type: "FLU_SURGE",

    patient_rate: NormalProfile.patient_rate,

    priority_distribution: { ...NormalProfile.priority_distribution },

    isolation_probability: NormalProfile.isolation_probability,

    surge: {
        start_hour: 0,
        duration_hours: 48,
        patient_rate: 12,
        priority_distribution: { ...NormalProfile.priority_distribution },
        isolation_probability: 0.20
    }
};


export const MassCasualtyProfile: WorkloadProfile = {
    event_type: "MASS_CASUALTY",

    patient_rate: NormalProfile.patient_rate,

    priority_distribution: { ...NormalProfile.priority_distribution },

    isolation_probability: 0.03,

    surge: {
        start_hour: 2,
        duration_hours: 6,
        // Scenario assumption for surge triage mix.
        patient_rate: 40,
        priority_distribution: {
            non_urgent: 0.10,
            less_urgent: 0.20,
            urgent: 0.35,
            emergent: 0.25,
            resuscitation: 0.10
        }
    }
};