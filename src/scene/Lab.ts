// מנוע התלת-ממד: אריחי יסודות, מעבר רציף בין סידורים, חוט המספר האטומי, קווי משפחה וקשרים משניים.
// נטען בעצלתיים (dynamic import) כדי שדף הבית והטבלה ייטענו מהר גם בלי three.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ELEMENTS, LINKS, CATEGORIES } from "../data/elements";
import { MODELS, positions, guides, type ModelId, type Vec } from "../data/models";

export type LabOptions = {
  onHover?: (z: number | null) => void;
  onSelect?: (z: number | null) => void;
  reducedMotion?: boolean;
  autoRotate?: boolean;
  interactive?: boolean;
};

const N = ELEMENTS.length;
const TILE = 0.86;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Lab {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  private controls: OrbitControls;
  private tiles: THREE.Mesh[] = [];
  private faces: { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; mat: THREE.MeshStandardMaterial; side: THREE.MeshStandardMaterial }[] = [];
  private cur: THREE.Vector3[] = [];
  private from: THREE.Vector3[] = [];
  private to: THREE.Vector3[] = [];
  private morphStart = 0;
  private morphDur = 0;
  private camFrom = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  private camTo = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  private camStart = 0;
  private camDur = 0;
  private thread: THREE.Line;
  private families: THREE.LineSegments;
  private links: THREE.LineSegments;
  private guideGroup = new THREE.Group();
  private halo: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDirty = false;
  private hover: number | null = null;
  private selected: number | null = null;
  private dim: boolean[] | null = null;
  private colors: string[] = ELEMENTS.map((e) => CATEGORIES[e.cat].color);
  private model: ModelId = "classic";
  private raf = 0;
  private ro: ResizeObserver;
  private down = { x: 0, y: 0, t: 0 };
  private opts: LabOptions;
  private disposed = false;
  private visible = { thread: false, families: false, links: false, guides: true };

  constructor(private canvas: HTMLCanvasElement, opts: LabOptions = {}) {
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotate = !!opts.autoRotate && !opts.reducedMotion;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.enabled = opts.interactive !== false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 120;

    this.scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x1a1030, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 10, 12);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x8ab4ff, 0.8);
    rim.position.set(-10, -4, -8);
    this.scene.add(rim);

    this.addStars();
    this.buildTiles();

    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE * 1.9, TILE * 1.9),
      new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    halo.visible = false;
    this.halo = halo;
    this.scene.add(halo);

    this.thread = new THREE.Line(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3))
        .setAttribute("color", new THREE.BufferAttribute(threadColors(), 3)),
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }),
    );
    this.families = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 }));
    this.links = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
    this.scene.add(this.thread, this.families, this.links, this.guideGroup);
    this.applyVisibility();

    const start = positions("classic");
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(...start[i]);
      this.cur.push(v.clone()); this.from.push(v.clone()); this.to.push(v.clone());
    }
    this.setModel("classic", false);

    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointerleave", this.onLeave);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement || canvas);
    this.resize();
    document.fonts?.ready.then(() => !this.disposed && this.redrawFaces());
    this.loop();
  }

  // --- בנייה ---
  private addStars() {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const r = 80 + Math.random() * 120, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
      p.set([r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb4ff, size: 0.35, transparent: true, opacity: 0.5, depthWrite: false })));
  }

  private buildTiles() {
    const geo = new THREE.BoxGeometry(TILE, TILE, 0.14);
    for (const e of ELEMENTS) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 192;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const side = new THREE.MeshStandardMaterial({ color: this.colors[e.z - 1], metalness: 0.3, roughness: 0.35, transparent: true });
      const mat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.15, roughness: 0.32, transparent: true, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.35 });
      const mesh = new THREE.Mesh(geo, [side, side, side, side, mat, mat]);
      mesh.userData.z = e.z;
      this.tiles.push(mesh);
      this.faces.push({ canvas, tex, mat, side });
      this.scene.add(mesh);
    }
    this.redrawFaces();
  }

  private redrawFaces() {
    ELEMENTS.forEach((e, i) => {
      const { canvas, tex, side } = this.faces[i];
      drawFace(canvas, e.sym, e.z, e.he, this.colors[i]);
      tex.needsUpdate = true;
      side.color.set(this.colors[i]);
    });
  }

  // --- API ---
  setModel(id: ModelId, animate = true) {
    this.model = id;
    const target = positions(id);
    const instant = !animate || this.opts.reducedMotion;
    for (let i = 0; i < N; i++) {
      this.from[i].copy(this.cur[i]);
      this.to[i].set(...target[i]);
      if (instant) this.cur[i].copy(this.to[i]);
    }
    this.morphStart = performance.now();
    this.morphDur = instant ? 0 : 1500;
    this.buildGuides(id);
    this.fitCamera(!instant);
    this.updateLines();
  }

  setColors(colors: string[]) {
    this.colors = colors;
    this.redrawFaces();
  }

  setDim(mask: boolean[] | null) {
    this.dim = mask;
    this.applyOpacity();
  }

  setSelected(z: number | null) {
    this.selected = z;
    this.applyOpacity();
  }

  setLayers(v: Partial<{ thread: boolean; families: boolean; links: boolean; guides: boolean }>) {
    Object.assign(this.visible, v);
    this.applyVisibility();
    this.updateLines();
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on && !this.opts.reducedMotion;
  }

  resetView() {
    this.fitCamera(!this.opts.reducedMotion);
  }

  /** מקרב את המצלמה ליסוד. */
  focus(z: number) {
    const p = this.to[z - 1];
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.tweenCamera(p.clone().add(dir.multiplyScalar(9)), p.clone(), !this.opts.reducedMotion);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => { (x as THREE.MeshStandardMaterial).map?.dispose(); x.dispose(); });
    });
    this.renderer.dispose();
  }

  // --- פנימי ---
  private applyVisibility() {
    this.thread.visible = this.visible.thread;
    this.families.visible = this.visible.families;
    this.links.visible = this.visible.links;
    this.guideGroup.visible = this.visible.guides;
  }

  private applyOpacity() {
    ELEMENTS.forEach((e, i) => {
      const on = !this.dim || this.dim[i] || e.z === this.selected;
      const o = on ? 1 : 0.12;
      this.faces[i].mat.opacity = o;
      this.faces[i].side.opacity = o;
      this.faces[i].mat.depthWrite = on;
      this.faces[i].side.depthWrite = on;
    });
  }

  private buildGuides(id: ModelId) {
    for (const c of [...this.guideGroup.children]) {
      this.guideGroup.remove(c);
      (c as THREE.Line).geometry.dispose();
      ((c as THREE.Line).material as THREE.Material).dispose();
    }
    for (const pts of guides(id)) {
      const g = new THREE.BufferGeometry().setFromPoints(pts.map((v) => new THREE.Vector3(...v)));
      this.guideGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x7aa2ff, transparent: true, opacity: 0.22 })));
    }
  }

  private fitCamera(animate: boolean) {
    const pts = positions(this.model);
    const box = new THREE.Box3().setFromPoints(pts.map((v) => new THREE.Vector3(...v)));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const m = MODELS.find((x) => x.id === this.model)!;
    const dir = new THREE.Vector3(...(m.view as Vec)).normalize();
    const vfov = (this.camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const flat = m.shape === "דו-ממד";
    // טבלה שטוחה: מתאימים לפי רוחב וגובה; גוף תלת-ממדי: לפי כדור חוסם.
    const size = box.getSize(new THREE.Vector3());
    const d = flat
      ? Math.max(size.x / 2 / Math.tan(hfov / 2), size.y / 2 / Math.tan(vfov / 2)) * 1.08 + 1
      : (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * 0.92;
    this.tweenCamera(sphere.center.clone().add(dir.multiplyScalar(d)), sphere.center.clone(), animate);
  }

  private tweenCamera(p: THREE.Vector3, t: THREE.Vector3, animate: boolean) {
    this.camFrom.p.copy(this.camera.position);
    this.camFrom.t.copy(this.controls.target);
    this.camTo.p.copy(p);
    this.camTo.t.copy(t);
    this.camStart = performance.now();
    this.camDur = animate ? 1500 : 0;
    if (!animate) { this.camera.position.copy(p); this.controls.target.copy(t); }
  }

  private updateLines() {
    const pos = this.thread.geometry.getAttribute("position") as THREE.BufferAttribute;
    this.cur.forEach((v, i) => pos.setXYZ(i, v.x, v.y, v.z));
    pos.needsUpdate = true;
    this.thread.geometry.computeBoundingSphere();

    if (this.visible.families) {
      const seg: number[] = [], col: number[] = [];
      const byGroup = new Map<number, number[]>();
      ELEMENTS.forEach((e, i) => {
        if (e.cat === "lanthanide" || e.cat === "actinide") return;
        (byGroup.get(e.group) || byGroup.set(e.group, []).get(e.group)!).push(i);
      });
      for (const idx of byGroup.values())
        for (let k = 0; k < idx.length - 1; k++) {
          const a = this.cur[idx[k]], b = this.cur[idx[k + 1]];
          seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
          const c = new THREE.Color(this.colors[idx[k + 1]]);
          col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      this.families.geometry.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
      this.families.geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      this.families.geometry.computeBoundingSphere();
    }
    if (this.visible.links) {
      const seg: number[] = [], col: number[] = [];
      for (const l of LINKS) {
        const a = this.cur[l.a - 1], b = this.cur[l.b - 1];
        const lift = a.distanceTo(b) * 0.35 + 0.6;
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const ctrl = mid.clone().add(this.camera.position.clone().sub(mid).normalize().multiplyScalar(lift));
        const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b).getPoints(18);
        const c = new THREE.Color(l.kind === "diagonal" ? 0xffa94d : 0xff5ea8);
        for (let k = 0; k < curve.length - 1; k++) {
          seg.push(curve[k].x, curve[k].y, curve[k].z, curve[k + 1].x, curve[k + 1].y, curve[k + 1].z);
          col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
      this.links.geometry.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
      this.links.geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      this.links.geometry.computeBoundingSphere();
    }
  }

  private resize() {
    const el = this.canvas.parentElement || this.canvas;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private pick(): number | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.tiles, false);
    for (const h of hits) {
      const z = h.object.userData.z as number;
      if (!this.dim || this.dim[z - 1] || z === this.selected) return z;
    }
    return null;
  }

  private onMove = (ev: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    this.pointerDirty = true;
  };
  private onDown = (ev: PointerEvent) => { this.down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; };
  private onUp = (ev: PointerEvent) => {
    if (Math.hypot(ev.clientX - this.down.x, ev.clientY - this.down.y) > 6) return;
    this.onMove(ev);
    const z = this.pick();
    this.opts.onSelect?.(z);
  };
  private onLeave = () => {
    if (this.hover != null) { this.hover = null; this.opts.onHover?.(null); this.canvas.style.cursor = ""; }
  };

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (document.hidden) return;
    const now = performance.now();
    let moving = false;
    if (this.morphDur) {
      for (let i = 0; i < N; i++) {
        const t = Math.min(1, Math.max(0, (now - this.morphStart - i * 4) / this.morphDur));
        if (t < 1) moving = true;
        const k = ease(t);
        this.cur[i].lerpVectors(this.from[i], this.to[i], k);
        // קשת קלה במעבר, כדי שהאריחים לא יעברו זה דרך זה
        this.cur[i].y += Math.sin(Math.PI * k) * 1.2 * (1 - Math.abs(0.5 - (i / N)));
      }
      if (!moving) { this.morphDur = 0; this.cur.forEach((v, i) => v.copy(this.to[i])); }
      this.updateLines();
    }
    if (this.camDur) {
      const t = Math.min(1, (now - this.camStart) / this.camDur);
      const k = ease(t);
      this.camera.position.lerpVectors(this.camFrom.p, this.camTo.p, k);
      this.controls.target.lerpVectors(this.camFrom.t, this.camTo.t, k);
      if (t >= 1) this.camDur = 0;
    }
    this.controls.update();
    if (this.visible.links && !this.morphDur) this.updateLinksIfCameraMoved();

    if (this.pointerDirty) {
      this.pointerDirty = false;
      const z = this.pick();
      if (z !== this.hover) {
        this.hover = z;
        this.opts.onHover?.(z);
        this.canvas.style.cursor = z ? "pointer" : "";
      }
    }

    for (let i = 0; i < N; i++) {
      const m = this.tiles[i];
      m.position.copy(this.cur[i]);
      m.quaternion.copy(this.camera.quaternion);
      const z = i + 1;
      const s = z === this.selected ? 1.4 : z === this.hover ? 1.18 : 1;
      m.scale.setScalar(m.scale.x + (s - m.scale.x) * 0.2);
    }
    if (this.selected) {
      this.halo.visible = true;
      this.halo.position.copy(this.cur[this.selected - 1]);
      this.halo.quaternion.copy(this.camera.quaternion);
      this.halo.translateZ(-0.12);
      const pulse = this.opts.reducedMotion ? 1.4 : 1.35 + Math.sin(now / 320) * 0.08;
      this.halo.scale.setScalar(pulse);
    } else this.halo.visible = false;

    this.renderer.render(this.scene, this.camera);
  };

  private lastCam = new THREE.Vector3();
  private updateLinksIfCameraMoved() {
    if (this.lastCam.distanceToSquared(this.camera.position) > 0.5) {
      this.lastCam.copy(this.camera.position);
      this.updateLines();
    }
  }
}

// --- ציור פני האריח ---
function drawFace(c: HTMLCanvasElement, sym: string, z: number, he: string, color: string) {
  const g = c.getContext("2d")!;
  const s = c.width;
  g.clearRect(0, 0, s, s);
  const grad = g.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, shade(color, 0.12));
  grad.addColorStop(1, shade(color, -0.55));
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  // ברק זכוכית עליון
  const gl = g.createLinearGradient(0, 0, 0, s * 0.5);
  gl.addColorStop(0, "rgba(255,255,255,0.28)");
  gl.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gl;
  g.fillRect(0, 0, s, s * 0.5);
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 4;
  g.strokeRect(2, 2, s - 4, s - 4);
  const dark = luminance(color) > 0.55;
  g.fillStyle = dark ? "#0b1020" : "#ffffff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 ${sym.length > 2 ? 64 : 82}px "IBM Plex Sans Hebrew", "IBM Plex Mono", sans-serif`;
  g.fillText(sym, s / 2, s * 0.52);
  g.font = `500 30px "IBM Plex Mono", monospace`;
  g.textAlign = "left";
  g.fillText(String(z), 14, 28);
  g.direction = "rtl";
  g.textAlign = "center";
  g.font = `500 ${he.length > 9 ? 20 : 25}px "IBM Plex Sans Hebrew", sans-serif`;
  g.fillText(he, s / 2, s * 0.86);
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,0.9)");
  r.addColorStop(0.4, "rgba(140,180,255,0.45)");
  r.addColorStop(1, "rgba(140,180,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function threadColors() {
  const a = new Float32Array(N * 3);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) { c.setHSL(0.62 - (i / N) * 0.62, 0.9, 0.62); a.set([c.r, c.g, c.b], i * 3); }
  return a;
}
