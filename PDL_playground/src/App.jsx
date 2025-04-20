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

        <div className="control-group">
          <p className='control-name'>pdc_pertubation:</p>
          <select className="select-box">
            <option>Tree</option>
            <option>Tree-Anchor</option>
            <option>Anchor</option>
          </select>
        </div>

      </div>

      {/* Graph area */}
      <div className="graph">
        {/* Plotly graph placeholder */}
        <p>Graph will be displayed here.</p>
      </div>

      {/* Description */} 
      <div className="description">
        <h2 className='description-title'>Uncertainty Quantification:</h2>
        <p className='description-text'>
        The custom 2D synthetic dataset used above is called the rose dataset. By using the well- known rose curve function we created a petal-like distribution. This distribution represents uncertainty in 2 main ways. 
        <br />
        <strong>Aleatoric uncertainty</strong> is defined as the uncertainty as a result of inherent randomness/noise in a system or a process. This is represented by the areas where adjacent petals overlap ( in the middle of the dataset) and also areas where the noise of the distribution overlap (sides of the petals).  
        <br />
        <strong>Epistemic uncertainty</strong> is defined as the uncertainty as a result of lack of knowledge about a system or a process.This is represented by the blank areas between adjacent petals and also the blank areas in the middle of each petal.

        </p>
        <h2 className='description-title'>Uncertainty Measure:</h2>
        <p className='description-text'>
        In machine learning uncertainty measure refers to how confident a model is in its prediction. In the case of classification, when a model outputs a distribution—for example, a probability distribution over different classes—the shape of that distribution gives clues about its confidence. In the plot above, uncertainty measures are computed using functions that take a distribution (typically a multidimensional array of probabilities) as input and output values for total , aleatoric and epistemic uncertainty. 
        For example, entropy based measures first averages the input distribution across different sources and then computes the Shannon entropy of the resulting average distribution : models that assign one class a very high probability (and the rest very low probabilities), have low entropy, indicating high confidence. Conversely, a more uniform distribution results in high entropy, suggesting low confidence.
        Variance based measures quantify uncertainty by calculating the spread or variability in the predicted probabilities. The variance calculated directly corresponds to total Uncertainty: higher variance indicates more disagreement among predictions (and thus higher uncertainty), while lower variance suggests more confident predictions.
        </p>
      </div>

      {/* Footer */}
      <footer className="app-footer">
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
