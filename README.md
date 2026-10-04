# Hospital Resource Allocation Simulator

Hospital Resource Allocation Simulator is a full-stack discrete-event simulation for exploring how hospital scheduling policies behave when patients compete for limited resources and personnel.

Patients are modeled using the five-level **Emergency Severity Index (ESI)** triage system. I built the project to compare different scheduling strategies and explore the tradeoff between prioritizing high-acuity patients and preventing lower-priority patients from waiting indefinitely.

## What it does

- Simulates patient arrivals, waiting, treatment, and resource release
- Models five ESI-inspired patient priority levels
- Tracks physical resources including ward beds, ICU beds, operating rooms, isolation rooms, and imaging rooms
- Tracks personnel including physicians, nurses, surgeons, and anesthesiologists
- Supports normal, flu-surge, and mass-casualty workload profiles
- Compares FCFS, priority, and priority-aging scheduling strategies
- Uses seeded random generation so simulations can be reproduced
- Tracks average, median, p95, and maximum patient wait times
- Measures throughput and wait times for each triage level
- Provides a React interface for configuring simulations and viewing results

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Vite

**Backend:** Node.js, Express, TypeScript

**Testing:** Vitest

## How it works

The React frontend sends the selected workload, scheduling strategy, patient count, and random seed to the Express API. The backend generates the patient population and passes it to the discrete-event simulation engine.

```text
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

Instead of advancing time at fixed intervals, the simulation processes events such as patient arrivals and treatment completions. When treatment finishes, the patient's resources are released and become available to waiting patients.

### Resource Allocation

Patients can require multiple resources and personnel at the same time. Before treatment begins, the resource manager checks whether the patient's **entire set of requirements** is available.

For example, a patient might require:

```text
ICU bed
+ physician
+ 2 nurses
```

If one requirement is unavailable, nothing is allocated and the patient continues waiting. This prevents scarce resources from being partially reserved by patients who cannot yet begin treatment.

### Scheduling

The simulator implements three scheduling strategies:

- **FCFS** — treats patients in arrival order
- **Priority** — treats higher-acuity patients first
- **Priority + Aging** — prioritizes acuity while gradually increasing the effective priority of patients who have waited longer

Strict priority scheduling protects high-acuity patients but can cause lower-priority patients to experience extremely long waits. Priority aging was added to reduce this starvation while preserving triage-based prioritization.

## Workload Profiles

The simulator can run under three different hospital conditions:

**Normal** represents typical patient demand, while **Flu Surge** increases pressure associated with widespread illness and **Mass Casualty** models a high-volume emergency scenario.

Each profile changes the generated patient workload, allowing the scheduling strategies to be compared under different levels and types of resource contention.

## Reproducible Simulations

Patient generation uses a seeded pseudo-random number generator. Running a simulation with the same seed and workload profile produces the same generated patient population.

This makes scheduling comparisons more meaningful because FCFS, priority, and priority aging can be evaluated against equivalent workloads rather than different random patients.

## Metrics and Results

Each simulation reports:

- Average, median, p95, and maximum wait time
- Percentage of patients who waited
- Patient throughput
- Number of completed patients
- Total simulation duration
- Average wait time for each ESI priority level

Across five seeded simulations of **10,000 patients**, priority aging reduced worst-case patient wait time by approximately **88%** compared with priority-only scheduling.

The simulator also tracks wait times separately by triage level so improvements for lower-priority patients can be evaluated against their effect on high-acuity patients.

## Project Structure

```text
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
```

## Running the Project

Install the backend dependencies:

```bash
npm install
```

Run the simulation from the command line:

```bash
npm run dev
```

Run the API:

```bash
npx tsx src/api/server.ts
```

Then start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Status

The discrete-event simulation engine, resource allocation system, scheduling strategies, metrics collection, API, and frontend are working.

I'm currently expanding testing, benchmark analysis, and deployment.
