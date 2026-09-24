import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Livery } from "@/components/ui/F1Car";

/* 3D F1 car built from primitives. Nose points along +x, ground at y = 0. */

function spokeTexture(accent: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1a1a";
  g.fillRect(0, 0, 128, 128);
  g.translate(64, 64);
  g.fillStyle = "#6b7280";
  g.beginPath();
  g.arc(0, 0, 44, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#111";
  g.lineWidth = 7;
  for (let i = 0; i < 10; i++) {
    g.rotate((Math.PI * 2) / 10);
    g.beginPath();
    g.moveTo(8, 0);
    g.lineTo(44, 0);
    g.stroke();
  }
  g.fillStyle = accent;
  g.beginPath();
  g.arc(0, 0, 10, 0, Math.PI * 2);
  g.fill();
  // tyre sidewall stripe
  g.strokeStyle = accent;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 54, 0.3, Math.PI - 0.3);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function numberTexture(num: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 128);
  g.font = "italic 900 96px Arial";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(num, 128, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type F1Car3D = { group: THREE.Group; wheels: THREE.Object3D[]; rainLight: THREE.Mesh; body: THREE.Group; dispose: () => void };

export function buildF1Car(L: Livery): F1Car3D {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const disposables: { dispose: () => void }[] = [];

  const paint = new THREE.MeshPhysicalMaterial({ color: L.base, metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 });
  const paint2 = new THREE.MeshPhysicalMaterial({ color: L.base2, metalness: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const accent = new THREE.MeshPhysicalMaterial({ color: L.accent, metalness: 0.3, roughness: 0.3, clearcoat: 1 });
  const accent2 = new THREE.MeshPhysicalMaterial({ color: L.accent2, metalness: 0.3, roughness: 0.3, clearcoat: 1 });
  const carbon = new THREE.MeshStandardMaterial({ color: "#121316", metalness: 0.4, roughness: 0.45 });
  const tyreMat = new THREE.MeshStandardMaterial({ color: "#0c0c0d", roughness: 0.92, metalness: 0 });
  const halo = new THREE.MeshStandardMaterial({ color: "#2a2d33", metalness: 0.9, roughness: 0.25 });
  disposables.push(paint, paint2, accent, accent2, carbon, tyreMat, halo);

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = body) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    disposables.push(geo);
    return m;
  };

  // floor / plank
  add(new THREE.BoxGeometry(4.3, 0.05, 1.55), carbon, -0.2, 0.1, 0);

  // nose cone (tapered, flattened)
  const nose = add(new THREE.CylinderGeometry(0.07, 0.24, 1.8, 20), paint, 1.95, 0.34, 0);
  nose.rotation.z = -Math.PI / 2;
  nose.scale.set(1, 1, 0.75);
  add(new THREE.BoxGeometry(1.5, 0.03, 0.12), accent, 1.9, 0.5, 0).rotation.z = -0.1; // nose stripe

  // cockpit tub + sidepods + engine cover
  add(new RoundedBoxGeometry(1.7, 0.44, 0.8, 4, 0.14), paint, 0.45, 0.36, 0);
  for (const z of [-1, 1]) {
    const pod = add(new RoundedBoxGeometry(1.7, 0.34, 0.5, 4, 0.14), paint, -0.2, 0.29, z * 0.62);
    pod.rotation.y = z * -0.05;
    add(new RoundedBoxGeometry(0.06, 0.24, 0.4, 2, 0.02), carbon, 0.66, 0.31, z * 0.64); // inlet
    add(new THREE.BoxGeometry(1.5, 0.05, 0.02), accent2, -0.25, 0.43, z * 0.87); // sidepod livery
  }
  const cover = add(new THREE.CapsuleGeometry(0.28, 1.5, 6, 16), paint, -0.95, 0.52, 0);
  cover.rotation.z = Math.PI / 2;
  cover.scale.set(1.1, 1, 0.85);
  add(new THREE.BoxGeometry(1.4, 0.3, 0.02), paint2, -1.35, 0.78, 0); // shark fin
  add(new RoundedBoxGeometry(0.4, 0.3, 0.34, 3, 0.08), accent2, 0.0, 0.82, 0); // airbox
  add(new THREE.BoxGeometry(0.05, 0.16, 0.18), carbon, 0.21, 0.84, 0);

  // number decal on the engine cover
  const numTex = numberTexture(L.number, "#ffffff");
  const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });
  disposables.push(numTex, numMat);
  const num = add(new THREE.PlaneGeometry(0.7, 0.35), numMat, -0.85, 0.83, 0);
  num.rotation.x = -Math.PI / 2;
  num.rotation.z = -Math.PI / 2;

  // driver helmet + halo
  add(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshPhysicalMaterial({ color: L.helmet, clearcoat: 1, roughness: 0.2 }), 0.42, 0.72, 0);
  add(new THREE.BoxGeometry(0.06, 0.06, 0.26), new THREE.MeshPhysicalMaterial({ color: "#050505", metalness: 1, roughness: 0.05 }), 0.56, 0.74, 0);
  const haloArc = add(new THREE.TorusGeometry(0.3, 0.035, 8, 28, Math.PI), halo, 0.45, 0.72, 0);
  haloArc.rotation.x = Math.PI / 2;
  haloArc.rotation.z = Math.PI / 2;
  const pillar = add(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), halo, 0.78, 0.65, 0);
  pillar.rotation.z = 0.5;

  // front wing: main plane, two flaps, endplates
  add(new THREE.BoxGeometry(0.45, 0.035, 1.95), paint2, 2.78, 0.1, 0);
  add(new THREE.BoxGeometry(0.3, 0.03, 1.85), accent, 2.62, 0.16, 0).rotation.z = 0.25;
  add(new THREE.BoxGeometry(0.22, 0.03, 1.8), accent2, 2.5, 0.22, 0).rotation.z = 0.4;
  for (const z of [-1, 1]) add(new THREE.BoxGeometry(0.55, 0.2, 0.03), paint2, 2.72, 0.16, z * 0.98);

  // rear wing: main plane, DRS flap, endplates, beam wing, support
  add(new THREE.BoxGeometry(0.38, 0.05, 1.1), paint2, -2.35, 0.9, 0);
  add(new THREE.BoxGeometry(0.28, 0.04, 1.08), accent, -2.3, 1.02, 0).rotation.z = -0.35;
  for (const z of [-1, 1]) add(new THREE.BoxGeometry(0.6, 0.55, 0.03), paint, -2.33, 0.78, z * 0.56);
  add(new THREE.BoxGeometry(0.25, 0.04, 1.0), carbon, -2.2, 0.42, 0);
  add(new THREE.BoxGeometry(0.06, 0.5, 0.06), carbon, -2.15, 0.62, 0);

  // rain light
  const rainMat = new THREE.MeshBasicMaterial({ color: "#ff2020" });
  disposables.push(rainMat);
  const rainLight = add(new THREE.BoxGeometry(0.04, 0.08, 0.14), rainMat, -2.62, 0.4, 0);

  // wheels (spin around z) + suspension arms
  const wheels: THREE.Object3D[] = [];
  const spokes = spokeTexture(L.accent);
  const rimMat = new THREE.MeshStandardMaterial({ map: spokes, metalness: 0.6, roughness: 0.35 });
  disposables.push(spokes, rimMat);
  const wheel = (x: number, z: number, r: number, w: number) => {
    const hub = new THREE.Group();
    hub.position.set(x, r, z);
    group.add(hub);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36), tyreMat);
    tyre.rotation.x = Math.PI / 2;
    tyre.castShadow = true;
    hub.add(tyre);
    disposables.push(tyre.geometry);
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 32), rimMat);
      cap.position.z = s * (w / 2 + 0.002);
      if (s < 0) cap.rotation.y = Math.PI;
      hub.add(cap);
      disposables.push(cap.geometry);
    }
    wheels.push(hub);
    // wishbones from body to hub
    for (const dy of [0.08, -0.06]) {
      const len = Math.abs(z) - 0.35;
      const arm = add(new THREE.CylinderGeometry(0.018, 0.018, len, 6), carbon, x, r + dy, Math.sign(z) * (0.35 + len / 2), group);
      arm.rotation.x = Math.PI / 2;
    }
  };
  wheel(1.78, -0.82, 0.33, 0.34);
  wheel(1.78, 0.82, 0.33, 0.34);
  wheel(-1.55, -0.84, 0.36, 0.44);
  wheel(-1.55, 0.84, 0.36, 0.44);

  return {
    group,
    wheels,
    rainLight,
    body,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
