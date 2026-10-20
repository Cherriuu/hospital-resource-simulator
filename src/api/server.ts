import express from "express";

import { PatientGenerator } from "../generators/patientgenerator.js";
import { SeededRandom } from "../random/seededrandom.js";

import {
    NormalProfile,
    MassCasualtyProfile,
    FluSurgeProfile
} from "../config/Workloadprofiles.js";

import type { WorkloadProfile } from "../models/WorkloadProfile.js";

import {
    ResourceManager,
    InitialResourceSnapshot
} from "../resources/resourcemanager.js";

import { SimulationEngine } from "../simulation/SimulationEngine.js";

import type { Scheduler } from "../scheduling/Scheduler.js";
import { FCFSScheduler } from "../scheduling/FCFSScheduler.js";
import { PriorityScheduler } from "../scheduling/PriorityScheduler.js";
import { PriorityandAgingScheduler } from "../scheduling/Priority+Aging.js";

import { MetricsCollector } from "../metrics/MetricsCollector.js";


const app = express();
app.use(express.json());


// Health check
app.get("/api/health", (req, res) => {
    res.json({
        message: "Hospital Simulator API is running"
    });
});


// Run simulation
app.post("/api/simulations", (req, res) => {
    try {
        const {
            workloadProfile,
            schedulingAlgorithm,
            patientCount,
            randomSeed
        } = req.body;


        // Validate request
        if (
            !workloadProfile ||
            !schedulingAlgorithm ||
            patientCount === undefined ||
            randomSeed === undefined
        ) {
            return res.status(400).json({
                error: "Missing simulation configuration"
            });
        }

        if (
            !Number.isInteger(patientCount) ||
            patientCount <= 0
        ) {
            return res.status(400).json({
                error: "Patient count must be a positive integer"
            });
        }


        if (!Number.isFinite(randomSeed)) {
            return res.status(400).json({
                error: "Random seed must be a valid number"
            });
        }

        let selectedProfile: WorkloadProfile;

        if (workloadProfile === "NORMAL") {
            selectedProfile = NormalProfile;
        }
        else if (workloadProfile === "MASS_CASUALTY") {
            selectedProfile = MassCasualtyProfile;
        }
        else if (workloadProfile === "FLU_SURGE") {
            selectedProfile = FluSurgeProfile;
        }
        else {
            return res.status(400).json({
                error: `Unknown workload profile: ${workloadProfile}`
            });
        }

        let scheduler: Scheduler;

        if (schedulingAlgorithm === "FCFS") {
            scheduler = new FCFSScheduler();
        }
        else if (schedulingAlgorithm === "PRIORITY") {
            scheduler = new PriorityScheduler();
        }
        else if (schedulingAlgorithm === "PRIORITY_AGING") {
            scheduler = new PriorityandAgingScheduler();
        }
        else {
            return res.status(400).json({
                error: `Unknown scheduling algorithm: ${schedulingAlgorithm}`
            });
        }

        const seededRandom = new SeededRandom(randomSeed);

        const generator = new PatientGenerator(
            seededRandom,
            selectedProfile
        );

        const patients =
            generator.generatePatients(patientCount);

        const resourceSnapshot =
            structuredClone(InitialResourceSnapshot);

        const resourceManager =
            new ResourceManager(resourceSnapshot);

        const simulation = new SimulationEngine(
            resourceManager,
            patients,
            scheduler
        );

        simulation.RunSimulation();

        const simulationResults =
            simulation.getSimulationResults();

        const metricsCollector =
            new MetricsCollector(simulationResults);

        const metrics =
            metricsCollector.collectMetrics();


        console.log("Simulation completed:", {
            workloadProfile,
            schedulingAlgorithm,
            patientCount,
            randomSeed
        });

        res.json({
            averageWait:
                metrics.averageWaitingTime ?? 0,

            medianWait:
                metrics.medianWaitingTime ?? 0,

            p95Wait:
                metrics.p95WaitingTime ?? 0,

            maxWait:
                metrics.maxWaitingTime ?? 0,

            percentWaited:
                metrics.waitingPercentage ?? 0,

            throughput:
                metrics.throughput ?? 0,

            completedPatients:
                metrics.completedPatients,

            simulationDuration:
                metrics.simulationDuration ?? 0,

            averageWaitByPriority: {
                nonUrgent:
                    metrics.averageWaitingTimeNonUrgent ?? 0,

                lessUrgent:
                    metrics.averageWaitingTimeLessUrgent ?? 0,

                urgent:
                    metrics.averageWaitingTimeUrgent ?? 0,

                emergent:
                    metrics.averageWaitingTimeEmergent ?? 0,

                resuscitation:
                    metrics.averageWaitingTimeResuscitation ?? 0
            }
        });

    } catch (error) {

        console.error(
            "Simulation failed:",
            error
        );

        res.status(500).json({
            error: "Simulation failed"
        });
    }
});


export default app;
