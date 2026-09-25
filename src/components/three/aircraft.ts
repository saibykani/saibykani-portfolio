import * as THREE from "three";

/* Premium aircraft models shared by the hero sky and the theme worlds. */

export function flatShape(points: [number, number][], depth: number) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) s.lineTo(x, y);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
}

export type Light = { sprite: THREE.Sprite; kind: "red" | "green" | "strobe" | "beacon"; phase: number };
export type Aircraft = { outer: THREE.Group; inner: THREE.Group; lights: Light[]; exhaust: THREE.Vector3[] };

/* Detailed airliner: lathe-turned fuselage, lit cabin windows, winglets, fans. Nose along +x. */
export function buildAirliner(glow: THREE.Texture, livery: string): Aircraft {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.rotation.y = -Math.PI / 2; // maps +x (nose) onto +z so lookAt() points the nose forward
  outer.add(g);

  const paint = new THREE.MeshStandardMaterial({ color: "#f1f4fa", metalness: 0.25, roughness: 0.28 });
  const metal = new THREE.MeshStandardMaterial({ color: "#a9b3c6", metalness: 0.85, roughness: 0.3 });
  const trim = new THREE.MeshStandardMaterial({ color: livery, metalness: 0.3, roughness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: "#0b1220", metalness: 0.9, roughness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.6 });

  // fuselage: smooth tapered profile (round nose, tail cone)
  const prof: [number, number][] = [
    [0.0, 2.75], [0.1, 2.7], [0.21, 2.57], [0.3, 2.35], [0.355, 2.05], [0.37, 1.7],
    [0.37, -1.35], [0.35, -1.8], [0.29, -2.25], [0.19, -2.62], [0.07, -2.85], [0.0, -2.9],
  ];
  const fusGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40);
  fusGeo.rotateZ(-Math.PI / 2);
  g.add(new THREE.Mesh(fusGeo, paint));

  // livery cheatlines
  for (const z of [-1, 1]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.05, 0.02), trim);
    line.position.set(-0.1, 0.02, z * 0.365);
    g.add(line);
  }

  // cabin windows, glowing warm
  const wins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.075, 0.02), new THREE.MeshBasicMaterial({ color: "#ffe2a8" }), 38);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (const z of [-1, 1])
    for (let i = 0; i < 19; i++) {
      m4.makeTranslation(-1.3 + i * 0.165, 0.13, z * 0.358);
      wins.setMatrixAt(k++, m4);
    }
  g.add(wins);
  for (const z of [-1, 1]) {
    const cw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.03), glass);
    cw.position.set(2.28, 0.15, z * 0.2);
    cw.rotation.y = z * 0.5;
    g.add(cw);
  }

  // swept wings with winglets
  const wing = flatShape([[0.85, 0.3], [-0.85, 3.0], [-1.3, 3.0], [-0.6, 0.3], [-0.6, -0.3], [-1.3, -3.0], [-0.85, -3.0], [0.85, -0.3]], 0.05);
  wing.rotateX(Math.PI / 2);
  const wings = new THREE.Mesh(wing, paint);
  wings.position.set(0.2, -0.15, 0);
  g.add(wings);
  for (const z of [-1, 1]) {
    const wl = new THREE.Mesh(flatShape([[0, 0], [-0.22, 0.42], [-0.38, 0.42], [-0.3, 0]], 0.025), trim);
    wl.position.set(-0.95, -0.15, z * 3.0 - 0.012);
    g.add(wl);
  }

  // tailplane + livery fin
  const tp = flatShape([[-1.9, 0.2], [-2.5, 1.15], [-2.75, 1.15], [-2.5, 0.2], [-2.5, -0.2], [-2.75, -1.15], [-2.5, -1.15], [-1.9, -0.2]], 0.035);
  tp.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(tp, paint));
  const fin = new THREE.Mesh(flatShape([[-1.7, 0.25], [-2.55, 1.6], [-2.9, 1.6], [-2.65, 0.25]], 0.05), trim);
  fin.position.z = -0.025;
  g.add(fin);

  // engines: nacelle, fan face, spinner, pylon
  for (const z of [-1.2, 1.2]) {
    const nac = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.85, 24, 1, true), metal);
    nac.rotation.z = Math.PI / 2;
    nac.position.set(0.35, -0.36, z);
    g.add(nac);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), dark);
    fan.rotation.y = Math.PI / 2;
    fan.position.set(0.77, -0.36, z);
    g.add(fan);
    const spin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 16), metal);
    spin.rotation.z = -Math.PI / 2;
    spin.position.set(0.8, -0.36, z);
    g.add(spin);
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.05), paint);
    pylon.position.set(0.3, -0.22, z);
    g.add(pylon);
  }

  const lights: Light[] = [];
  const addLight = (x: number, y: number, z: number, color: string, kind: Light["kind"], size: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.position.set(x, y, z);
    sp.scale.setScalar(size);
    g.add(sp);
    lights.push({ sprite: sp, kind, phase: Math.random() * 10 });
  };
  addLight(-1.25, -0.12, 3.05, "#ff3b3b", "red", 0.75);
  addLight(-1.25, -0.12, -3.05, "#3bff8a", "green", 0.75);
  addLight(-2.9, 1.62, 0, "#ffffff", "strobe", 1.5);
  addLight(0, 0.42, 0, "#ff5050", "beacon", 0.8);
  addLight(-0.2, -0.4, 0, "#ff5050", "beacon", 0.6);

  return { outer, inner: g, lights, exhaust: [new THREE.Vector3(-0.1, -0.36, -1.2), new THREE.Vector3(-0.1, -0.36, 1.2)] };
}

/* Sleek delta-wing jet with afterburner glow. */
export function buildJet(glow: THREE.Texture): Aircraft {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.rotation.y = -Math.PI / 2;
  outer.add(g);
  const mat = new THREE.MeshStandardMaterial({ color: "#8e98ab", metalness: 0.7, roughness: 0.3 });
  const prof: [number, number][] = [[0, 1.5], [0.07, 1.35], [0.14, 1.0], [0.17, 0.4], [0.17, -0.9], [0.14, -1.2], [0.0, -1.25]];
  const fg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24);
  fg.rotateZ(-Math.PI / 2);
  g.add(new THREE.Mesh(fg, mat));
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#0b1a33", metalness: 0.9, roughness: 0.05 })
  );
  canopy.scale.set(2.2, 0.8, 0.9);
  canopy.position.set(0.7, 0.12, 0);
  g.add(canopy);
  const wing = flatShape([[0.6, 0.15], [-0.9, 1.25], [-1.15, 1.25], [-0.95, 0.15], [-0.95, -0.15], [-1.15, -1.25], [-0.9, -1.25], [0.6, -0.15]], 0.035);
  wing.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(wing, mat));
  for (const z of [-0.18, 0.18]) {
    const m = new THREE.Mesh(flatShape([[-0.7, 0.1], [-1.15, 0.72], [-1.35, 0.72], [-1.2, 0.1]], 0.025), mat);
    m.position.z = z;
    m.rotation.x = z > 0 ? -0.25 : 0.25;
    g.add(m);
  }
  const burner = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ff9a3c", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  burner.position.set(-1.4, 0, 0);
  burner.scale.set(1.2, 0.6, 1);
  g.add(burner);
  return { outer, inner: g, lights: [{ sprite: burner, kind: "beacon", phase: 0 }], exhaust: [new THREE.Vector3(-1.3, 0, 0)] };
}

