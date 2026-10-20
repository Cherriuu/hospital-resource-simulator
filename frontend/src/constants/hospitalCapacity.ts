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

export const DEFAULT_HOSPITAL_CAPACITY: HospitalCapacity = {
    resources: {
        ed_bed: 48,
        resus_bay: 1,
        isolation_room: 2
    },
    personnel: {
        physician: 6,
        nurse: 15
    }
};

export const SMALL_COMMUNITY_HOSPITAL: HospitalCapacity = {
    resources: {
        ed_bed: 24,
        resus_bay: 1,
        isolation_room: 1
    },
    personnel: {
        physician: 4,
        nurse: 8
    }
};

export const LARGE_REGIONAL_HOSPITAL: HospitalCapacity = {
    resources: {
        ed_bed: 96,
        resus_bay: 2,
        isolation_room: 4
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
