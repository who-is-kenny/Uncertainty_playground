import './App.css'

function App() {
  return (
    <div className="app-container">
      {/* Title */}
      <header className="app-header">
        <h1 className="main-title">Uncertainty Quantification Playground</h1>
        <p className="subtitle">
          Explore different models and uncertainty estimations interactively.
          Select your model and uncertainty type to visualize how uncertainty propagates.
        </p>
      </header>

      {/* Controls: Model and Uncertainty Type */}
      <div className="controls">
        <div className="control-group">
          <p className='control-name'>Model Type:</p>
          <select className="select-box">
            <option>Linear Regression</option>
            <option>Random Forest</option>
            <option>Neural Network</option>
          </select>
        </div>

        <div className="control-group">
          <p className='control-name'>Uncertainty Type:</p>
          <select className="select-box">
            <option>Aleatoric</option>
            <option>Epistemic</option>
            <option>Total</option>
          </select>
        </div>
      </div>

      {/* Graph area */}
      <div className="graph">
        {/* Plotly graph placeholder */}
        <p>Graph will be displayed here.</p>
      </div>

      {/* Description */}
      <footer className="description">
        <p>
          This tool allows you to understand and experiment with different types of uncertainties, 
          including aleatoric and epistemic uncertainty. Perfect for educational purposes 
          and quick experimentation!
        </p>
      </footer>
    </div>
  )
}

export default App
