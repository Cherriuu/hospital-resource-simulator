import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import app from "../api/simulations";
import healthApp from "../api/health";
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

it("rejects patient counts above 10,000", async () => {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workloadProfile: "NORMAL", schedulingAlgorithm: "FCFS", patientCount: 10001, randomSeed: 123 })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Patient count must be between 1 and 10,000" });
});

it("accepts a patient count of 10,000", async () => {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workloadProfile: "MASS_CASUALTY", schedulingAlgorithm: "PRIORITY", patientCount: 10000, randomSeed: 123 })
    });

    expect(response.status).toBe(200);
    const metrics = await response.json();
    expect(metrics.completedPatients).toBe(10000);
}, 20000);

it("uses the current default capacity when no custom capacity is sent", async () => {
    const basePayload = {
        workloadProfile: "NORMAL",
        schedulingAlgorithm: "FCFS",
        patientCount: 100,
        randomSeed: 123
    };

    const defaultResponse = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload)
    });

    const customCapacity = structuredClone(InitialResourceSnapshot.total);
    const customResponse = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...basePayload,
            capacity: customCapacity
        })
    });

    expect(defaultResponse.status).toBe(200);
    expect(customResponse.status).toBe(200);
    expect(await customResponse.json()).toEqual(await defaultResponse.json());
});

it("includes requestedPatients and keeps the completed plus untreated totals consistent", async () => {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            workloadProfile: "NORMAL",
            schedulingAlgorithm: "FCFS",
            patientCount: 42,
            randomSeed: 123
        })
    });

    expect(response.status).toBe(200);

    const metrics = await response.json();
    expect(metrics.requestedPatients).toBe(42);
    expect(metrics.completedPatients + metrics.untreatedPatients).toBe(metrics.requestedPatients);
});

it.each([
    {
        name: "negative value",
        capacity: {
            resources: { general_ward_bed: 10, icu_bed: -1, operating_room: 5, isolation_room: 10, imaging_room: 15 },
            personnel: { physician: 30, nurse: 50, surgeon: 10, anesthesiologist: 5 }
        }
    },
    {
        name: "non-integer value",
        capacity: {
            resources: { general_ward_bed: 10, icu_bed: 1.5, operating_room: 5, isolation_room: 10, imaging_room: 15 },
            personnel: { physician: 30, nurse: 50, surgeon: 10, anesthesiologist: 5 }
        }
    },
    {
        name: "over 1,000",
        capacity: {
            resources: { general_ward_bed: 10, icu_bed: 1001, operating_room: 5, isolation_room: 10, imaging_room: 15 },
            personnel: { physician: 30, nurse: 50, surgeon: 10, anesthesiologist: 5 }
        }
    },
    {
        name: "missing field",
        capacity: {
            resources: { general_ward_bed: 10, operating_room: 5, isolation_room: 10, imaging_room: 15 },
            personnel: { physician: 30, nurse: 50, surgeon: 10, anesthesiologist: 5 }
        }
    },
    {
        name: "unknown field",
        capacity: {
            resources: { general_ward_bed: 10, icu_bed: 20, operating_room: 5, isolation_room: 10, imaging_room: 15, extra: 1 },
            personnel: { physician: 30, nurse: 50, surgeon: 10, anesthesiologist: 5 }
        }
    }
])("rejects an invalid capacity: $name", async ({ capacity }) => {
    const response = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            workloadProfile: "NORMAL",
            schedulingAlgorithm: "FCFS",
            patientCount: 10,
            randomSeed: 123,
            capacity
        })
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("capacity");
});
