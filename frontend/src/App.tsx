import hospitalMascot from './assets/Hospital-mascot.jpg'
import SimulationControls from './components/SimulationControls'

function App() {
  return (
    <main className="py-10 px-8 bg-amber-100 min-h-screen">
      
      <div className="flex items-center gap-8 border-2 rounded-lg p-6 bg-amber-50 border-orange-950">

        <img
          src={hospitalMascot}
          alt="Hospital mascot"
          className="w-40 h-40"
        />

        <div>
          <h1 className="font-serif text-3xl text-black">
            Hospital Resource Allocation Simulator
          </h1>

          <p className="py-5 font-serif text-2xl">
            Simulate hospital operations, patient flow, and resource allocation.
          </p>
        </div>

      </div>

      <SimulationControls />

    </main>
  )
}

export default App