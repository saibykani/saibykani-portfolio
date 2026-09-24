/* Low-precision astronomy for real-time sun & moon positions (good to ~1° — plenty for visuals). */

const RAD = Math.PI / 180;

export function julianDate(d: Date) {
  return d.getTime() / 86400000 + 2440587.5;
}

/** Greenwich mean sidereal time in degrees. */
export function gmstDeg(d: Date) {
  const D = julianDate(d) - 2451545.0;
  return (((280.46061837 + 360.98564736629 * D) % 360) + 360) % 360;
}

/** Sub-solar point (where the sun is directly overhead) as lat/lon in degrees. */
export function subsolarPoint(d: Date) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const N = (d.getTime() - start) / 86400000;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (N + 10));
  const B = (2 * Math.PI * (N - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // minutes
  const hours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  let lon = -15 * (hours - 12 + eot / 60);
  lon = ((lon + 540) % 360) - 180;
  return { lat: decl, lon };
}

/** Sub-lunar point (lat/lon in degrees), phase angle and illuminated fraction. */
export function moonState(d: Date) {
  const D = julianDate(d) - 2451545.0;
  const L = (218.316 + 13.176396 * D) * RAD;
  const M = (134.963 + 13.064993 * D) * RAD;
  const F = (93.272 + 13.22935 * D) * RAD;
  const lambda = L + 6.289 * RAD * Math.sin(M);
  const beta = 5.128 * RAD * Math.sin(F);
  const eps = 23.439 * RAD;
  const ra = Math.atan2(Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps), Math.cos(lambda));
  const dec = Math.asin(Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda));
  let lon = ra / RAD - gmstDeg(d);
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;

  // phase: elongation between moon and sun ecliptic longitudes
  const n = D;
  const g = (357.529 + 0.98560028 * n) * RAD;
  const q = 280.459 + 0.98564736 * n;
  const sunLon = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  let elong = (lambda - sunLon) % (2 * Math.PI);
  if (elong < 0) elong += 2 * Math.PI;
  const illum = (1 - Math.cos(elong)) / 2;
  const deg = elong / RAD;
  const name =
    deg < 22.5 ? "New Moon" : deg < 67.5 ? "Waxing Crescent" : deg < 112.5 ? "First Quarter" : deg < 157.5 ? "Waxing Gibbous" : deg < 202.5 ? "Full Moon" : deg < 247.5 ? "Waning Gibbous" : deg < 292.5 ? "Last Quarter" : deg < 337.5 ? "Waning Crescent" : "New Moon";
  return { lat: dec / RAD, lon, illum, phase: name };
}

/** lat/lon (deg) -> unit vector matching three.js SphereGeometry UV mapping of an equirectangular map. */
export function latLonToVec(lat: number, lon: number, r = 1): [number, number, number] {
  const phi = (lon + 180) * RAD;
  const la = lat * RAD;
  return [-Math.cos(phi) * Math.cos(la) * r, Math.sin(la) * r, Math.sin(phi) * Math.cos(la) * r];
}
