import { useState } from "react";
import {
    DEFAULT_HOSPITAL_CAPACITY,
    HOSPITAL_CAPACITY_PRESETS,
    type HospitalCapacity
} from "../constants/hospitalCapacity";
import type { SimulationMetrics } from "../types/SimulationMetrics";

type SimulationControlsProps = {
    onSimulationComplete: (metrics: SimulationMetrics) => void;
};

function SimulationControls({
    onSimulationComplete
}: SimulationControlsProps) {

    const [workloadProfile, setWorkloadProfile] = useState("NORMAL");
    const [schedulingAlgorithm, setSchedulingAlgorithm] = useState("FCFS");
    const [patientCount, setPatientCount] = useState("100");
    const [randomSeed, setRandomSeed] = useState("123");
    const [capacity, setCapacity] = useState<HospitalCapacity>(DEFAULT_HOSPITAL_CAPACITY);
    const [comparisonResults, setComparisonResults] = useState<Record<string, SimulationMetrics> | null>(null);

    const [isRunning, setIsRunning] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    function updateCapacityField(
        section: "resources" | "personnel",
        field: keyof HospitalCapacity["resources"] | keyof HospitalCapacity["personnel"],
        value: number
    ) {
        setCapacity(currentCapacity => ({
            ...currentCapacity,
            [section]: {
                ...currentCapacity[section],
                [field]: value
            }
        }));
    }

    function isCurrentPreset(presetCapacity: HospitalCapacity) {
        return JSON.stringify(presetCapacity) === JSON.stringify(capacity);
    }

    async function handleRunSimulation() {
        if (isRunning) return;
        setIsRunning(true);
        setErrorMessage(null);
        setComparisonResults(null);

        const simulationConfig = {
            workloadProfile,
            schedulingAlgorithm,
            patientCount: Number(patientCount),
            randomSeed: Number(randomSeed),
            capacity
        };

        try {

            const response = await fetch("/api/simulations", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(simulationConfig)
            });


            if (!response.ok) {
                const failure = await response.json().catch(() => null);
                throw new Error(failure?.error ?? `Simulation request failed (${response.status}). Please try again.`);
            }


            const data: SimulationMetrics =
                await response.json();

            console.log(
                "Simulation results:",
                data
            );


            onSimulationComplete(data);

        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to run simulation. Please try again.");

            console.error(
                "Failed to run simulation:",
                error
            );
        } finally {
            setIsRunning(false);
        }
    }

    async function handleCompareStrategies() {
        if (isRunning) return;
        setIsRunning(true);
        setErrorMessage(null);

        const simulationConfig = {
            workloadProfile,
            patientCount: Number(patientCount),
            randomSeed: Number(randomSeed),
            capacity
        };

        try {
            const response = await fetch("/api/simulations/compare", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(simulationConfig)
            });

            if (!response.ok) {
                const failure = await response.json().catch(() => null);
                throw new Error(failure?.error ?? `Comparison request failed (${response.status}). Please try again.`);
            }

            const data = await response.json();
            setComparisonResults(data);

        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to compare strategies. Please try again.");
            console.error("Failed to compare strategies:", error);
        } finally {
            setIsRunning(false);
        }
    }

    const strategyNames = ["FCFS", "PRIORITY", "PRIORITY_AGING"];

    const comparisonRows = [
        {
            label: "Average wait",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageWait,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Median wait",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.medianWait,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "P95 wait",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.p95Wait,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Max wait",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.maxWait,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Patients waited",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.percentWaited,
            format: (value: number) => `${value.toFixed(1)}%`
        },
        {
            label: "Throughput",
            lowerBetter: false,
            getValue: (metrics: SimulationMetrics) => metrics.throughput,
            format: (value: number) => `${value.toFixed(1)} patients/hr`
        },
        {
            label: "Treated",
            lowerBetter: false,
            getValue: (metrics: SimulationMetrics) => metrics.completedPatients,
            format: (value: number, metrics: SimulationMetrics) => `${value} of ${metrics.requestedPatients}`
        },
        {
            label: "Untreated",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.untreatedPatients,
            format: (value: number) => `${value}`
        },
        {
            label: "Average queue length",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageQueueLength,
            format: (value: number) => `${value.toFixed(1)} patients`
        },
        {
            label: "Max queue length",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.maxQueueLength,
            format: (value: number) => `${value.toFixed(1)} patients`
        },
        {
            label: "Non-urgent",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageWaitByPriority.nonUrgent,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Less urgent",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageWaitByPriority.lessUrgent,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Urgent",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageWaitByPriority.urgent,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Emergent",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageWaitByPriority.emergent,
            format: (value: number) => `${value.toFixed(1)} min`
        },
        {
            label: "Resuscitation",
            lowerBetter: true,
            getValue: (metrics: SimulationMetrics) => metrics.averageWaitByPriority.resuscitation,
            format: (value: number) => `${value.toFixed(1)} min`
        }
    ];

    const hasUntreatedStrategies = comparisonResults
        ? strategyNames.some(strategy => comparisonResults[strategy]?.untreatedPatients > 0)
        : false;

    const readableTypeNames: Record<string, string> = {
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

    const comparisonContextMetrics = comparisonResults
        ? comparisonResults.FCFS ?? comparisonResults.PRIORITY ?? comparisonResults.PRIORITY_AGING
        : null;

    const overloadedComparisonSummary = comparisonContextMetrics
        ? comparisonContextMetrics.overloadedResources
            .map((entry) => `${readableTypeNames[entry.type] ?? entry.type} (${entry.loadPercent.toFixed(0)}%)`)
            .join(", ")
        : "";

    return (
    <div className="py-8">

        <h2 className="font-serif text-3xl mb-6">
            Simulation Controls
        </h2>

        <div className="flex flex-wrap items-end gap-6">

            <div>
                <label className="block font-serif text-lg mb-2">
                    Workload Profile
                </label>

                <select
                    value={workloadProfile}
                    onChange={(event) =>
                        setWorkloadProfile(event.target.value)
                    }
                    className="border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif"
                >
                    <option value="NORMAL">
                        Normal
                    </option>

                    <option value="FLU_SURGE">
                        Flu Surge
                    </option>

                    <option value="MASS_CASUALTY">
                        Mass Casualty
                    </option>
                </select>
            </div>

            <div>
                <label className="block font-serif text-lg mb-2">
                    Scheduling Algorithm
                </label>

                <select
                    value={schedulingAlgorithm}
                    onChange={(event) =>
                        setSchedulingAlgorithm(event.target.value)
                    }
                    className="border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif"
                >
                    <option value="FCFS">
                        First Come First Serve
                    </option>

                    <option value="PRIORITY">
                        Priority
                    </option>

                    <option value="PRIORITY_AGING">
                        Priority + Aging
                    </option>
                </select>
            </div>

            <div>
                <label className="block font-serif text-lg mb-2">
                    Patient Count
                </label>

                <input
                    type="number"
                    value={patientCount}
                    min={1}
                    max={10000}
                    onChange={(event) =>
                        setPatientCount(event.target.value)
                    }
                    className="border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif w-32"
                />
                <p className="mt-2 text-sm text-orange-950">Limit: 1–10,000</p>
            </div>

            <div>
                <label className="block font-serif text-lg mb-2">
                    Random Seed
                </label>

                <input
                    type="number"
                    value={randomSeed}
                    onChange={(event) =>
                        setRandomSeed(event.target.value)
                    }
                    className="border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif w-32"
                />
            </div>

            <button
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="border border-orange-950 rounded-lg px-6 py-3 bg-amber-50 font-serif hover:bg-amber-200 cursor-pointer"
            >
                {isRunning ? "Running…" : "Run Simulation"}
            </button>

            <button
                onClick={handleCompareStrategies}
                disabled={isRunning}
                className="border border-orange-950 rounded-lg px-6 py-3 bg-amber-50 font-serif hover:bg-amber-200 cursor-pointer"
            >
                Compare all strategies
            </button>

        </div>

        <div className="mt-8 border border-orange-950 rounded-lg bg-amber-50 p-5">
            <h3 className="font-serif text-2xl mb-4">
                Hospital capacity
            </h3>

            <div className="mb-4 flex flex-wrap gap-3">
                {HOSPITAL_CAPACITY_PRESETS.map((preset) => {
                    const active = isCurrentPreset(preset.capacity);

                    return (
                        <button
                            key={preset.name}
                            type="button"
                            onClick={() => setCapacity(preset.capacity)}
                            className={[
                                "border rounded-lg px-3 py-2 font-serif text-sm",
                                active
                                    ? "border-orange-950 bg-orange-200 text-orange-950"
                                    : "border-orange-950 bg-amber-50 text-orange-950 hover:bg-amber-200"
                            ].join(" ")}
                        >
                            {preset.name}
                        </button>
                    );
                })}
            </div>

            <p className="mb-5 text-sm text-orange-950">
                Presets are illustrative and not real hospital data.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <h4 className="font-serif text-xl mb-3">
                        Rooms & beds
                    </h4>

                    <div className="space-y-3">
                        {Object.entries(capacity.resources).map(([key, value]) => (
                            <div key={key}>
                                <label className="mb-1 block font-serif text-base">
                                    {key === "general_ward_bed" && "General ward beds"}
                                    {key === "icu_bed" && "ICU beds"}
                                    {key === "operating_room" && "Operating rooms"}
                                    {key === "isolation_room" && "Isolation rooms"}
                                    {key === "imaging_room" && "Imaging rooms"}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={1000}
                                    value={value}
                                    onChange={(event) =>
                                        updateCapacityField(
                                            "resources",
                                            key as keyof typeof capacity.resources,
                                            Number(event.target.value)
                                        )
                                    }
                                    className="w-full border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-xl mb-3">
                        Staff
                    </h4>

                    <div className="space-y-3">
                        {Object.entries(capacity.personnel).map(([key, value]) => (
                            <div key={key}>
                                <label className="mb-1 block font-serif text-base">
                                    {key === "physician" && "Physicians"}
                                    {key === "nurse" && "Nurses"}
                                    {key === "surgeon" && "Surgeons"}
                                    {key === "anesthesiologist" && "Anesthesiologists"}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={1000}
                                    value={value}
                                    onChange={(event) =>
                                        updateCapacityField(
                                            "personnel",
                                            key as keyof typeof capacity.personnel,
                                            Number(event.target.value)
                                        )
                                    }
                                    className="w-full border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {errorMessage && (
            <p role="alert" className="mt-4 rounded border border-red-300 bg-red-100 px-4 py-3 text-red-800 font-serif">
                {errorMessage}
            </p>
        )}

        {comparisonResults && (
            <div className="mt-8 border border-orange-950 rounded-lg bg-amber-50 p-5">
                <h3 className="font-serif text-2xl mb-4">
                    Strategy comparison
                </h3>

                {comparisonContextMetrics && (
                    <p className="mb-4 font-serif text-base text-orange-950">
                        {comparisonContextMetrics.requestedPatients} patients arriving over about {comparisonContextMetrics.arrivalSpanHours.toFixed(1)} hours.
                    </p>
                )}

                {comparisonContextMetrics && comparisonContextMetrics.overloadedResources.length > 0 && (
                    <div className="mb-4 rounded border border-orange-300 bg-orange-100 px-4 py-3 font-serif text-sm text-orange-900">
                        Overloaded: {overloadedComparisonSummary}. This hospital can't keep up with this workload, so waits keep growing the longer the simulation runs.
                    </div>
                )}

                {hasUntreatedStrategies && (
                    <div className="mb-4 rounded border border-orange-300 bg-orange-100 px-4 py-3 font-serif text-sm text-orange-900">
                        Some strategies left patients untreated. Wait times only include treated patients.
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-orange-950">
                        <thead>
                            <tr>
                                <th className="border border-orange-950 bg-amber-100 p-2 font-serif text-lg">Metric</th>
                                {strategyNames.map((strategy) => (
                                    <th key={strategy} className="border border-orange-950 bg-amber-100 p-2 font-serif text-lg">
                                        {strategy}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonRows.map((row) => {
                                const bestValue = strategyNames.reduce((best, strategy) => {
                                    const currentValue = row.getValue(comparisonResults[strategy]);
                                    if (best === null) {
                                        return currentValue;
                                    }
                                    if (row.lowerBetter) {
                                        return Math.min(best, currentValue);
                                    }
                                    return Math.max(best, currentValue);
                                }, null as number | null);

                                return (
                                    <tr key={row.label}>
                                        <th className="border border-orange-950 bg-amber-50 p-2 font-serif text-base text-left">
                                            {row.label}
                                        </th>
                                        {strategyNames.map((strategy) => {
                                            const metrics = comparisonResults[strategy];
                                            const value = row.getValue(metrics);
                                            const isBest = bestValue !== null && value === bestValue;

                                            return (
                                                <td
                                                    key={`${row.label}-${strategy}`}
                                                    className={[
                                                        "border border-orange-950 p-2 text-center",
                                                        isBest ? "bg-orange-200 font-bold" : "bg-amber-50"
                                                    ].join(" ")}
                                                >
                                                    {row.format(value, metrics)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

    </div>
);
}

export default SimulationControls;