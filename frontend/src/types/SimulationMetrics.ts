export type SimulationMetrics = {
    averageWait: number;
    medianWait: number;
    p95Wait: number;
    maxWait: number;
    throughput: number;
    percentWaited: number;
    completedPatients: number;
    untreatedPatients: number;
    requestedPatients: number;
    simulationDuration: number;
    utilization: Record<string, number>;
    averageQueueLength: number;
    maxQueueLength: number;
    blockedBy: Record<string, number>;
    arrivalSpanHours: number;
    overloadedResources: Array<{
        type: string;
        loadPercent: number;
    }>;

    averageWaitByPriority: {
        nonUrgent: number;
        lessUrgent: number;
        urgent: number;
        emergent: number;
        resuscitation: number;
    };
};