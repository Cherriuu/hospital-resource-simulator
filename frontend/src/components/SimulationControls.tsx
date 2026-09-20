function SimulationControls() {
    return (
        <div className="flex items-center mt-6 border-2 rounded-lg p-20">
            <h2 className="font-serif text-2xl text-black">Configure Simulation</h2>

            <div>
            <label className="font-serif bg-amber-50">
                Workload Profile
                <select name="workloadprofile">
                    <option value="NORMAL">Normal</option>
                    <option value="FLU_SURGE">Flu Surge</option>
                    <option value="MASS_CASUALTY">Mass Casualty</option>
                </select>
            </label>
            </div>

            <div>
            <label className="font-serif bg-amber-50">
                Scheduling Algorithm
                <select name="schedulingalgorithm">
                    <option value="FCFS">FCFS</option>
                    <option value="PRIORITY">Priority</option>
                    <option value="PRIORITY_AGING">Priority + Aging</option>
                </select>
            </label>
            </div>

            <div>
                <label className="font-serif bg-amber-50">
                Patient Count
                <input
                    className="bg-white"
                    type="number"
                    name="patientCount"
                    defaultValue={200}
                    min={1}
                />
            </label>
            </div>

             <div>
                <label className="font-serif bg-amber-50">
                Random Seed
                <input
                    className="bg-white"
                    type="number"
                    name="randomSeed"
                    defaultValue={123}
                />
            </label>
            </div>

            <div>
                <button className="font-serif bg-white">Run Simulation</button>
            </div>

        </div>
    )
        
}

export default SimulationControls