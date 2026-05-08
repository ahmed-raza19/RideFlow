import * as THREE from 'three';

export class HeroScene {
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private mesh?: THREE.Mesh;
  private wire?: THREE.Mesh;
  private mouse = { x: 0, y: 0 };
  private rafId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // Performance gate
    const shouldRender = (() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      try {
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
      } catch { return false; }
    })();
    if (!shouldRender) return;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    this.camera.position.set(0, 0, 5);

    // Icosahedron solid + wireframe overlay
    const geo     = new THREE.IcosahedronGeometry(1.8, 1);
    const mat     = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.35 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24, wireframe: true, transparent: true, opacity: 0.08 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.wire = new THREE.Mesh(geo, wireMat);
    this.scene.add(this.mesh, this.wire);

    // Lights
    const amb = new THREE.AmbientLight(0xFFFFFF, 0.2);
    const p1  = new THREE.PointLight(0xD97706, 3, 10);
    const p2  = new THREE.PointLight(0xC2410C, 2, 8);
    p1.position.set(3, 2, 2);
    p2.position.set(-3, -1, 1);
    this.scene.add(amb, p1, p2);

    // Mouse parallax
    document.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(this.rafId);
      else this.animate();
    });

    this.animate();
  }

  private animate() {
    this.rafId = requestAnimationFrame(() => this.animate());
    const t = performance.now() * 0.0003;
    if (this.mesh && this.wire) {
      this.mesh.rotation.x = t * 0.4 + this.mouse.y * 0.15;
      this.mesh.rotation.y = t * 0.6 + this.mouse.x * 0.15;
      this.wire.rotation.x = this.mesh.rotation.x;
      this.wire.rotation.y = this.mesh.rotation.y;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
