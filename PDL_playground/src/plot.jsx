// import React, { useState, useMemo, useEffect } from 'react';
// import Plot from 'react-plotly.js';

// /**
//  * Utility: Seedable random number generator (Mulberry32)
//  */
// function mulberry32(a) {
//   return function() {
//     let t = (a += 0x6D2B79F5);
//     t = Math.imul(t ^ (t >>> 15), t | 1);
//     t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
//     return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//   };
// }

// /**
//  * Build rose KDE by sampling noisy red and blue points.
//  * Returns arrays of points and the ideal curve.
//  */
// function buildRoseKDE({ noiseScale = 0.01, seed = 42 } = {}) {
//   const rand = mulberry32(seed);
//   const thetaFull = [];
//   const rFull = [];
//   for (let i = 0; i < 2000; i++) thetaFull.push((2 * Math.PI * i) / 1999);
//   thetaFull.forEach((t) => rFull.push(Math.sin(2 * t)));
//   const xFull = rFull.map((r, i) => r * Math.cos(thetaFull[i]));
//   const yFull = rFull.map((r, i) => r * Math.sin(thetaFull[i]));

//   // Masks
//   const redPoints = [];
//   const bluePoints = [];
//   thetaFull.forEach((t, i) => {
//     const isRed = (t >= 0 && t <= Math.PI/2) || (t >= Math.PI && t <= 3*Math.PI/2);
//     const x = xFull[i];
//     const y = yFull[i];
//     if (isRed) redPoints.push([x, y]); else bluePoints.push([x, y]);
//   });

//   // Add noise
//   function noisy(points) {
//     return points.flatMap(([x,y]) => {
//       const nx = x + rand() * noiseScale;
//       const ny = y + rand() * noiseScale;
//       return [[x,y], [nx, ny]];
//     });
//   }
//   const redSample = noisy(redPoints);
//   const blueSample = noisy(bluePoints);

//   // Ideal curve points
//   const rosePoints = xFull.map((_, i) => [xFull[i], yFull[i]]);

//   return { redSample, blueSample, rosePoints };
// }

// /**
//  * Evaluate Gaussian KDE density at (x,y) given sample points and bandwidth.
//  */
// function kdeDensity(x, y, sample, bandwidth = 0.01) {
//   const coeff = 1 / (2 * Math.PI * bandwidth * bandwidth * sample.length);
//   return sample.reduce((sum, [sx, sy]) => {
//     const dx = x - sx;
//     const dy = y - sy;
//     return sum + Math.exp(-(dx*dx + dy*dy) / (2 * bandwidth * bandwidth));
//   }, 0) * coeff;
// }

// /**
//  * Compute ground truth probability mu and uncertainty sigma for a point.
//  */
// function getGroundTruth(x, y, kdeData, { sigmaBase = 0.01, k = 3.0 } = {}) {
//   const { redSample, blueSample, rosePoints } = kdeData;
//   const dRed = kdeDensity(x, y, redSample);
//   const dBlue = kdeDensity(x, y, blueSample);
//   const total = dRed + dBlue;
//   const mu = total < 1e-12 ? 0.5 : dRed / total;

//   // min distance to curve
//   const dMin = rosePoints.reduce((min, [rx, ry]) => {
//     const dist = Math.hypot(x - rx, y - ry);
//     return dist < min ? dist : min;
//   }, Infinity);
//   const sigma = sigmaBase + k * dMin;
//   return { mu, sigma };
// }

// /**
//  * React component to visualize uncertainty heatmap and distribution line chart
//  * using Plotly.js.
//  *
//  * Props:
//  * - computeResults: {
//  *     proba: number[][][];
//  *     uncertainty: Record<string, number[]>;
//  *     vmax: Record<string, number>;
//  *     X: number[][];
//  *     y: number[];
//  *     X_grid: number[][];
//  *     // Optional: groundTruthDistrib?: number[][];
//  *   }
//  * - selection: key of uncertainty to plot (default: 'total_uncertainty')
//  * - modelName: string (for title)
//  * - pdcPerturbation: string (for title)
//  */
// export default function UncertaintyPlot({
//   computeResults,
//   selection = 'total_uncertainty',
//   modelName,
//   pdcPerturbation,
// }) {
//   const { proba, uncertainty, vmax, X, y, X_grid } = computeResults;
//   const gridSize = Math.sqrt(X_grid.length);

//   // Build/change ground truth once
//   const [kdeData, setKdeData] = useState(null);
//   useEffect(() => {
//     setKdeData(buildRoseKDE({ noiseScale: 0.01, seed: 42 }));
//   }, []);

//   // Compute ground truth distrib per grid
//   const groundTruthDistrib = useMemo(() => {
//     if (!kdeData) return [];
//     return X_grid.map(([x, y]) => {
//       const { mu } = getGroundTruth(x, y, kdeData, { sigmaBase: 0.01, k: 1.0 });
//       // simulate many draws or approximate as normal
//       return Array(1000).fill(mu);
//     });
//   }, [X_grid, kdeData]);

//   // Axes for heatmap
//   const xVals = useMemo(
//     () => Array.from(new Set(X_grid.map((pt) => pt[0]))).sort((a, b) => a - b),
//     [X_grid]
//   );
//   const yVals = useMemo(
//     () => Array.from(new Set(X_grid.map((pt) => pt[1]))).sort((a, b) => a - b),
//     [X_grid]
//   );

//   // Z matrix for heatmap
//   const zMatrix = useMemo(() => {
//     const arr = [];
//     for (let i = 0; i < gridSize; i++) {
//       arr.push(
//         uncertainty[selection].slice(i * gridSize, (i + 1) * gridSize)
//       );
//     }
//     return arr;
//   }, [uncertainty, selection, gridSize]);

//   const [selectedId, setSelectedId] = useState(null);

//   const onHeatmapClick = (event) => {
//     const pt = event.points?.[0];
//     if (!pt) return;
//     const xi = xVals.indexOf(pt.x);
//     const yi = yVals.indexOf(pt.y);
//     if (xi < 0 || yi < 0) return;
//     setSelectedId(yi * gridSize + xi);
//   };

//   const predictedDistrib = useMemo(
//     () => (selectedId != null ? proba[selectedId][0] : null),
//     [selectedId, proba]
//   );

//   // Mean of predicted distribution
//   const predMean = useMemo(() => {
//     if (!predictedDistrib) return null;
//     return predictedDistrib.reduce((sum, v) => sum + v, 0) / predictedDistrib.length;
//   }, [predictedDistrib]);

//   return (
//     <div>
//       {/* Title */}
//       <h2 style={{ textAlign: 'center', margin: '1rem 0' }}>
//         {modelName} - {pdcPerturbation}
//       </h2>

//       {/* Heatmap */}
//       <Plot
//         data={[
//           {
//             type: 'heatmap',
//             x: xVals,
//             y: yVals,
//             z: zMatrix,
//             colorscale: [[0, '#006400'], [0.5, 'white'], [1, 'orange']],
//             zmax: vmax[selection],
//             showscale: true,
//             colorbar: { title: selection },
//           },
//           {
//             type: 'scatter',
//             x: X.map((pt) => pt[0]),
//             y: X.map((pt) => pt[1]),
//             mode: 'markers',
//             marker: {
//               color: y,
//               colorscale: [['0', 'red'], ['1', 'blue']],
//               line: { color: 'black', width: 1 },
//               size: 6,
//             },
//             hoverinfo: 'x+y+text',
//             text: y.map((cls) => `Class ${cls}`),
//           },
//           {
//             type: 'scatter',
//             x: [
//               X_grid[
//                 uncertainty[selection].indexOf(
//                   Math.max(...uncertainty[selection])
//                 )
//               ][0],
//             ],
//             y: [
//               X_grid[
//                 uncertainty[selection].indexOf(
//                   Math.max(...uncertainty[selection])
//                 )
//               ][1],
//             ],
//             mode: 'markers',
//             marker: { symbol: 'diamond-open', color: 'gold', size: 12, line: { width: 2 } },
//             name: 'max uncertainty',
//           },
//           {
//             type: 'scatter',
//             x: [
//               X_grid[
//                 uncertainty[selection].indexOf(
//                   Math.min(...uncertainty[selection])
//                 )
//               ][0],
//             ],
//             y: [
//               X_grid[
//                 uncertainty[selection].indexOf(
//                   Math.min(...uncertainty[selection])
//                 )
//               ][1],
//             ],
//             mode: 'markers',
//             marker: { symbol: 'hexagram-open', color: '#00FFFF', size: 16, line: { width: 2 } },
//             name: 'min uncertainty',
//           },
//         ]}
//         layout={{
//           title: `${modelName} - ${pdcPerturbation}`,
//           xaxis: { range: [-1, 1] },
//           yaxis: { range: [-1, 1] },
//           width: 550,
//           height: 550,
//         }}
//         config={{ displayModeBar: false }}
//         onClick={onHeatmapClick}
//       />

//       {/* Distribution line/density chart */}
//       {selectedId != null && predictedDistrib && (
//         <Plot
//           data={[
//             {
//               type: 'histogram',
//               x: predictedDistrib,
//               histnorm: 'probability density',
//               name: 'Predicted',
//               opacity: 0.6,
//               marker: { color: 'blue' },
//               nbinsx: 20,
//             },
//             ...(groundTruthDistrib
//               ? [
//                   {
//                     type: 'histogram',
//                     x: groundTruthDistrib[selectedId],
//                     histnorm: 'probability density',
//                     name: 'True distrib',
//                     opacity: 0.6,
//                     marker: { color: 'gray' },
//                     nbinsx: 20,
//                   },
//                 ]
//               : []),
//           ]}
//           layout={{
//             title: `Location (${(+X_grid[selectedId][0]).toFixed(
//               2
//             )}, ${(+X_grid[selectedId][1]).toFixed(2)})`,
//             barmode: 'overlay',
//             xaxis: { title: 'Probability', range: [0, 1], tickvals: [0, 0.5, 1] },
//             yaxis: { title: 'Density', range: [0, 10], tickvals: [0, 10] },
//             width: 550,
//             height: 350,
//             shapes: [
//               predMean != null && {
//                 type: 'line',
//                 x0: predMean,
//                 x1: predMean,
//                 y0: 0,
//                 y1: 10,
//                 line: { color: 'red', dash: 'dash' },
//                 name: 'Mean prob',
//               },
//               {
//                 type: 'line',
//                 x0: uncertainty.aleatoric_uncertainty[selectedId],
//                 x1: uncertainty.aleatoric_uncertainty[selectedId],
//                 y0: 0,
//                 y1: 10,
//                 line: { color: 'blue', dash: 'dot' },
//                 name: 'Aleatoric AU',
//               },
//               {
//                 type: 'line',
//                 x0: uncertainty.epistemic_uncertainty[selectedId],
//                 x1: uncertainty.epistemic_uncertainty[selectedId],
//                 y0: 0,
//                 y1: 10,
//                 line: { color: 'green', dash: 'dash' },
//                 name: 'Epistemic EU',
//               },
//               {
//                 type: 'line',
//                 x0: uncertainty.var_eu[selectedId],
//                 x1: uncertainty.var_eu[selectedId],
//                 y0: 0,
//                 y1: 10,
//                 line: { color: 'purple', dash: 'dot' },
//                 name: 'Variance EU',
//               },
//             ].filter(Boolean),
//           }}
//           config={{ displayModeBar: false }}
//         />
//       )}
//     </div>
//   );
// }

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
      const nx = x + (rand() * 2 - 1) * noiseScale;
      const ny = y + (rand() * 2 - 1) * noiseScale;
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
  const mu = total < 1e-12 ? 0.5 : dR / total;
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
}) {
  const { proba, uncertainty, vmax, X, y, X_grid } = computeResults;
  const gridSize = Math.sqrt(X_grid.length);

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

  const pred = sel != null ? proba[sel][0] : null;
  const predMean = useMemo(
    () => (pred ? pred.reduce((a, b) => a + b, 0) / pred.length : null),
    [pred]
  );

  const predKDE = useMemo(
    () => (pred ? computeKDE(pred, 0.05, densityX) : null),
    [pred, densityX]
  );
  const trueKDE = useMemo(
    () => (sel != null ? computeKDE(trueDistr[sel], 0.05, densityX) : null),
    [trueDistr, sel, densityX]
  );

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>
        {modelName} - {pdcPerturbation}
      </h2>
      <Plot
        data={[
          {
            type: "heatmap",
            x: xVals,
            y: yVals,
            z: zMatrix,
            colorscale: [
              [0, "#006400"],
              [0.5, "white"],
              [1, "orange"],
            ],
            zmax: vmax[selection],
            showscale: true,
            colorbar: { title: selection },
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
              symbol: "hexagram-open",
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
            b: 80, // leave enough bottom margin for the legend
          },
        }}
        config={{ displayModeBar: false }}
        onClick={onClick}
      />
      {/* //Distribution line/density chart */}
      {sel != null && (
        <h3 style={{ textAlign: 'center', margin: '1rem 0 0.5rem' }}>
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
                line: { color: "blue", dash: "dot" },
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
                line: { color: "purple", dash: "dot" },
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
              b: 80, // leave enough bottom margin for the legend
            },
          }}
          config={{ displayModeBar: false }}
        />
      )}
    </div>
  );
}
