import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  /** Called after the first frame is drawn, so the photo underneath can fade out. */
  onReady?: () => void;
};

// The envelope is modeled in code (no 3D file to download): a puffed plastic body,
// the folded flap and the adhesive strip, in the gray of the real Envelope Cinza.
const W = 2;
const H = 2.6;

function puffedBody(depth: number) {
  const geo = new THREE.PlaneGeometry(W, H, 64, 84);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = Math.min(1, Math.abs(x) / (W / 2 - 0.04));
    const v = Math.min(1, Math.abs(y) / (H / 2 - 0.04));
    // Rounded pillow, flat at the welded edges, plus soft plastic wrinkles.
    const puff = Math.pow(1 - u * u, 0.55) * Math.pow(1 - v * v, 0.45);
    const wrinkle = 0.012 * Math.sin(x * 7 + y * 2.3) * Math.cos(y * 5.1 - x) * puff;
    pos.setZ(i, (depth * puff + wrinkle) * (u >= 1 || v >= 1 ? 0 : 1));
  }
  geo.computeVertexNormals();
  return geo;
}

function buildEnvelope() {
  const group = new THREE.Group();
  const plastic = new THREE.MeshPhysicalMaterial({
    color: 0x74777b,
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
    side: THREE.DoubleSide,
  });

  const front = new THREE.Mesh(puffedBody(0.2), plastic);
  const back = new THREE.Mesh(puffedBody(0.12), plastic);
  back.rotation.y = Math.PI;
  group.add(front, back);

  // Flap folded over the front, slightly darker, following the puff of the body.
  const flapGeo = new THREE.PlaneGeometry(W, 0.42, 48, 6);
  const fp = flapGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    const u = Math.min(1, Math.abs(fp.getX(i)) / (W / 2 - 0.04));
    const t = (fp.getY(i) + 0.21) / 0.42; // 0 at the fold line, 1 at the top edge
    fp.setZ(i, (0.1 * Math.pow(1 - u * u, 0.55) * (1 - t * 0.6) + 0.012) * (u >= 1 ? 0.3 : 1));
  }
  flapGeo.computeVertexNormals();
  const flap = new THREE.Mesh(flapGeo, plastic.clone());
  (flap.material as THREE.MeshPhysicalMaterial).color.setHex(0x5d6064);
  flap.position.y = H / 2 - 0.21;
  group.add(flap);

  group.rotation.set(-0.12, 0, 0.18);
  return group;
}

function softShadow() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.7),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1.75;
  return mesh;
}

export default function Envelope3D({ onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // No WebGL: the photo stays.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 50);
    camera.position.set(0, 0.25, 7.4);
    camera.lookAt(0, -0.1, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd3d8, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2);
    rim.position.set(-4, 2, -3);
    scene.add(key, rim);

    const envelope = buildEnvelope();
    const shadow = softShadow();
    scene.add(envelope, shadow);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Drag to turn it by hand; it keeps spinning on its own afterwards.
    let spin = 0;
    let dragX: number | null = null;
    const onDown = (e: PointerEvent) => { dragX = e.clientX; };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      spin += (e.clientX - dragX) * 0.012;
      dragX = e.clientX;
    };
    const onUp = () => { dragX = null; };
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    // Only animate while the banner is on screen.
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(host);

    const clock = new THREE.Clock();
    let frame = 0;
    let first = true;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible || document.hidden) return;
      const t = clock.elapsedTime;
      if (dragX === null) spin += dt * 0.6;
      envelope.rotation.y = spin;
      envelope.position.y = 0.06 * Math.sin(t * 1.4);
      shadow.scale.setScalar(1 - 0.06 * Math.sin(t * 1.4));
      renderer.render(scene, camera);
      if (first) {
        first = false;
        readyRef.current?.();
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material as THREE.Material & { map?: THREE.Texture | null };
          mat.map?.dispose();
          mat.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing touch-pan-y" aria-hidden="true" />;
}
