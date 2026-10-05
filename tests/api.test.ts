import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import app from "../api/simulations";
import healthApp from "../api/health";

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
    expect(await response.json()).toEqual({ error: "Patient count must be a positive integer" });
});
