import type { Patient } from "../models/patient";

export interface Scheduler {
    orderPatients(waitingPatients: Patient[], currentTime: number): Patient[];
}