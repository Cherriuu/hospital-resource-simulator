import type { Patient } from "../models/patient";
import type { Scheduler } from "./Scheduler";

const priorityRank = {
    non_urgent: 1,
    less_urgent: 2,
    urgent: 3,
    emergent: 4,
    resuscitation: 5
};

// for every 30 minutes a patient waits, their priority increases by 1.
export class PriorityandAgingScheduler implements Scheduler {

    public orderPatients(waitingPatients: Patient[], currentTime: number): Patient[] {

        const copyOfWaitingPatients = waitingPatients.slice();

        copyOfWaitingPatients.sort((a, b) => {

            const aWaitingTime = currentTime - a.arrivalTime;
            const bWaitingTime = currentTime - b.arrivalTime;

            const aAgingBonus = Math.floor(aWaitingTime / 30);
            const bAgingBonus = Math.floor(bWaitingTime / 30);

            const aEffectivePriority =
                priorityRank[a.priority] + aAgingBonus;

            const bEffectivePriority =
                priorityRank[b.priority] + bAgingBonus;

            if (aEffectivePriority === bEffectivePriority) {
                return a.arrivalTime - b.arrivalTime;
            }

            return bEffectivePriority - aEffectivePriority;
        });

        return copyOfWaitingPatients;
    }
}