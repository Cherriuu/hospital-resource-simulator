import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import app from "../api/simulations";
import healthApp from "../api/health";
import compareApp from "../api/simulations/compare";
import { InitialResourceSnapshot } from "../src/resources/resourcemanager";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
    await new Promise<void>((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server address");
    baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
}));

it("exposes the health endpoint through the Vercel entrypoint", async () => {
    expect(healthApp).toBe(app);
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Hospital Simulator API is running" });
});

it("exposes the compare endpoint through the Vercel entrypoint", async () => {
    expect(compareApp).toBe(app);
    const response = await fetch(`${baseUrl}/api/simulations/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            workloadProfile: "NORMAL",
            patientCount: 10,
            randomSeed: 123,
            capacity: structuredClone(InitialResourceSnapshot.total)
        })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["FCFS", "PRIORITY", "PRIORITY_AGING"]);
    expect(body.FCFS.arrivalSpanHours).toBeGreaterThan(0);
    expect(Array.isArray(body.FCFS.overloadedResources)).toBe(true);
});

const configurations = ["NORMAL", "FLU_SURGE", "MASS_CASUALTY"].flatMap(
    workloadProfile => ["FCFS", "PRIORITY", "PRIORITY_AGING"].map(
        schedulingAlgorithm => ({ workloadProfile, schedulingAlgorithm })
    )
);

describe.each(configurations)("$workloadProfile / $schedulingAlgorithm", (configuration) => {
    it("returns metrics for every requested patient", async () => {
        const response = await fetch(`${baseUrl}/api/simulations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...configuration, patientCount: 100, randomSeed: 123 })
        });
        expect(response.status).toBe(200);
        const metrics = await response.json();
        expect(metrics.completedPatients).toBe(100);
        expect(metrics.simulationDuration).toBeGreaterThan(0);
        expect(Number.isFinite(metrics.averageWait)).toBe(true);
        expect(metrics.averageWaitByPriority).toHaveProperty("resuscitation");
        expect(metrics.arrivalSpanHours).toBeGreaterThan(0);
        expect(Array.isArray(metrics.overloadedResources)).toBe(true);
    });
});

it("returns a useful error for invalid configuration", async () => {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workloadProfile: "NORMAL", schedulingAlgorithm: "FCFS", patientCount: 0, randomSeed: 123 })
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Patient count must be between 1 and 10,000" });
});

it("rejects invalid capacities", async () => {
    const invalidCapacity = {
        resources: { ed_bed: -1, resus_bay: 1, isolation_room: 1 },
        personnel: { physician: 6, nurse: 12 }
    };

    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            workloadProfile: "NORMAL",
            schedulingAlgorithm: "FCFS",
            patientCount: 10,
            randomSeed: 123,
            capacity: invalidCapacity
        })
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("capacity");
});

it("normal with default capacity reports no overloaded resources", async () => {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            workloadProfile: "NORMAL",
            schedulingAlgorithm: "FCFS",
            patientCount: 1000,
            randomSeed: 123,
            capacity: structuredClone(InitialResourceSnapshot.total)
        })
    });

    expect(response.status).toBe(200);
    const metrics = await response.json();
    expect(metrics.overloadedResources).toEqual([]);
});

async function runAverageWait(workloadProfile: "NORMAL" | "MASS_CASUALTY", patientCount: number) {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            workloadProfile,
            schedulingAlgorithm: "FCFS",
            patientCount,
            randomSeed: 123,
            capacity: structuredClone(InitialResourceSnapshot.total)
        })
    });

    expect(response.status).toBe(200);
    return response.json();
}

it("mass casualty recovers: waits at 2k and 5k are within 25% and 5k has no overload", async () => {
    const at2k = await runAverageWait("MASS_CASUALTY", 2000);
    const at5k = await runAverageWait("MASS_CASUALTY", 5000);

    const ratio = Math.abs(at5k.averageWait - at2k.averageWait) / at2k.averageWait;
    expect(ratio).toBeLessThanOrEqual(0.25);
    expect(at5k.overloadedResources).toEqual([]);
}, 30000);

it("normal is stable: waits at 2k and 5k are within 25% and 5k has no overload", async () => {
    const at2k = await runAverageWait("NORMAL", 2000);
    const at5k = await runAverageWait("NORMAL", 5000);

    const ratio = Math.abs(at5k.averageWait - at2k.averageWait) / at2k.averageWait;
    expect(ratio).toBeLessThanOrEqual(0.25);
    expect(at5k.overloadedResources).toEqual([]);
}, 30000);
