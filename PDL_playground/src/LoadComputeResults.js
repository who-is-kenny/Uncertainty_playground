/**
 * Load compute results from a JSON asset in a CRA/Vite React app.
 * Throws descriptive errors if anything goes wrong.
 *
 * @param {string} modelName
 * @param {string} pdcPerturbation
 * @param {string} [url='/compute_results_minified.json']
 * @returns {Promise<{
*   proba: any[][][],
*   uncertainty: Record<string, number[]>,
*   vmax: Record<string, number>,
*   X: number[][],
*   y: number[],
*   X_grid: number[][]
* }>}
*/
export async function loadComputeResults(
 modelName,
 pdcPerturbation
) {
const url = `/${modelName}.json`;

 // 1) Fetch the JSON
 const res = await fetch(url);
 if (!res.ok) {
   throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
 }

 // 2) Parse it
 let allResults;
 try {
   allResults = await res.json();
 } catch (e) {
   throw new Error(`Invalid JSON in ${url}: ${e.message}`);
 }

 // 3) Validate it’s an array
 if (!Array.isArray(allResults)) {
   throw new Error(`Expected an array in ${url}, got ${typeof allResults}`);
 }

 // 4) Find the matching entry
 const entry = allResults.find(
   (item) =>
     item.model_name === modelName &&
     item.pdc_perturbation === pdcPerturbation
 );
 if (!entry) {
   throw new Error(
     `No compute results for model="${modelName}" perturbation="${pdcPerturbation}"`
   );
 }

 // 5) Verify required fields
 for (const key of ['uncertainty', 'vmax', 'X', 'y', 'X_grid', 'kde_class0', 'mean_class0']) {
   if (!(key in entry)) {
     throw new Error(`Missing key "${key}" in compute-results entry`);
   }
 }

 // 6) Return clean object
 return {
  //  proba: entry.proba,
   uncertainty: entry.uncertainty,
   vmax: entry.vmax,
   X: entry.X,
   y: entry.y,
   X_grid: entry.X_grid,
   kde_class0: entry.kde_class0,
   mean_class0: entry.mean_class0,
 };
}
