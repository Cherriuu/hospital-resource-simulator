import type { WorkloadProfile } from "../models/workloadprofile";

export const NormalProfile: WorkloadProfile = {
    event_type: "NORMAL",

    patient_rate: 10,

    priority_distribution: {
        non_urgent: 0.16,
        less_urgent: 0.15,
        urgent: 0.43,
        emergent: 0.245,
        resuscitation: 0.015
    },

    treatment_range: {
        non_urgent_range: {
            min: 60,
            max: 120
        },

        less_urgent_range: {
            min: 90,
            max: 180
        },

        urgent_range: {
            min: 120,
            max: 300
        },

        emergent_range: {
            min: 120,
            max: 300
        },

        resuscitation_range: {
            min: 120,
            max: 300
        }
    },

    resource_probability: {
        general_ward_bed: 0.30,
        icu_bed: 0.08,
        operating_room: 0.05,
        isolation_room: 0.05,
        imaging_room: 0.30
    }
};


export const FluSurgeProfile: WorkloadProfile = {
    event_type: "FLU_SURGE",

    patient_rate: 15,

    priority_distribution: {
        non_urgent: 0.20,
        less_urgent: 0.25,
        urgent: 0.40,
        emergent: 0.13,
        resuscitation: 0.02
    },

    treatment_range: {
        non_urgent_range: {
            min: 60,
            max: 120
        },

        less_urgent_range: {
            min: 90,
            max: 180
        },

        urgent_range: {
            min: 120,
            max: 300
        },

        emergent_range: {
            min: 120,
            max: 300
        },

        resuscitation_range: {
            min: 120,
            max: 300
        }
    },

    resource_probability: {
        general_ward_bed: 0.45,
        icu_bed: 0.10,
        operating_room: 0.02,
        isolation_room: 0.25,
        imaging_room: 0.25
    }
};


export const MassCasultyProfile: WorkloadProfile = {
    event_type: "MASS_CASUALTY",

    patient_rate: 40,

    priority_distribution: {
        non_urgent: 0.10,
        less_urgent: 0.20,
        urgent: 0.35,
        emergent: 0.25,
        resuscitation: 0.10
    },

    treatment_range: {
        non_urgent_range: {
            min: 60,
            max: 120
        },

        less_urgent_range: {
            min: 90,
            max: 180
        },

        urgent_range: {
            min: 120,
            max: 300
        },

        emergent_range: {
            min: 120,
            max: 300
        },

        resuscitation_range: {
            min: 120,
            max: 300
        }
    },

    resource_probability: {
        general_ward_bed: 0.50,
        icu_bed: 0.30,
        operating_room: 0.25,
        isolation_room: 0.05,
        imaging_room: 0.50
    }
};