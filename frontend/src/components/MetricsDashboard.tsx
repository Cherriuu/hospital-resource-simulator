import MetricCard from "./MetricCard";
import type { SimulationMetrics } from "../types/SimulationMetrics";

type MetricsDashboardProps = {
    metrics: SimulationMetrics | null;
};

function MetricsDashboard({ metrics }: MetricsDashboardProps) {
    if (metrics === null) {
        return (
            <div className="mt-8">
                <h2 className="font-serif text-2xl mb-4">
                    Simulation Results
                </h2>

                <p className="font-serif">
                    Run a simulation to see results.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="font-serif text-2xl mb-4">
                Simulation Results
            </h2>

            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    title="Average Wait"
                    value={metrics.averageWait}
                    unit="min"
                />

                <MetricCard
                    title="Median Wait"
                    value={metrics.medianWait}
                    unit="min"
                />

                <MetricCard
                    title="P95 Wait"
                    value={metrics.p95Wait}
                    unit="min"
                />

                <MetricCard
                    title="Max Wait"
                    value={metrics.maxWait}
                    unit="min"
                />

                <MetricCard
                    title="Throughput"
                    value={metrics.throughput}
                    unit="patients/hr"
                />

                <MetricCard
                    title="Patients Waited"
                    value={metrics.percentWaited}
                    unit="%"
                />

                <MetricCard
                    title="Completed Patients"
                    value={metrics.completedPatients}
                    unit="patients"
                />

                <MetricCard
                    title="Simulation Duration"
                    value={metrics.simulationDuration}
                    unit="min"
                />
            </div>
        </div>
    );
}

export default MetricsDashboard;