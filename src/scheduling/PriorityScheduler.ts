import type { Patient } from "../models/patient";
import type { Scheduler } from "./Scheduler";

const priorityRank = {
    non_urgent: 1,
    less_urgent: 2,
    urgent: 3,
    emergent: 4,
    resuscitation: 5
};

export class PriorityScheduler implements Scheduler {
    public orderPatients(waitingPatients: Patient[], currentTime: number): Patient[] {
        // sort the waiting patients by priority (higher priority first) and then by arrival time
        const CopyofWaitingPatients = waitingPatients.slice();
        
        CopyofWaitingPatients.sort((a, b) => {
            if (a.priority === b.priority) {
                return a.arrivalTime - b.arrivalTime;
            }
            else {
                return priorityRank[b.priority] - priorityRank[a.priority];
            }
        })
        return CopyofWaitingPatients;
    }
}