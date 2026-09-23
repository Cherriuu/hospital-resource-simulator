import { useState } from "react";
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


    async function handleRunSimulation() {

        const simulationConfig = {
            workloadProfile,
            schedulingAlgorithm,
            patientCount: Number(patientCount),
            randomSeed: Number(randomSeed)
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
                throw new Error("Simulation failed");
            }


            const data: SimulationMetrics =
                await response.json();

            console.log(
                "Simulation results:",
                data
            );


            onSimulationComplete(data);

        } catch (error) {

            console.error(
                "Failed to run simulation:",
                error
            );
        }
    }


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
                    onChange={(event) =>
                        setPatientCount(event.target.value)
                    }
                    className="border border-orange-950 rounded-lg p-3 bg-amber-50 font-serif w-32"
                />
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
                className="border border-orange-950 rounded-lg px-6 py-3 bg-amber-50 font-serif hover:bg-amber-200 cursor-pointer"
            >
                Run Simulation
            </button>

        </div>

    </div>
);
}

export default SimulationControls;