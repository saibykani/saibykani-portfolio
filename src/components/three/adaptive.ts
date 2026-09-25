/* Adaptive render resolution: watches frame time and lowers the pixel ratio on slow GPUs,
 * raising it again when there is headroom. Soft 3D scenes look the same at lower res. */
export function adaptiveResolution(max: number, min = 0.5, apply: (ratio: number) => void) {
  let ratio = max;
  let ema = 16;
  let acc = 0;
  return (rawDt: number) => {
    if (rawDt <= 0 || rawDt > 0.5) return; // ignore tab switches / hitches
    ema = ema * 0.92 + rawDt * 1000 * 0.08;
    acc += rawDt;
    if (acc < 0.8) return;
    acc = 0;
    let next = ratio;
    if (ema > 24 && ratio > min) next = Math.max(min, ratio - 0.15);
    else if (ema < 14 && ratio < max) next = Math.min(max, ratio + 0.1);
    if (next !== ratio) {
      ratio = next;
      apply(ratio);
    }
  };
}
