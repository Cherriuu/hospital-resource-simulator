# Hospital Resource Allocation Simulator

**[Live Demo](https://hospital-resource-simulator.vercel.app)**

A full-stack discrete-event simulator for exploring how hospital scheduling policies behave when patients compete for limited beds and staff. Patients are modeled with the five-level **Emergency Severity Index (ESI)** triage system and generated from CDC triage data. I built it to compare scheduling strategies and study the tradeoff between prioritizing high-acuity patients and keeping lower-priority patients from waiting indefinitely.

## Highlights

- **All-or-nothing resource allocator:** beds and staff are assigned only when a patient's *entire* set of requirements is available, then waiting patients are re-evaluated whenever resources are released
- **Three schedulers:** FCFS, priority, and capped priority-aging
- **Binary-heap event queue:** 10,000-patient runs are ~40x faster than an array-based queue, with fully reproducible results
- **Evaluated across five seeded mass-casualty runs:** capped aging reduced non-urgent patient waits by ~50% versus priority-only scheduling, without delaying emergent or resuscitation patients

## What it does

- Simulates patient arrivals, waiting, treatment, and resource release
- Models five ESI-based patient priority levels
- Tracks physical resources: ward beds, ICU beds, operating rooms, isolation rooms, and imaging rooms
- Tracks staff roles: nurses and physicians
- Supports configurable scenarios, staffing, and bed capacity, with normal, flu-surge, and mass-casualty workload profiles
- Uses seeded random generation so any run can be reproduced
- Reports average, median, P95, and maximum wait times, plus throughput and queue length
- Breaks down wait times by triage level
- Provides a React interface for configuring simulations and viewing results

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Vite

**Backend:** Node.js, Express, TypeScript

**Testing:** Vitest

**Deployment:** Vercel

## How it works

The React frontend sends the workload, scheduling strategy, patient count, and random seed to the Express API. The backend generates the patient population and runs it through the simulation engine.

```
React
  ↓
Express API
  ↓
Patient Generator
  ↓
Simulation Engine
  ↓
Scheduler + Resource Manager
  ↓
Metrics Collector
  ↓
Simulation Results
```

Instead of advancing time in fixed steps, the simulation processes events such as patient arrivals and treatment completions, ordered by a binary-heap event queue. When treatment finishes, the patient's resources are released and waiting patients are re-evaluated.

### Resource Allocation

Patients can need several resources at once. For example:

```
ICU bed
+ physician
+ 2 nurses
```

Before treatment begins, the allocator checks whether the full set is available. If any requirement is missing, nothing is reserved and the patient keeps waiting. This stops scarce resources from being partially held by patients who can't start yet.

### Scheduling

- **FCFS:** patients are treated in arrival order
- **Priority:** higher-acuity patients go first
- **Capped priority-aging:** acuity still comes first, but patients who have waited longer gradually gain effective priority, up to a cap so they can't leapfrog the most critical patients

Strict priority protects high-acuity patients but can starve lower-priority ones. Capped aging reduces that starvation while keeping triage-based prioritization intact.

## Workload Profiles

- **Normal:** typical patient demand
- **Flu Surge:** increased pressure from widespread illness
- **Mass Casualty:** a high-volume emergency scenario

Each profile changes the generated patient workload, so the schedulers can be compared under different kinds of resource contention.

## Reproducible Simulations

Patient generation uses a seeded pseudo-random number generator. The same seed and workload profile always produce the same patient population, so FCFS, priority, and capped aging are compared on identical workloads rather than different random patients.

## Metrics and Results

Each simulation reports:

- Average, median, P95, and maximum wait time
- Percentage of patients who waited
- Throughput and number of completed patients
- Queue length and total simulation duration
- Average wait time for each ESI level

## Project Structure

```
src/
├── api/          # Express API
├── config/       # Workload profiles
├── generators/   # Patient generation
├── metrics/      # Simulation metrics
├── models/       # Core data models
├── random/       # Seeded random generator
├── resources/    # Resource allocation
├── scheduling/   # Scheduling strategies
└── simulation/   # Discrete-event simulation engine

frontend/
└── src/          # React frontend

tests/            # Vitest tests
```

## Running the Project

Install backend dependencies:

```
npm install
```

Run the simulation from the command line:

```
npm run dev
```

Run the API:

```
npx tsx src/api/server.ts
```

Then start the frontend in another terminal:

```
cd frontend
npm install
npm run dev
```

## Status

Deployed and working: the simulation engine, resource allocator, three schedulers, metrics collection, API, and frontend.

## Vercel Deployment

Import the repository as one Vercel project. Set **Root Directory** to the repository root (leave it blank), not `frontend` or `backend`. The checked-in `vercel.json` sets the Vite framework, installs both packages, builds the frontend, and serves `frontend/dist`.

The root `api/health.ts` and `api/simulations.ts` files expose the Express app as Vercel Functions. The frontend calls `/api/simulations` on the same domain. No database or separate backend host is needed; every simulation runs in memory.

If the project previously used the Services framework, switch the framework preset to **Vite** and clear any conflicting install/build/output overrides so the checked-in configuration applies. Redeploy after updating the settings.

To verify, open `/api/health` (it should return JSON), then run a simulation and confirm results appear.
