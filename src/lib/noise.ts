// Deterministic PRNG so generative graphics render identically on
// server and client (no hydration mismatch) and reproduce from a seed.
export function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function round(n: number, precision = 2) {
  const f = 10 ** precision;
  return Math.round(n * f) / f;
}
