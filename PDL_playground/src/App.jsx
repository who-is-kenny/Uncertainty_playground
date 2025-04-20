import React, { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState(0);

  const pages = [
    {
      title: "Uncertainty Quantification",
      content: (
        <>
          <p className="description-text">
            The custom 2D synthetic dataset used above is called the rose
            dataset. By using the well-known rose curve function, we created a
            petal-like distribution. This distribution represents uncertainty in
            2 main ways.
          </p>
          <p className="description-text">
            <strong>Aleatoric uncertainty</strong> is defined as the uncertainty
            as a result of inherent randomness/noise in a system or a process.
            This is represented by the areas where adjacent petals overlap (in
            the middle of the dataset) and also areas where the noise of the
            distribution overlap (sides of the petals).
          </p>
          <p className="description-text">
            <strong>Epistemic uncertainty</strong> is defined as the uncertainty
            as a result of lack of knowledge about a system or a process. This
            is represented by the blank areas between adjacent petals and also
            the blank areas in the middle of each petal.
          </p>
        </>
      ),
    },
    {
      title: "Uncertainty Measure",
      content: (
        <>
          <p className="description-text">
            In machine learning, uncertainty measure refers to how confident a
            model is in its prediction. In the case of classification, when a
            model outputs a distribution—for example, a probability distribution
            over different classes—the shape of that distribution gives clues
            about its confidence.
          </p>
          <p className="description-text">
            <strong>Entropy-based measures</strong> first average the input
            distribution across different sources and then compute the Shannon
            entropy of the resulting average distribution: models that assign
            one class a very high probability (and the rest very low
            probabilities) have low entropy, indicating high confidence.
            Conversely, a more uniform distribution results in high entropy,
            suggesting low confidence.
          </p>
          <p className="description-text">
            <strong>Variance-based measures</strong> quantify uncertainty by
            calculating the spread or variability in the predicted
            probabilities. The variance calculated directly corresponds to total
            uncertainty: higher variance indicates more disagreement among
            predictions (and thus higher uncertainty), while lower variance
            suggests more confident predictions.
          </p>
        </>
      ),
    },
    {
      title: "Model Type",
      content: (
        <>
          <p className="description-text">
            The type of model used for prediction. Different models may have
            different levels of uncertainty based on their architecture and
            training. For this simple playground, we have implemented xxxx
            different models: linear regression, random forest, and neural
            network. Each model has its own strengths and weaknesses in terms of
            uncertainty quantification.
          </p>
          <p className="description-text">
            <strong>Pairwise Difference Learning (PDL): </strong> Pairwise
            difference learning is a meta learning algorithm that focuses on
            learning the differences between pairs of data points rather than
            their absolute values. PDL can capture complex relationships and
            patterns in the data, leading to improved performance.
          </p>
          <p className="description-text">
            <strong>Excersize: </strong> Experiment with the different model
            types and combinations with PDL, which one gives the best
            uncertainty quantification?
          </p>
        </>
      ),
    },
    {
      title: "Uncertainty Type",
      content: (
        <>
          <p className="description-text">
            The type of uncertainty being measured. This can include aleatoric
            uncertainty (inherent noise in the data) and epistemic uncertainty
            (uncertainty due to lack of knowledge). Understanding the type of
            uncertainty is crucial for interpreting the model's predictions and
            making informed decisions based on them.
          </p>
          <p className="description-text">
            <strong>Excersize: </strong> Experiment with the different model
            types and uncertainty types. Which models are better at quantifying
            which type of uncertainty (aleatoric or epistemic)?
          </p>
        </>
      ),
    },
    {
      title: "Pertubation Type",
      content: (
        <>
          <p className="description-text">
            The type of perturbation applied to the model predictions tells the
            algorithm what course of pertubation (variation) to use when
            generating alternative predictions for the same test point. These
            alternative predictions are then used to compute the uncertainty.
            This can include tree perturbation, tree-anchor perturbation, and
            anchor perturbation. Each type of perturbation affects the model's
            predictions and uncertainty estimates in different ways.
          </p>
          <p className="description-text">
            <strong>Excersize: </strong> Experiment with the different model
            types and pertubation types. There are some models that dont work
            some types of pertunation. What is the reason behind this?
          </p>
        </>
      ),
    },
  ];

  const handleNext = () => {
    setPage((prevPage) => (prevPage + 1) % pages.length);
  };

  const handlePrevious = () => {
    setPage((prevPage) => (prevPage - 1 + pages.length) % pages.length);
  };

  return (
    <div className="app-container">
      {/* Title */}
      <header className="app-header">
        <h1 className="main-title">Uncertainty Quantification Playground</h1>
        <p className="subtitle">
          Explore different models and uncertainty estimations interactively.
          Select your model and uncertainty type to visualize how uncertainty
          propagates.
        </p>
      </header>

      {/* Controls: Model and Uncertainty Type */}
      <div className="controls">
        <div className="control-group">
          <p className="control-name">Model Type:</p>
          <select className="select-box">
            <option>Linear Regression</option>
            <option>Random Forest</option>
            <option>Neural Network</option>
          </select>
        </div>

        <div className="control-group">
          <p className="control-name">Uncertainty Type:</p>
          <select className="select-box">
            <option>Aleatoric</option>
            <option>Epistemic</option>
            <option>Total</option>
          </select>
        </div>

        <div className="control-group">
          <p className="control-name">pdc_pertubation:</p>
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
        <h2 className="description-title">{pages[page].title}</h2>
        {pages[page].content}
        <div className="pagination-controls">
          {/* Left arrow button */}
          <button
            onClick={handlePrevious}
            className="pagination-button left-arrow"
          >
            &#8592;
          </button>

          {/* Number bubbles */}
          <div className="page-bubbles">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setPage(index)}
                className={`page-bubble ${index === page ? "active" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Right arrow button */}
          <button
            onClick={handleNext}
            className="pagination-button right-arrow"
          >
            &#8594;
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          This tool allows you to understand and experiment with different types
          of uncertainties, including aleatoric and epistemic uncertainty.
          Perfect for educational purposes and quick experimentation!
        </p>
      </footer>
    </div>
  );
}

export default App;
