export type HospitalCapacity = {
    resources: {
        ed_bed: number;
        resus_bay: number;
        isolation_room: number;
    };
    personnel: {
        physician: number;
        nurse: number;
    };
};

// Keep these numbers in sync with InitialResourceSnapshot in src/resources/resourcemanager.ts.
export const DEFAULT_HOSPITAL_CAPACITY: HospitalCapacity = {
    resources: {
        ed_bed: 48,
        resus_bay: 4,
        isolation_room: 6
    },
    personnel: {
        physician: 6,
        nurse: 15
    }
};

export const SMALL_COMMUNITY_HOSPITAL: HospitalCapacity = {
    resources: {
        ed_bed: 24,
        resus_bay: 2,
        isolation_room: 3
    },
    personnel: {
        physician: 4,
        nurse: 8
    }
};

export const LARGE_REGIONAL_HOSPITAL: HospitalCapacity = {
    resources: {
        ed_bed: 96,
        resus_bay: 8,
        isolation_room: 12
    },
    personnel: {
        physician: 12,
        nurse: 30
    }
};

export const HOSPITAL_CAPACITY_PRESETS = [
    {
        name: "Small community hospital",
        capacity: SMALL_COMMUNITY_HOSPITAL
    },
    {
        name: "Default",
        capacity: DEFAULT_HOSPITAL_CAPACITY
    },
    {
        name: "Large regional hospital",
        capacity: LARGE_REGIONAL_HOSPITAL
    }
] as const;
