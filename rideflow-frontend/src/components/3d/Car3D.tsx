import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Car3DProps {
  className?: string;
}

export function Car3D({ className = '' }: Car3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const warmLight = new THREE.PointLight(0xf59e0b, 0.3, 10);
    warmLight.position.set(-3, 2, 3);
    scene.add(warmLight);

    // Create car group
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;
    scene.add(carGroup);

    // Car body (main chassis)
    const bodyGeometry = new THREE.BoxGeometry(4, 1.2, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c3e50,
      metalness: 0.7,
      roughness: 0.3
    });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 0.6;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.8);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x34495e,
      metalness: 0.6,
      roughness: 0.4
    });
    const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
    carRoof.position.set(0, 1.4, 0);
    carRoof.castShadow = true;
    carGroup.add(carRoof);

    // Windows
    const windowMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.3
    });

    // Front window
    const frontWindowGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.1);
    const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
    frontWindow.position.set(0, 1.6, 0.9);
    carGroup.add(frontWindow);

    // Rear window
    const rearWindowGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.1);
    const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
    rearWindow.position.set(0, 1.6, -0.9);
    carGroup.add(rearWindow);

    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.2);
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(-1.3, 1.5, 0);
    carGroup.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(1.3, 1.5, 0);
    carGroup.add(rightWindow);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c3e50,
      metalness: 0.8,
      roughness: 0.2
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

    // Wheel rims (inner detail)
    const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 8);
    const rimMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.1
    });

    wheelPositions.forEach(pos => {
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.set(pos.x, pos.y, pos.z);
      rim.rotation.z = Math.PI / 2;
      carGroup.add(rim);
    });

    // Headlights
    const headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const headlightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-1.5, 0.6, 1.1);
    leftHeadlight.rotation.x = Math.PI / 2;
    carGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(1.5, 0.6, 1.1);
    rightHeadlight.rotation.x = Math.PI / 2;
    carGroup.add(rightHeadlight);

    // Tail lights
    const taillightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const taillightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });

    const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    leftTaillight.position.set(-1.5, 0.6, -1.05);
    carGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    rightTaillight.position.set(1.5, 0.6, -1.05);
    carGroup.add(rightTaillight);

    // Ground plane for shadows
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.1 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Animation
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Rotate car slowly
      if (carGroupRef.current) {
        carGroupRef.current.rotation.y = Math.sin(time * 0.5) * 0.3;
        carGroupRef.current.position.y = Math.sin(time * 2) * 0.1 + 0.5;
      }

      // Rotate wheels
      wheels.forEach(wheel => {
        wheel.rotation.x += 0.05;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
}
