import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';
import { FogExp2 } from 'three';
import Creatures from './Creatures';
import Particles from './Particles';

const LightShafts = ({ color }) => {
  const mesh = useRef();

  // Custom shader for soft light shafts
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        // Gradient fading out at the bottom
        float alpha = 1.0 - vUv.y;

        // Subtle horizontal movement/noise
        float noise = sin(vUv.x * 10.0 + uTime) * 0.1 + 0.9;

        gl_FragColor = vec4(uColor, alpha * 0.1 * noise);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }), [color]);

  useFrame((state) => {
    shaderMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    if (mesh.current) {
        mesh.current.rotation.y += 0.001;
    }
  });

  // Update color when prop changes
  useEffect(() => {
    shaderMaterial.uniforms.uColor.value.set(color);
  }, [color, shaderMaterial]);

  return (
    <group position={[0, 10, 0]} rotation={[0, 0, Math.PI]}>
      {/* Several cones for light shafts */}
      <mesh ref={mesh} position={[0, -5, 0]}>
        <cylinderGeometry args={[5, 10, 40, 32, 1, true]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>
    </group>
  );
};

const OceanScene = ({ ocean, isTransitioning }) => {
  const { scene, camera, mouse } = useThree();
  // Use FogExp2 for better depth falloff
  const fogRef = useRef(new FogExp2(ocean.colors.fog, 0.035));

  // Initialize fog
  useEffect(() => {
    scene.fog = fogRef.current;
    scene.background = new THREE.Color(ocean.colors.background);
  }, [scene]);

  // Handle Transitions with GSAP
  useEffect(() => {
    if (ocean) {
      gsap.to(fogRef.current, {
        density: 0.035, // can vary per ocean if needed
        duration: 2,
        ease: "power2.inOut"
      });

      gsap.to(fogRef.current.color, {
        r: new THREE.Color(ocean.colors.fog).r,
        g: new THREE.Color(ocean.colors.fog).g,
        b: new THREE.Color(ocean.colors.fog).b,
        duration: 2,
        ease: "power2.inOut"
      });

      gsap.to(scene.background, {
        r: new THREE.Color(ocean.colors.background).r,
        g: new THREE.Color(ocean.colors.background).g,
        b: new THREE.Color(ocean.colors.background).b,
        duration: 2,
        ease: "power2.inOut"
      });
    }
  }, [ocean, scene]);


  // Gentle camera drift + subtle mouse influence
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Auto drift
    const driftX = Math.sin(t * 0.1) * 2;
    const driftY = Math.cos(t * 0.15) * 1;

    // Mouse influence (mapped to -1 to 1) - subtle parallax
    // We dampen the mouse input significantly to keep it calm
    const mouseX = (mouse.x * 5); // Max 5 units offset
    const mouseY = (mouse.y * 2); // Max 2 units offset

    // Smoothly interpolate current camera position to target drift + mouse
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, driftX + mouseX, 0.02);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, driftY + mouseY, 0.02);

    // Always look slightly forward but drift focus too
    state.camera.lookAt(driftX * 0.5, driftY * 0.5, -20);
  });

  return (
    <group>
      {/* Soft Top Light (Sunlight from surface) */}
      <spotLight
        position={[0, 20, 0]}
        angle={0.8}
        penumbra={1}
        intensity={2}
        color={ocean.colors.light}
        castShadow
      />

      {/* Fill Light (Ambient ocean scatter) */}
      <ambientLight intensity={0.4} color={ocean.colors.water} />

      {/* Rim/Back light for creatures */}
      <pointLight position={[0, -10, -10]} intensity={1.5} color={ocean.colors.light} distance={30} />

      <LightShafts color={ocean.colors.light} />

      <Particles color={ocean.colors.light} count={200} />
      <Creatures types={ocean.creatures} color={ocean.colors.light} />

    </group>
  );
};

export default OceanScene;
