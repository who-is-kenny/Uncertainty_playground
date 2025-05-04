import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';

/**
 * React component to visualize uncertainty heatmap and distribution bar chart
 * using Plotly.js, analogous to the compute.py `plot` function.
 *
 * Props:
 * - computeResults: {
 *     proba: number[][][];
 *     uncertainty: Record<string, number[]>;
 *     vmax: Record<string, number>;
 *     X: number[][];
 *     y: number[];
 *     X_grid: number[][];
 *   }
 * - selection: key of uncertainty to plot (default: 'total_uncertainty')
 * - modelName: string (for title)
 * - pdcPerturbation: string (for title)
 */
export default function UncertaintyPlot({
  computeResults,
  selection = 'total_uncertainty',
  modelName,
  pdcPerturbation,
}) {
  const { proba, uncertainty, vmax, X, y, X_grid } = computeResults;
  const gridSize = Math.sqrt(X_grid.length);

  // Unique sorted X and Y axes values
  const xVals = useMemo(
    () => Array.from(new Set(X_grid.map((pt) => pt[0]))).sort((a, b) => a - b),
    [X_grid]
  );
  const yVals = useMemo(
    () => Array.from(new Set(X_grid.map((pt) => pt[1]))).sort((a, b) => a - b),
    [X_grid]
  );

  // 2D array of z values for heatmap
  const zMatrix = useMemo(() => {
    const arr = [];
    for (let i = 0; i < gridSize; i++) {
      arr.push(
        uncertainty[selection].slice(i * gridSize, (i + 1) * gridSize)
      );
    }
    return arr;
  }, [uncertainty, selection, gridSize]);

  const [selectedId, setSelectedId] = useState(null);

  // Handler for clicks on heatmap
  const onHeatmapClick = (event) => {
    if (!event.points || event.points.length === 0) return;
    const { x, y: yPoint } = event.points[0];
    const xi = xVals.indexOf(x);
    const yi = yVals.indexOf(yPoint);
    if (xi < 0 || yi < 0) return;
    setSelectedId(yi * gridSize + xi);
  };

  // Extract predicted distribution for selected point
  const predictedDistrib = useMemo(() => {
    if (selectedId == null) return null;
    // proba: [gridPoints, replications, classes]
    // take first replication's class probabilities
    return proba[selectedId][0];
  }, [selectedId, proba]);

  return (
    <div>
    {/* Dynamic Title */}
    <h2 style={{ textAlign: 'center', margin: '1rem 0' }}>
        {modelName} - {pdcPerturbation}
      </h2>

      {/* Heatmap + data scatter */}
      <Plot
        data={[
          {
            type: 'heatmap',
            x: xVals,
            y: yVals,
            z: zMatrix,
            colorscale: [
              [0, '#006400'],
              [0.5, 'white'],
              [1, 'orange'],
            ],
            zmax: vmax[selection],
            showscale: true,
            colorbar: { title: selection },
          },
          {
            type: 'scatter',
            x: X.map((pt) => pt[0]),
            y: X.map((pt) => pt[1]),
            mode: 'markers',
            marker: {
              color: y,
              colorscale: [['0', 'red'], ['1', 'blue']],
              line: { color: 'black', width: 1 },
              size: 6,
            },
            hoverinfo: 'x+y+text',
            text: y.map((cls) => `Class ${cls}`),
          },
          // Highlight max uncertainty
          {
            type: 'scatter',
            x: [X_grid[uncertainty[selection].indexOf(Math.max(...uncertainty[selection]))][0]],
            y: [X_grid[uncertainty[selection].indexOf(Math.max(...uncertainty[selection]))][1]],
            mode: 'markers',
            marker: { symbol: 'diamond-open', color: 'gold', size: 12, line: { width: 2 } },
            name: 'max uncertainty',
          },
          // Highlight min uncertainty
          {
            type: 'scatter',
            x: [X_grid[uncertainty[selection].indexOf(Math.min(...uncertainty[selection]))][0]],
            y: [X_grid[uncertainty[selection].indexOf(Math.min(...uncertainty[selection]))][1]],
            mode: 'markers',
            marker: { symbol: 'hexagram-open', color: '#00FFFF', size: 16, line: { width: 2 } },
            name: 'min uncertainty',
          },
        ]}
        layout={{
          title: `${modelName} - ${pdcPerturbation}`,
          xaxis: { range: [-1, 1] },
          yaxis: { range: [-1, 1] },
          width: 550,   //change this to make graph bigger
          height: 550,
        }}
        config={{ displayModeBar: false }}
        onClick={onHeatmapClick}
      />

      {selectedId != null && predictedDistrib && (
        <Plot
          data={[
            {
              type: 'bar',
              x: predictedDistrib.map((_, idx) => `Class ${idx}`),
              y: predictedDistrib,
            },
          ]}
          layout={{
            title: `Distribution at grid point #${selectedId}`,
            xaxis: { title: 'Class' },
            yaxis: { title: 'Probability', range: [0, 1] },
            width: 550,
            height: 350,
          }}
          config={{ displayModeBar: false }}
        />
      )}
    </div>
  );
}
