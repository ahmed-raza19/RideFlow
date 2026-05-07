import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

interface RideFlowSceneProps {
  className?: string;
}

export function RideFlowScene({ className = '' }: RideFlowSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const frameRef = useRef<number | null>(null);
  const carRef = useRef<THREE.Group | null>(null);
  const destinationPinRef = useRef<THREE.Mesh | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Step 1: Canvas Setup
    const canvas = document.createElement('canvas');
    canvas.id = 'three-canvas';
    mountRef.current.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Step 2: Camera with bird's-eye view
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(3, 5, 6);
    camera.lookAt(0, 0, 0);

    // Step 3: Map Grid (Procedural)
    // A. Ground plane
    const groundGeometry = new THREE.PlaneGeometry(14, 14);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xF0E8D8, 
      roughness: 1 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // B. City block grid
    const blockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xE8DCC0, 
      roughness: 0.8 
    });
    
    const blocks = [
      { x: -4, z: -3, w: 2, h: 1.5 },
      { x: -1, z: -3, w: 1.5, h: 1.5 },
      { x: 1, z: -3, w: 2, h: 1.5 },
      { x: -4, z: -0.5, w: 1.5, h: 1 },
      { x: -1.5, z: -0.5, w: 2.5, h: 1 },
      { x: 2, z: -0.5, w: 1.5, h: 1 },
      { x: -3, z: 1.5, w: 2, h: 1.5 },
      { x: 0, z: 1.5, w: 1.5, h: 1.5 },
      { x: 2.5, z: 1.5, w: 2, h: 1.5 },
      { x: -2, z: 3.5, w: 1.5, h: 1 },
      { x: 0.5, z: 3.5, w: 2, h: 1 },
      { x: 3.5, z: 3.5, w: 1.5, h: 1 },
    ];

    blocks.forEach(block => {
      const blockGeometry = new THREE.BoxGeometry(block.w, 0.05, block.h);
      const cityBlock = new THREE.Mesh(blockGeometry, blockMaterial);
      cityBlock.position.set(block.x, 0.025, block.z);
      cityBlock.castShadow = true;
      cityBlock.receiveShadow = true;
      scene.add(cityBlock);
    });

    // C. Landmark pin (destination)
    const pinGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC7722,
      emissive: 0xCC7722,
      emissiveIntensity: 2,
      metalness: 0.3,
      roughness: 0.4
    });
    const destinationPin = new THREE.Mesh(pinGeometry, pinMaterial);
    destinationPin.position.set(2, 0.5, -2.5);
    destinationPin.castShadow = true;
    scene.add(destinationPin);
    destinationPinRef.current = destinationPin;

    // Step 4: Glowing Route Line
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3, 0.1, 2),
      new THREE.Vector3(-1, 0.1, 0),
      new THREE.Vector3(1, 0.1, -1),
      new THREE.Vector3(2, 0.1, -2.5),
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4860A,
      emissive: 0xFFAA00,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.6,
    });
    const routeLine = new THREE.Mesh(tubeGeometry, tubeMaterial);
    routeLine.castShadow = true;
    scene.add(routeLine);

    // Step 5: Car Model (with fallback)
    const createFallbackCar = () => {
      const carGroup = new THREE.Group();
      
      // Car body
      const bodyGeometry = new THREE.BoxGeometry(1.8, 0.6, 3.2);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        metalness: 0.9,
        roughness: 0.2
      });
      const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
      carBody.position.y = 0.3;
      carBody.castShadow = true;
      carGroup.add(carBody);

      // Car roof
      const roofGeometry = new THREE.BoxGeometry(1.4, 0.4, 1.8);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        metalness: 0.9,
        roughness: 0.2
      });
      const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
      carRoof.position.set(0, 0.8, -0.2);
      carRoof.castShadow = true;
      carGroup.add(carRoof);

      // Wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        metalness: 0.8,
        roughness: 0.3
      });

      const wheelPositions = [
        { x: -0.6, y: 0.15, z: 1 },
        { x: 0.6, y: 0.15, z: 1 },
        { x: -0.6, y: 0.15, z: -1 },
        { x: 0.6, y: 0.15, z: -1 }
      ];

      const wheels: THREE.Mesh[] = [];
      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        carGroup.add(wheel);
        wheels.push(wheel);
      });

      wheelsRef.current = wheels;
      return carGroup;
    };

    // Try to load GLTF car model
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);

    loader.load(
      '/assets/luxury_car.glb',
      (gltf) => {
        const car = gltf.scene;
        car.position.set(0, 0, 0);
        car.rotation.y = Math.PI * 0.6;
        car.scale.setScalar(1.2);
        
        car.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Remap body material to near-black metallic
            if (child.name.toLowerCase().includes('body') || 
                child.name.toLowerCase().includes('chassis')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x1A1A1A,
                metalness: 0.9,
                roughness: 0.2
              });
            }
            
            // Collect wheels for animation
            if (child.name.toLowerCase().includes('wheel')) {
              wheelsRef.current.push(child as THREE.Mesh);
            }
          }
        });

        scene.add(car);
        carRef.current = car;
      },
      undefined,
      () => {
        console.log('GLTF loading failed, using fallback car');
        const fallbackCar = createFallbackCar();
        fallbackCar.position.set(-3, 0, 2);
        fallbackCar.rotation.y = Math.PI * 0.6;
        scene.add(fallbackCar);
        carRef.current = fallbackCar;
      }
    );

    // Step 6: Premium Lighting
    // Warm sun from upper-right
    const sun = new THREE.DirectionalLight(0xFFE0A0, 3);
    sun.position.set(6, 8, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    // Cool fill from left
    const fill = new THREE.DirectionalLight(0xC8D8FF, 0.6);
    fill.position.set(-4, 3, -2);
    scene.add(fill);

    // Warm ambient base
    const ambient = new THREE.AmbientLight(0xFFF4E0, 0.8);
    scene.add(ambient);

    // Step 4: Post-processing for bloom effect
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.4;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.4;
    composer.addPass(bloomPass);

    composerRef.current = composer;

    // Handle resize
    const handleResize = () => {
      if (!canvas || !camera || !renderer || !composer) return;
      
      const { clientWidth: width, clientHeight: height } = canvas.parentElement!;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Step 8: Animation Loop
    const clock = new THREE.Clock();
    let routeDrawProgress = 0;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Animate route draw-on effect
      if (routeDrawProgress < 1) {
        routeDrawProgress += 0.01;
        routeLine.geometry.setDrawRange(0, routeDrawProgress * tubeGeometry.index!.count);
      }

      // Subtle camera sway
      camera.position.x = 3 + Math.sin(t * 0.25) * 0.08;

      // Destination pin pulse
      if (destinationPinRef.current) {
        const scale = 1 + Math.sin(t * 2) * 0.15;
        destinationPinRef.current.scale.setScalar(scale);
      }

      // Wheel rotation
      wheelsRef.current.forEach(wheel => {
        wheel.rotation.x += 0.05;
      });

      // Render with post-processing
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    }

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && canvas) {
        mountRef.current.removeChild(canvas);
      }
      renderer.dispose();
      composer?.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className={`w-full h-full relative ${className}`}>
      <canvas id="three-canvas" className="w-full h-full" />
    </div>
  );
}
