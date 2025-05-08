import React, { useState, useMemo, useEffect } from "react";
import Plot from "react-plotly.js";

/**
 * Simple Gaussian KDE for 1D samples.
 */
function computeKDE(samples, bandwidth = 0.05, xPoints = []) {
  const n = samples.length;
  const factor = 1 / (Math.sqrt(2 * Math.PI) * bandwidth * n);
  return xPoints.map(
    (x) =>
      samples.reduce(
        (sum, s) => sum + Math.exp(-0.5 * ((x - s) / bandwidth) ** 2),
        0
      ) * factor
  );
}

/**
 * Seedable PRNG (Mulberry32)
 */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build rose KDE by sampling noisy red and blue points.
 */
function buildRoseKDE({ noiseScale = 0.01, seed = 42 } = {}) {
  const rand = mulberry32(seed);
  const theta = Array.from(
    { length: 2000 },
    (_, i) => (2 * Math.PI * i) / 1999
  );
  const r = theta.map((t) => Math.sin(2 * t));
  const xFull = r.map((ri, i) => ri * Math.cos(theta[i]));
  const yFull = r.map((ri, i) => ri * Math.sin(theta[i]));

  const red = [],
    blue = [];
  theta.forEach((t, i) => {
    const isRed =
      (t >= 0 && t <= Math.PI / 2) || (t >= Math.PI && t <= (3 * Math.PI) / 2);
    (isRed ? red : blue).push([xFull[i], yFull[i]]);
  });

  const noisy = (pts) =>
    pts.flatMap(([x, y]) => {
      const nx = x + sampleNormal(rand) * noiseScale;
      const ny = y + sampleNormal(rand) * noiseScale;
      return [
        [x, y],
        [nx, ny],
      ];
    });

  return {
    redSample: noisy(red),
    blueSample: noisy(blue),
    rosePoints: theta.map((_, i) => [xFull[i], yFull[i]]),
  };
}

/**
 * KDE density for 2D points.
 */
function kdeDensity(x, y, sample, bw = 0.01) {
  const coeff = 1 / (2 * Math.PI * bw * bw * sample.length);
  return (
    sample.reduce(
      (sum, [sx, sy]) =>
        sum + Math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / (2 * bw * bw)),
      0
    ) * coeff
  );
}

/**
 * Compute ground truth mu & sigma for a point.
 */
function getGroundTruth(x, y, kdeData, { sigmaBase = 0.01, k = 3.0 } = {}) {
  const { redSample, blueSample, rosePoints } = kdeData;
  const dR = kdeDensity(x, y, redSample);
  const dB = kdeDensity(x, y, blueSample);
  const total = dR + dB;
  // const mu = total < 1e-12 ? 0.5 : dR / total;   old version
  const mu = dR / (dR + dB);
  const dMin = rosePoints.reduce((m, [rx, ry]) => {
    const d = Math.hypot(x - rx, y - ry);
    return d < m ? d : m;
  }, Infinity);
  return { mu, sigma: sigmaBase + k * dMin };
}

/**
 * Sample normal via Box-Muller using PRNG.
 */
function sampleNormal(prng) {
  let u = 0,
    v = 0;
  while (u === 0) u = prng();
  while (v === 0) v = prng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Generate ground truth samples.
 */
function sampleGroundTruth(
  x,
  y,
  kdeData,
  { n = 500, seed = 42, sigmaBase = 0.01, k = 1.0 } = {}
) {
  const prng = mulberry32(seed);
  const { mu, sigma } = getGroundTruth(x, y, kdeData, { sigmaBase, k });
  return Array.from({ length: n }, () => mu + sigma * sampleNormal(prng));
}

export default function UncertaintyPlot({
  computeResults,
  selection = "total_uncertainty",
  modelName,
  pdcPerturbation,
  uncertaintyType,
}) {
  const { uncertainty, vmax, X, y, X_grid, mean_class0, kde_class0 } =
    computeResults;
  const gridSize = Math.sqrt(X_grid.length);

  // Define color scales for different uncertainty types
  const colorScales = {
    Aleatoric: [
      [0, "#006400"], // Blue for low uncertainty
      [0.5, "white"], // White for medium uncertainty
      [1, "orange"], // Red for high uncertainty
    ],
    Epistemic: [
      [0, "#006400"], // Dark green for low uncertainty
      [0.5, "white"], // White for medium uncertainty
      [1, "yellow"], // Gold for high uncertainty
    ],
    Total: [
      [0, "#006400"], // Indigo for low uncertainty
      [0.5, "white"], // White for medium uncertainty
      [1, "pink"], // Orange-red for high uncertainty
    ],
  };

  // Select the appropriate color scale based on the uncertainty type
  const selectedColorScale = colorScales[uncertaintyType] || colorScales.Total;

  // Build KDE
  const [kdeData, setKde] = useState(null);
  useEffect(() => {
    setKde(buildRoseKDE({ noiseScale: 0.01, seed: 42 }));
  }, []);

  // Precompute true distribs
  const trueDistr = useMemo(() => {
    if (!kdeData) return [];
    return X_grid.map(([x, y]) =>
      sampleGroundTruth(x, y, kdeData, { n: 200, seed: 42 })
    );
  }, [X_grid, kdeData]);

  // Density plot x-axis
  const densityX = useMemo(
    () => Array.from({ length: 200 }, (_, i) => i / 199),
    []
  );

  // Heatmap axes
  const xVals = useMemo(
    () => [...new Set(X_grid.map((p) => p[0]))].sort((a, b) => a - b),
    [X_grid]
  );
  const yVals = useMemo(
    () => [...new Set(X_grid.map((p) => p[1]))].sort((a, b) => a - b),
    [X_grid]
  );
  const zMatrix = useMemo(() => {
    const arr = [];
    for (let i = 0; i < gridSize; i++) {
      arr.push(uncertainty[selection].slice(i * gridSize, (i + 1) * gridSize));
    }
    return arr;
  }, [uncertainty, selection, gridSize]);

  const [sel, setSel] = useState(null);
  const onClick = (e) => {
    const pt = e.points[0];
    const xi = xVals.indexOf(pt.x);
    const yi = yVals.indexOf(pt.y);
    if (xi >= 0 && yi >= 0) setSel(yi * gridSize + xi);
  };

  const predMean = computeResults.mean_class0[sel]; // get mean based on position
  const predKDE = computeResults.kde_class0[sel]; // already aligned to densityX , get kde of based on position.

  // const pred = sel != null ? proba[sel][0] : null;
  // const predMean = useMemo(
  //   () => (pred ? pred.reduce((a, b) => a + b, 0) / pred.length : null),
  //   [pred]
  // );

  // const predKDE = useMemo(
  //   () => (pred ? computeKDE(pred, 0.05, densityX) : null),
  //   [pred, densityX]
  // );
  const trueKDE = useMemo(
    () => (sel != null ? computeKDE(trueDistr[sel], 0.05, densityX) : null),
    [trueDistr, sel, densityX]
  );

  return (
    <div className="plot-container" >
      <h2 className="plot-title" style={{ textAlign: "center" }}>
        {modelName} - {pdcPerturbation}
      </h2>
      <Plot
        className="plotly-chart"
        data={[
          {
            type: "heatmap",
            x: xVals,
            y: yVals,
            z: zMatrix,
            zsmooth : "best",
            colorscale: selectedColorScale,
            zmax: vmax[selection],
            showscale: true,
            colorbar: {
              title: {
                text: selection, // ← your label text
                side: "right", // ← position the title outside the bar
              },
            titleside: "right", // ← ensure label is rendered outside the bar
              tickmode: "auto", // ← optional: automatic ticks
              // optional further tweaks:
              // len: 0.8,
              // tickfont: { size: 12 },
              // titlefont: { size: 14, family: "Arial" },
            },
          },
          {
            type: "scatter",
            x: X.map((p) => p[0]),
            y: X.map((p) => p[1]),
            mode: "markers",
            marker: {
              color: y,
              colorscale: [
                ["0", "red"],
                ["1", "blue"],
              ],
              size: 6,
              line: { width: 1 },
            },
            hoverinfo: "skip", // Disable hover for scatter points to stop blocking heatmap
          },
          {
            type: "scatter",
            x: [
              X_grid[
                uncertainty[selection].indexOf(
                  Math.max(...uncertainty[selection])
                )
              ][0],
            ],
            y: [
              X_grid[
                uncertainty[selection].indexOf(
                  Math.max(...uncertainty[selection])
                )
              ][1],
            ],
            mode: "markers",
            marker: {
              symbol: "diamond-open",
              color: "gold",
              size: 12,
              line: { width: 2 },
            },
            name: "max uncertainty",
          },
          {
            type: "scatter",
            x: [
              X_grid[
                uncertainty[selection].indexOf(
                  Math.min(...uncertainty[selection])
                )
              ][0],
            ],
            y: [
              X_grid[
                uncertainty[selection].indexOf(
                  Math.min(...uncertainty[selection])
                )
              ][1],
            ],
            mode: "markers",
            marker: {
              symbol: "triangle-up-open",
              color: "#00FFFF",
              size: 16,
              line: { width: 2 },
            },
            name: "min uncertainty",
          },
        ]}
        layout={{
          width: 550,
          height: 550,
          xaxis: { range: [-1, 1] },
          yaxis: { range: [-1, 1] },
          showlegend: true,
          legend: {
            orientation: "h", // horizontal
            x: 0.5, // centered at 50% of the plot width
            xanchor: "center", // anchor the legend’s middle
            y: -0.2, // move it below the x-axis
          },
          margin: {
            t: 40, // Reduce the top margin
            b: 10, // Keep enough bottom margin for the legend
            l: 50, // Left margin
            r: 50, // Right margin
          },
        }}
        config={{ displayModeBar: false }}
        onClick={onClick}
      />
      {/* //Distribution line/density chart */}
      {sel != null && (
        <h3 className="location-text">
          Location: ({X_grid[sel][0].toFixed(2)}, {X_grid[sel][1].toFixed(2)})
        </h3>
      )}
      {sel != null && predKDE && trueKDE && (
        <Plot
          data={[
            {
              x: densityX,
              y: predKDE,
              type: "scatter",
              mode: "lines",
              name: "Predicted",
            },
            {
              x: densityX,
              y: trueKDE,
              type: "scatter",
              mode: "lines",
              name: "Ground Truth",
            },
          ]}
          layout={{
            title: `Location (${X_grid[sel][0].toFixed(2)}, ${X_grid[
              sel
            ][1].toFixed(2)})`,
            width: 550,
            height: 350,
            xaxis: { title: "Probability", range: [0, 1] },
            yaxis: { title: "Density" },
            shapes: [
              predMean != null && {
                type: "line",
                x0: predMean,
                x1: predMean,
                y0: 0,
                y1: 1,
                yref: "paper",
                line: { color: "red", dash: "dash" },
              },
              {
                type: "line",
                x0: uncertainty.aleatoric_uncertainty[sel],
                x1: uncertainty.aleatoric_uncertainty[sel],
                y0: 0,
                y1: 1,
                yref: "paper",
                line: { color: "blue", dash: "dash" },
              },
              {
                type: "line",
                x0: uncertainty.epistemic_uncertainty[sel],
                x1: uncertainty.epistemic_uncertainty[sel],
                y0: 0,
                y1: 1,
                yref: "paper",
                line: { color: "green", dash: "dash" },
              },
              {
                type: "line",
                x0: uncertainty.var_eu[sel],
                x1: uncertainty.var_eu[sel],
                y0: 0,
                y1: 1,
                yref: "paper",
                line: { color: "purple", dash: "dash" },
              },
            ].filter(Boolean),
            showlegend: true,
            legend: {
              orientation: "h", // horizontal
              x: 0.5, // centered at 50% of the plot width
              xanchor: "center", // anchor the legend’s middle
              y: -0.2, // move it below the x-axis
            },
            margin: {
              t: 40, // Reduce the top margin
              l: 50, // Left margin
              r: 50, // Right margin
              b: 80, // leave enough bottom margin for the legend
            },
          }}
          config={{ displayModeBar: false }}
        />
      )}
      {sel != null && predKDE && trueKDE && (
        <div className = "info-box" style={{ textAlign: "center", margin: "0.5rem" }}>
          <div>
            <span style={{ color: "red", marginRight: "0.5rem" }}>
              {" "}
              <strong>---</strong>
            </span>
            <span>Predicted mean: {predMean?.toFixed(2)}</span>
          </div>
          <div>
            <span style={{ color: "blue", marginRight: "0.5rem" }}>
              <strong>---</strong>
            </span>
            <span>
              Aleatoric AU: {uncertainty.aleatoric_uncertainty[sel].toFixed(2)}
            </span>
          </div>
          <div>
            <span style={{ color: "green", marginRight: "0.5rem" }}>
              <strong>---</strong>
            </span>
            <span>
              Epistemic EU: {uncertainty.epistemic_uncertainty[sel].toFixed(2)}
            </span>
          </div>
          <div>
            <span style={{ color: "purple", marginRight: "0.5rem" }}>
              <strong>---</strong>
            </span>
            <span>Variance EU: {uncertainty.var_eu[sel].toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
