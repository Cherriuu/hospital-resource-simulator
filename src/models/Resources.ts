export interface ResourceCounts {
    general_ward_bed: number;
    icu_bed: number;
    operating_room: number;
    isolation_room: number;
    imaging_room: number;
}

export interface PersonnelCounts {
    physician: number;
    nurse: number;
    surgeon: number;
    anesthesiologist: number;
}

export interface HospitalCapacity {
    readonly resources: ResourceCounts;
    readonly personnel: PersonnelCounts;
}

export interface ResourceSnapshot {
    readonly total: HospitalCapacity;
    readonly available: HospitalCapacity;
}