export interface SimulationMetrics {

    readonly averageWaitingTime: number | undefined;

    readonly medianWaitingTime: number | undefined;

    readonly p95WaitingTime: number | undefined;

    readonly maxWaitingTime: number | undefined;

    readonly waitingPercentage: number | undefined;

    readonly completedPatients: number;

    readonly simulationDuration: number | undefined;

    readonly throughput: number | undefined;

    readonly averageWaitingTimeNonUrgent: number | undefined;

    readonly averageWaitingTimeLessUrgent: number | undefined;

    readonly averageWaitingTimeUrgent: number | undefined;

    readonly averageWaitingTimeEmergent: number | undefined;

    readonly averageWaitingTimeResuscitation: number | undefined;

}