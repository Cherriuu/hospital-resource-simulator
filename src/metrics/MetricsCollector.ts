import type { SimulationResult } from "../models/SimulationResult";

export class MetricsCollector {
    private simulationResults: SimulationResult[] = [];

    constructor(simulationResults: SimulationResult[]) {
        this.simulationResults = simulationResults;
    }

    public calculateAverageWaitingTime(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }

        let totalWaitingTime = 0;

        for (const result of this.simulationResults) {
            totalWaitingTime += result.waitingTime;
        }

        return totalWaitingTime / this.simulationResults.length;
    }

    public calculateWaitingPercentage(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }

        let patientsWhoWaited = 0;

        for (const result of this.simulationResults) {
            if (result.waitingTime > 0) {
                patientsWhoWaited++;
            }
        }
        return (patientsWhoWaited / this.simulationResults.length) * 100;
    }

    public calculateMedianWaitingTime(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        let array: number[] = [];
        for (const result of this.simulationResults) {
            array.push(result.waitingTime);
        }
        array.sort((a, b) => a - b);
        const mid = Math.floor(array.length / 2);

        if (array.length % 2 === 0) {
            return (array[mid - 1] + array[mid]) / 2;
        } else {
            return array[mid];
        }
    }

    public findMaxWaitingTime(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        let maxWaitingTime = 0;
        for (const result of this.simulationResults) {
            if (result.waitingTime > maxWaitingTime) {
                maxWaitingTime = result.waitingTime;
            }
        }
        return maxWaitingTime;
    }

    public completedPatientsCount(): number {
        return this.simulationResults.length;
    }

   public calculateP95WaitingTime(): number | undefined {
    if (this.simulationResults.length === 0) {
        return undefined;
    }

    const waitingTimes = this.simulationResults.map(
        result => result.waitingTime
    );

    waitingTimes.sort((a, b) => a - b);

    const index = Math.ceil(0.95 * waitingTimes.length) - 1;

    return waitingTimes[index];
    }

    public calculateAverageWaitingTimeForNonUrgentPatients(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        const nonUrgentPatients = this.simulationResults.filter(
            result => result.patientPriority === "non_urgent"
        );
        if (nonUrgentPatients.length === 0) {
            return undefined;
        }
        let totalWaitingTime = 0;

        for (const patient of nonUrgentPatients) {
            totalWaitingTime += patient.waitingTime;
        }
        return totalWaitingTime / nonUrgentPatients.length;
    }

     public calculateAverageWaitingTimeForLessUrgentPatients(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        const lessUrgentPatients = this.simulationResults.filter(
            result => result.patientPriority === "less_urgent"
        );
        if (lessUrgentPatients.length === 0) {
            return undefined;
        }
        let totalWaitingTime = 0;

        for (const patient of lessUrgentPatients) {
            totalWaitingTime += patient.waitingTime;
        }
        return totalWaitingTime / lessUrgentPatients.length;
    }

     public calculateAverageWaitingTimeForUrgentPatients(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        const urgentPatients = this.simulationResults.filter(
            result => result.patientPriority === "urgent"
        );
        if (urgentPatients.length === 0) {
            return undefined;
        }
        let totalWaitingTime = 0;

        for (const patient of urgentPatients) {
            totalWaitingTime += patient.waitingTime;
        }
        return totalWaitingTime / urgentPatients.length;
    }

     public calculateAverageWaitingTimeForEmergent(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        const emergentPatients = this.simulationResults.filter(
            result => result.patientPriority === "emergent"
        );
        if (emergentPatients.length === 0) {
            return undefined;
        }
        let totalWaitingTime = 0;

        for (const patient of emergentPatients) {
            totalWaitingTime += patient.waitingTime;
        }
        return totalWaitingTime / emergentPatients.length;
    }

     public calculateAverageWaitingTimeForResuscitationPatients(): number | undefined {
        if (this.simulationResults.length === 0) {
            return undefined;
        }
        const resuscitationPatients = this.simulationResults.filter(
            result => result.patientPriority === "resuscitation"
        );
        if (resuscitationPatients.length === 0) {
            return undefined;
        }
        let totalWaitingTime = 0;

        for (const patient of resuscitationPatients) {
            totalWaitingTime += patient.waitingTime;
        }
        return totalWaitingTime / resuscitationPatients.length;
    }

    public calculateSimulationDuration(): number | undefined {
    if (this.simulationResults.length === 0) {
        return undefined;
    }

    let latestEndTime = 0;

    for (const result of this.simulationResults) {
        if (result.treatmentEndTime > latestEndTime) {
            latestEndTime = result.treatmentEndTime;
        }
    }

    return latestEndTime;
    }

    // The number of patients treated per hour.
    public calculateThroughput(): number | undefined {
    const duration = this.calculateSimulationDuration();

    if (duration === undefined || duration === 0) {
        return undefined;
    }

    const durationInHours = duration / 60;

    return this.simulationResults.length / durationInHours;
    }
}