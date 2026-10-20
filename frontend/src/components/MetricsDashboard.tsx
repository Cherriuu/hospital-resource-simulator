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

    const utilizationLabels: Record<string, string> = {
        general_ward_bed: "General ward beds",
        icu_bed: "ICU beds",
        operating_room: "Operating rooms",
        isolation_room: "Isolation rooms",
        imaging_room: "Imaging rooms",
        physician: "Physicians",
        nurse: "Nurses",
        surgeon: "Surgeons",
        anesthesiologist: "Anesthesiologists"
    };

    const utilizationEntries = Object.entries(metrics.utilization ?? {})
        .map(([name, value]) => ({
            name,
            label: utilizationLabels[name] ?? name,
            value: Number(value) || 0
        }))
        .sort((a, b) => b.value - a.value);

    const blockedEntries = Object.entries(metrics.blockedBy ?? {})
        .map(([name, value]) => ({
            name,
            label: utilizationLabels[name] ?? name,
            value: Number(value) || 0
        }))
        .sort((a, b) => b.value - a.value);

    const totalBlocked = blockedEntries.reduce((sum, entry) => sum + entry.value, 0);
    const topBlocker = blockedEntries[0];
    const topBlockingText = topBlocker && topBlocker.value > 0 && totalBlocked > 0
        ? `Most waits were blocked by: ${topBlocker.label} (${((topBlocker.value / totalBlocked) * 100).toFixed(0)}%)`
        : "No patients were blocked by a missing resource.";

    return (
        <div className="mt-8">
            <h2 className="font-serif text-2xl mb-4">
                Simulation Results
            </h2>

            <p className="mb-4 font-serif text-xl text-orange-950">
                {metrics.completedPatients} of {metrics.requestedPatients} patients treated
            </p>

            {metrics.untreatedPatients > 0 && (
                <div className="mb-4 rounded border border-orange-300 bg-orange-100 px-4 py-3 font-serif text-sm text-orange-900">
                    {metrics.untreatedPatients} patients were never treated. Wait times only include treated patients.
                </div>
            )}

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
                    title="Untreated Patients"
                    value={metrics.untreatedPatients}
                    unit="patients"
                />

                <MetricCard
                    title="Simulation Duration"
                    value={metrics.simulationDuration}
                    unit="min"
                />
            </div>

            <div className="mt-8 rounded border border-orange-950 bg-amber-50 p-5">
                <h3 className="font-serif text-2xl mb-4">
                    Bottlenecks
                </h3>

                <p className="mb-4 font-serif text-base text-orange-950">
                    {topBlockingText}
                </p>

                <div className="space-y-3">
                    {utilizationEntries.map(({ label, value }) => (
                        <div key={label}>
                            <div className="mb-1 flex items-center justify-between text-sm font-serif text-orange-950">
                                <span>{label}</span>
                                <span>{value.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-orange-200">
                                <div
                                    className="h-full rounded-full bg-orange-600"
                                    style={{ width: `${Math.min(value, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 text-sm font-serif text-orange-950">
                    <div className="rounded border border-orange-300 bg-orange-100 p-3">
                        Average queue length: {metrics.averageQueueLength.toFixed(1)} patients
                    </div>
                    <div className="rounded border border-orange-300 bg-orange-100 p-3">
                        Max queue length: {metrics.maxQueueLength}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MetricsDashboard;