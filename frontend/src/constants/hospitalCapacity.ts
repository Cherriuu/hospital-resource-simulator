export type HospitalCapacity = {
    resources: {
        general_ward_bed: number;
        icu_bed: number;
        operating_room: number;
        isolation_room: number;
        imaging_room: number;
    };
    personnel: {
        physician: number;
        nurse: number;
        surgeon: number;
        anesthesiologist: number;
    };
};

export const DEFAULT_HOSPITAL_CAPACITY: HospitalCapacity = {
    resources: {
        general_ward_bed: 100,
        icu_bed: 20,
        operating_room: 5,
        isolation_room: 10,
        imaging_room: 15
    },
    personnel: {
        physician: 30,
        nurse: 50,
        surgeon: 10,
        anesthesiologist: 5
    }
};

export const SMALL_COMMUNITY_HOSPITAL: HospitalCapacity = {
    resources: {
        general_ward_bed: 40,
        icu_bed: 6,
        operating_room: 2,
        isolation_room: 4,
        imaging_room: 5
    },
    personnel: {
        physician: 10,
        nurse: 20,
        surgeon: 3,
        anesthesiologist: 2
    }
};

export const LARGE_REGIONAL_HOSPITAL: HospitalCapacity = {
    resources: {
        general_ward_bed: 250,
        icu_bed: 50,
        operating_room: 12,
        isolation_room: 25,
        imaging_room: 35
    },
    personnel: {
        physician: 70,
        nurse: 130,
        surgeon: 25,
        anesthesiologist: 12
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
