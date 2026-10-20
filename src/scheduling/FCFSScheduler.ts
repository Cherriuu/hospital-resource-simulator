import type { Patient } from "../models/Patient.js";
import type { Scheduler } from "./Scheduler.js";

export class FCFSScheduler implements Scheduler {

    public orderPatients(waitingPatients: Patient[], currentTime: number): Patient[] {
        // sort the waiting patients by arrival time and return the sorted array
        const copyOfWaitingPatients = waitingPatients.slice();
        copyOfWaitingPatients.sort((a, b) => a.arrivalTime - b.arrivalTime);
        return copyOfWaitingPatients;
    }

}

