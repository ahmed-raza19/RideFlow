import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

interface LuxuryCar3DProps {
  className?: string;
}

export function LuxuryCar3D({ className = '' }: LuxuryCar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
  const carModelRef = useRef<THREE.Group | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Professional renderer with ACES tone mapping
    const canvas = document.getElementById('luxury-car-canvas') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true, 
      alpha: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Camera setup positioned for right side view
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 2, 8);
    camera.lookAt(0, 0, 0);

    // Environment mapping for realistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Create a simple studio environment (fallback if HDR fails to load)
    const envTexture = pmremGenerator.fromScene(new THREE.Scene()).texture;
    scene.environment = envTexture;
    scene.background = null; // Transparent background
    
    // Try to load a proper HDR environment
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
      (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      () => {
        console.log('HDR loading failed, using fallback environment');
        pmremGenerator.dispose();
      }
    );

    // Premium lighting matching RideFlow amber theme
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Warm amber rim light matching brand colors
    const rimLight = new THREE.PointLight(0xFFB347, 2, 10);
    rimLight.position.set(-5, 3, 2);
    scene.add(rimLight);

    // Additional warm fill light
    const warmLight = new THREE.PointLight(0xF59E0B, 0.5, 8);
    warmLight.position.set(3, 1, -3);
    scene.add(warmLight);

    // Shadow plane to ground the car
    const shadowGeometry = new THREE.CircleGeometry(8, 32);
    const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.5;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Create a procedural luxury car as fallback
    const createProceduralCar = () => {
      const carGroup = new THREE.Group();
      
      // Car body with premium materials
      const bodyGeometry = new THREE.BoxGeometry(4, 1.2, 2);
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        metalness: 0.9,
        roughness: 0.2,
        envMapIntensity: 1.5
      });
      const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
      carBody.position.y = 0.6;
      carBody.castShadow = true;
      carBody.receiveShadow = true;
      carGroup.add(carBody);

      // Car roof
      const roofGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.8);
      const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        metalness: 0.8,
        roughness: 0.3,
        envMapIntensity: 1.5
      });
      const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
      carRoof.position.set(0, 1.4, 0);
      carRoof.castShadow = true;
      carGroup.add(carRoof);

      // Windows with glass material
      const windowMaterial = new THREE.MeshPhysicalMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.3,
        metalness: 0.1,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5
      });

      // Windows
      const frontWindowGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.1);
      const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
      frontWindow.position.set(0, 1.6, 0.9);
      carGroup.add(frontWindow);

      const rearWindowGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.1);
      const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
      rearWindow.position.set(0, 1.6, -0.9);
      carGroup.add(rearWindow);

      // Premium wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
      const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        metalness: 0.9,
        roughness: 0.2,
        envMapIntensity: 1.5
      });

      const wheelPositions = [
        { x: -1.3, y: 0.4, z: 1.2 },
        { x: 1.3, y: 0.4, z: 1.2 },
        { x: -1.3, y: 0.4, z: -1.2 },
        { x: 1.3, y: 0.4, z: -1.2 }
      ];

      const wheels = wheelPositions.map(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        carGroup.add(wheel);
        return wheel;
      });

      // Premium rims with chrome effect
      const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16);
      const rimMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFB347,
        metalness: 1.0,
        roughness: 0.1,
        envMapIntensity: 2.0
      });

      wheelPositions.forEach(pos => {
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(pos.x, pos.y, pos.z);
        rim.rotation.z = Math.PI / 2;
        carGroup.add(rim);
      });

      // Headlights with glow
      const headlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
      const headlightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 2,
        metalness: 0.1,
        roughness: 0.2
      });

      const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      leftHeadlight.position.set(-1.5, 0.6, 1.05);
      leftHeadlight.rotation.x = Math.PI / 2;
      carGroup.add(leftHeadlight);

      const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      rightHeadlight.position.set(1.5, 0.6, 1.05);
      rightHeadlight.rotation.x = Math.PI / 2;
      carGroup.add(rightHeadlight);

      // Headlight glow lights
      const headlightLight1 = new THREE.PointLight(0xffffff, 1, 5);
      headlightLight1.position.set(-1.5, 0.6, 1.2);
      scene.add(headlightLight1);

      const headlightLight2 = new THREE.PointLight(0xffffff, 1, 5);
      headlightLight2.position.set(1.5, 0.6, 1.2);
      scene.add(headlightLight2);

      // Taillights
      const taillightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
      const taillightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1
      });

      const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      leftTaillight.position.set(-1.5, 0.6, -1.05);
      carGroup.add(leftTaillight);

      const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      rightTaillight.position.set(1.5, 0.6, -1.05);
      carGroup.add(rightTaillight);

      // Position and scale the car
      carGroup.position.set(0, -0.5, 0);
      carGroup.scale.set(1.2, 1.2, 1.2);
      
      return { group: carGroup, wheels };
    };

    // Try to load GLTF model, fallback to procedural
    const loader = new GLTFLoader();
    let carWheels: THREE.Mesh[] = [];

    loader.load(
      '/assets/luxury_car.glb', // This would be the path to your GLB file
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, -0.5, 0);
        model.scale.set(1.5, 1.5, 1.5);
        
        // Enable shadows on all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        carModelRef.current = model;
      },
      undefined,
      () => {
        console.log('GLTF loading failed, using procedural car');
        const { group, wheels } = createProceduralCar();
        scene.add(group);
        carModelRef.current = group;
        carWheels = wheels;
      }
    );

    // Mouse follow interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      targetRotationRef.current.x = mouseRef.current.y * 0.3;
      targetRotationRef.current.y = mouseRef.current.x * 0.3;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Smooth mouse follow rotation
      if (carModelRef.current) {
        carModelRef.current.rotation.x += (targetRotationRef.current.x - carModelRef.current.rotation.x) * 0.05;
        carModelRef.current.rotation.y += (targetRotationRef.current.y - carModelRef.current.rotation.y) * 0.05;
        
        // Subtle floating animation
        carModelRef.current.position.y = Math.sin(time * 1.5) * 0.05 - 0.5;
      }

      // Rotate wheels
      carWheels.forEach(wheel => {
        wheel.rotation.x += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!canvas || !camera || !renderer) return;
      
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Initial size setup
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className={`w-full h-full relative ${className}`}>
      <canvas id="luxury-car-canvas" className="w-full h-full" />
    </div>
  );
}
