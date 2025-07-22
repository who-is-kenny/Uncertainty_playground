import React, { useState, useEffect } from "react";
import "./App.css";
import UncertaintyPlot from "./plot";
import { loadComputeResults } from "./LoadComputeResults"; // Adjust the import path as necessary

function App() {
  const [computeResults, setComputeResults] = useState(null);
  const [modelName, setModelName] = useState("RandomForestClassifier"); // Default model
  const [pdcPerturbation, setPdcPerturbation] = useState("Trees"); // Default perturbation
  const [uncertaintyMeasure, setUncertaintyMeasure] = useState("Variance"); // Default measure
  const [uncertaintyType, setUncertaintyType] = useState("Aleatoric"); // Default type
  const [selection, setSelection] = useState("var_eu"); // Default selection

  // Update pdcPerturbation to "Anchor" if modelName is "PDL(DecisionTreeClassifier)"
  useEffect(() => {
    if (
      modelName === "PDL(DecisionTreeClassifier)" ||
      modelName === "PDL(MLPClassifier)"
    ) {
      setPdcPerturbation("Anchors");
    }
  }, [modelName]);

  // Update pdcPerturbation to "Anchor" if modelName is "PDL(DecisionTreeClassifier)"
  useEffect(() => {
    if (
      modelName === "RandomForestClassifier" ||
      modelName === "BaggingClassifier(MLP)"
    ) {
      setPdcPerturbation("Trees");
    }
  }, [modelName]);

  useEffect(() => {
    // Normalize pdcPerturbation for RandomForestClassifier
    const normalizedPerturbation =
      modelName === "RandomForestClassifier" ||
      modelName === "BaggingClassifier(MLP)"
        ? "Trees"
        : pdcPerturbation;

    loadComputeResults(modelName, normalizedPerturbation)
      .then((results) => {
        if (!results) {
          console.error(
            "No compute results found for",
            modelName,
            normalizedPerturbation
          );
          return;
        }
        setComputeResults(results);
      })
      .catch((err) => {
        console.error("Failed to load compute results:", err.message);
      });
  }, [modelName, pdcPerturbation]); // Re-run when modelName or pdcPerturbation changes

  useEffect(() => {
    loadComputeResults(modelName, pdcPerturbation)
      .then((results) => {
        if (!results) {
          console.error(
            "No compute results found for",
            modelName,
            pdcPerturbation
          );
          return;
        }
        setComputeResults(results);
      })
      .catch((err) => {
        console.error("Failed to load compute results:", err.message);
      });
  }, [modelName, pdcPerturbation]); // Re-run when modelName or pdcPerturbation changes

  // Update selection dynamically based on uncertaintyMeasure and uncertaintyType
  useEffect(() => {
    let selectionKey;

    if (uncertaintyMeasure === "Variance") {
      // Variance-based measures
      const measureKey = "var";
      const typeKey =
        uncertaintyType === "Aleatoric"
          ? "au"
          : uncertaintyType === "Epistemic"
          ? "eu"
          : "tu"; // Total uncertainty
      selectionKey = `${measureKey}_${typeKey}`;
    } else if (uncertaintyMeasure === "Entropy") {
      // Entropy-based measures
      selectionKey =
        uncertaintyType === "Aleatoric"
          ? "aleatoric_uncertainty"
          : uncertaintyType === "Epistemic"
          ? "epistemic_uncertainty"
          : "total_uncertainty"; // Total uncertainty
    }

    setSelection(selectionKey);
  }, [uncertaintyMeasure, uncertaintyType]);

  const [page, setPage] = useState(0);

  const pages = [
    {
      title: "What is Uncertainty?",
      content: (
        <>
          <p className="description-text">
            In machine learning, uncertainty refers to how confident a model is
            in its prediction. In the case of classification, when a model
            outputs a distribution — for example, a probability distribution
            over different classes — the shape of that distribution gives clues
            about its confidence.
          </p>
          <p className="description-text">
            The custom 2D synthetic dataset used above is called the rose
            dataset. By using the well-known rose curve function, we created a
            petal-like distribution. Using the rose function we predefine a
            ground truth function , which represents the underlying class
            probability μ and uncertainty σ of the data. Afterwards, we
            generated the corresponding dataset and its class labels by sampling
            the ground truth.
          </p>
          <p className="description-text">
            When we train a model to predict the class labels of the dataset, we
            may get one or more predictions for the same test point( depending
            on the model chosen). The uncertainty of the model is then computed
            by comparing the pertubation of the predictions.
          </p>
        </>
      ),
    },
    {
      title: "Uncertainty Types",
      content: (
        <>
          <p className="description-text">
            Our custom 2D synthetic dataset (rose dataset) represents
            uncertainty in 2 main ways.
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
          <p className="description-text">
            <strong>Total uncertainty</strong> is the combination of both
            aleatoric and epistemic uncertainty.
          </p>
          <p className="description-text">
            <strong>Exercise: </strong> There are many sources of uncertainty,
            such as measurement error, class overlap, lack of training data and
            Out-of-distribution data. Try to categorize these sources of
            uncertainty into aleatoric and epistemic uncertainty. what other
            sources of uncertainty can you think of?
          </p>
          <p className="description-text">
            <strong>Note* : </strong>Not all models are able to estimate
            uncertainty. For example, Decision Trees are not able to estimate
            uncertainty. This is because these models only create a single
            prediction and do not maintain any internal ensemble. In contrast,
            ensemble models like Random Forests and Bagging Classifiers can
            estimate uncertainty by averaging the predictions of multiple trees.
          </p>
        </>
      ),
    },
    {
      title: "Uncertainty Measure",
      content: (
        <>
          <p className="description-text">
            Previously, we talked about how uncertainty is represented in the
            rose dataset. Now, we will talk about how to measure uncertainty in
            a model. There are different ways to measure uncertainty in a model.
            The most common methods are:
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
          <p className="description-text">
            <strong>Exercise: </strong> There are cases where the entropy-based
            measures and variance-based measures give different results. Compare
            the results of PDL(BaggingClassifier(MLP)) with the entropy-based
            measure and variance-based measure. Which one do you think is better
            at quantifying uncertainty? Try do the same for the models.
          </p>
        </>
      ),
    },
    {
      title: "Model Type",
      content: (
        <>
          <p className="description-text">
            This parameter change the type of model used for prediction.
            Different models may have different levels of uncertainty based on
            their architecture and training.
          </p>
          <p className="description-text">
            <strong>Decision Tree Classifier: </strong> Builds a single tree by
            recursively splitting the feature space on the most informative
            thresholds, creating leaf nodes that assign class labels based on
            majority vote within each region.
          </p>
          <p className="description-text">
            <strong>Random Forest Classifier: </strong> Trains an ensemble of
            decision trees on bootstrap‐sampled subsets of the data and averages
            their class‐probability outputs (or majority‐votes) to reduce
            overfitting and improve generalization.
          </p>
          <p className="description-text">
            <strong>MLPClassifier: </strong> Implements a feedforward neural
            network with one or more fully connected hidden layers; it learns
            nonlinear decision boundaries by backpropagating prediction errors
            to adjust weights.
          </p>
          <p className="description-text">
            <strong>Bagging Classifier (with MLP base estimator): </strong> Fits
            multiple MLPClassifiers each on a different random subset (“bag”) of
            the training data and aggregates their predictions (e.g., by
            averaging probabilities) to stabilize learning and lower variance.
          </p>
          <p className="description-text">
            <strong>Pairwise Difference Learning (PDL): </strong> A meta
            learning algorithm that focuses on learning the differences between
            pairs of data points rather than their absolute values. PDL can
            capture complex relationships and patterns in the data, leading to
            improved performance. PDL works on top of any available model from
            sklearn. For this sandbox we chose different base learners to
            showcase PDL.
          </p>
          <p className="description-text">
            <strong>Exercise: </strong> Experiment with the different model
            types, try compare the random forest classifier with its PDL
            version. What differences do you see? Which model do you think is
            better at quantifying uncertainty?
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
            predictions and uncertainty estimates in different ways. <br />
            <strong>Weak Learners (Trees): </strong> The tree perturbation
            method generates alternative predictions by perturbing each
            prediction in the ensemble. <br />
            <strong>PDC Anchors: </strong> The anchor perturbation method
            generates alternative predictions by perturbing the anchor points.
            This method is useful for models that rely on anchor points to make
            predictions. <br />
            <strong>PDC Anchors and Weak Learners (Trees): </strong> The
            tree-anchor perturbation method is a combination of both and
            generates alternative predictions by perturbing each prediction in
            the ensemble while also considering the anchor points.
          </p>
          <p className="description-text">
            <strong>Exercise: </strong> Experiment with the different model
            types and pertubation types. There are some models that don't work
            some types of pertubation. What is the reason behind this?
          </p>
        </>
      ),
    },
    {
      title: "Analysis",
      content: (
        <>
          <p className="description-text">
            Now that you've had a chance to experiment with the different model
            types, uncertainty types, and perturbation types, it's time to
            analyze the results and see if your findings match ours. <br />
          </p>
          <p className="description-text">
            Through our experiments, we found that PDL(BaggingClassifier(MLP))
            model with the tree-anchor pertubation type showed the most uniform
            heat map and was able to identify areas of uncertainty where we
            would expect them to be. Other models such as RandomForestClassifier
            were also able to identify areas of uncertainty but were not as
            uniform as the PDL(BaggingClassifier(MLP)) model.
          </p>
          <p className="description-text">
            We also found that not all models were able to estimate uncertainty
            in certain areas of our dataset. For example, the PDL(MLPClassifier)
            model failed to estimate uncertainty in the middle of the petals
            (where epistemic uncertainty is expected). However, this may only be
            the case for our synthetic dataset and shouldn't be generalized to
            all datasets.
          </p>
        </>
      ),
    },
  ];
  // updater function to update the page state
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
        <h1 className="main-title">
          Uncertainty Quantification Sandbox {" "}
        </h1>
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
          <select
            className="select-box"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)} // Update modelName state
          >
            <option>RandomForestClassifier</option>
            <option>BaggingClassifier(MLP)</option>
            <option>PDL(RandomForestClassifier)</option>
            <option>PDL(BaggingClassifier(MLP))</option>
            <option>PDL(MLPClassifier)</option>
            <option>PDL(DecisionTreeClassifier)</option>
          </select>
        </div>

        <div className="control-group">
          <p className="control-name">Pertubation Type:</p>
          <select
            className="select-box"
            value={pdcPerturbation}
            onChange={(e) => setPdcPerturbation(e.target.value)} // Update pdcPerturbation state
          >
            <option
              value="Trees"
              disabled={
                modelName === "PDL(DecisionTreeClassifier)" ||
                modelName === "PDL(MLPClassifier)"
              } // Disable for certain models
            >
              Weak Learners (Trees)
            </option>
            <option
              value="Trees-Anchors"
              disabled={
                modelName === "PDL(DecisionTreeClassifier)" ||
                modelName === "PDL(MLPClassifier)" ||
                modelName === "RandomForestClassifier" ||
                modelName === "BaggingClassifier(MLP)"
              } // Disable for certain models
            >
              PDC Anchors and Weak Learners (Trees)
            </option>
            <option
              value="Anchors"
              disabled={
                modelName === "RandomForestClassifier" ||
                modelName === "BaggingClassifier(MLP)"
              } // Disable for certain models
            >
              PDC Anchors
            </option>
          </select>
        </div>

        <div className="control-group">
          <p className="control-name">Uncertainty Measure:</p>
          <select
            className="select-box"
            value={uncertaintyMeasure}
            onChange={(e) => setUncertaintyMeasure(e.target.value)} // Update uncertaintyMeasure state
          >
            <option>Variance</option>
            <option>Entropy</option>
          </select>
        </div>

        <div className="control-group">
          <p className="control-name">Uncertainty Type:</p>
          <select
            className="select-box"
            value={uncertaintyType}
            onChange={(e) => setUncertaintyType(e.target.value)} // Update uncertaintyType state
          >
            <option>Aleatoric</option>
            <option>Epistemic</option>
            <option>Total</option>
          </select>
        </div>
      </div>

      {/* Graph area */}

      <div className="graph">
        {computeResults ? (
          <UncertaintyPlot
            computeResults={computeResults}
            modelName={modelName}
            pdcPerturbation={pdcPerturbation}
            selection={selection}
            uncertaintyType={uncertaintyType}
          />
        ) : (
          <p>Loading uncertainty map…</p>
        )}
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
