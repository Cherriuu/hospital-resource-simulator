export interface ResourceCounts {
    ed_bed: number;
    resus_bay: number;
    isolation_room: number;
}

export interface PersonnelCounts {
    physician: number;
    nurse: number;
}

export interface HospitalCapacity {
    readonly resources: ResourceCounts;
    readonly personnel: PersonnelCounts;
}

export interface ResourceSnapshot {
    readonly total: HospitalCapacity;
    readonly available: HospitalCapacity;
}