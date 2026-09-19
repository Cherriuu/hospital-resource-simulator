import type { PatientPriority } from "./patient";

export interface SimulationResult {
    readonly patientId: number;
    readonly patientPriority: PatientPriority;
    readonly arrivalTime: number;
    readonly treatmentStartTime: number;
    readonly treatmentEndTime: number;
    readonly waitingTime: number;
    readonly treatmentDuration: number;
}

