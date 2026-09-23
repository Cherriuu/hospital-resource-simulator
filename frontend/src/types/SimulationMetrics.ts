export type SimulationMetrics = {
    averageWait: number;
    medianWait: number;
    p95Wait: number;
    maxWait: number;
    throughput: number;
    percentWaited: number;
    completedPatients: number;
    simulationDuration: number;

    averageWaitByPriority: {
        nonUrgent: number;
        lessUrgent: number;
        urgent: number;
        emergent: number;
        resuscitation: number;
    };
};