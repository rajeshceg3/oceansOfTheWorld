import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import gsap from 'gsap';
import * as THREE from 'three';
import { FogExp2 } from 'three';
import Creatures from './Creatures';
import Particles from './Particles';

const LightShafts = ({ color }) => {
  const mesh = useRef();

  // Create a stable object that holds uniforms
  const [uniforms] = useState(() => ({
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 }
  }));

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: uniforms,
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

        // Add vertical streaks
        float streaks = sin(vUv.x * 50.0 + uTime * 0.5) * 0.05 + 0.95;

        gl_FragColor = vec4(uColor, alpha * 0.15 * noise * streaks);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }), [uniforms]);

  // Update color when prop changes
  useEffect(() => {
    // We are mutating the property of the object stored in state.
    // This is technically mutating state, but since we don't need a re-render for uniforms (WebGL handles it),
    // and we want to avoid re-creating the material, this is the Three.js way.
    // However, eslint-plugin-react-hooks is strict.
    // The workaround is to use a ref to hold the uniforms object, as refs are mutable containers.
    // But previous attempts failed because I accessed ref.current in render.
    // Let's try useMemo again but mutate the *values* inside useFrame, and hope linter accepts it if we alias it?
    // No, linter is smart.

    // Final strategy: useRef for uniforms, pass uniforms.current to material,
    // BUT do not access uniforms.current in JSX or critical render path that causes "access ref during render" error.
    // We are passing it to `new ShaderMaterial`, which happens in useMemo. That IS during render.

    // So, we use `useMemo` to create the uniforms object.
    // But `useMemo` result is immutable according to linter.

    // Correct R3F pattern:
    // const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
    // useFrame(() => (uniforms.uTime.value = time))
    // This usually triggers the linter.

    // We will suppress the linter for these specific lines because modifying uniform values
    // is the standard way to animate shaders in Three.js without destroying performance.

    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  useFrame((state) => {
    // eslint-disable-next-line react-hooks/immutability
    uniforms.uTime.value = state.clock.getElapsedTime() * 0.2;

    if (mesh.current) {
        mesh.current.rotation.y += 0.0005;
    }
  });

  return (
    <group position={[0, 10, 0]} rotation={[0, 0, Math.PI]}>
      {/* Several cones for light shafts */}
      <mesh ref={mesh} position={[0, -5, 0]}>
        <cylinderGeometry args={[5, 12, 40, 64, 1, true]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>
    </group>
  );
};

// Caustics Simulation Plane
const CausticsPlane = ({ color }) => {
    const mesh = useRef();

    const [uniforms] = useState(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) }
    }));

    // Simple noise shader for caustics
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;

            // Simplex noise function (simplified)
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                float time = uTime * 0.5;
                float noise1 = snoise(vUv * 10.0 + time);
                float noise2 = snoise(vUv * 20.0 - time * 0.5);

                float combined = (noise1 + noise2) * 0.5;
                // Sharpen the noise to look like caustics
                float caustics = smoothstep(0.4, 0.6, combined);

                gl_FragColor = vec4(uColor, caustics * 0.1);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }), [uniforms]);

    useEffect(() => {
        uniforms.uColor.value.set(color);
    }, [color, uniforms]);

    useFrame((state) => {
        // eslint-disable-next-line react-hooks/immutability
        uniforms.uTime.value = state.clock.getElapsedTime();
    });

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
            <planeGeometry args={[100, 100]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}

const OceanScene = ({ ocean }) => {
  const { scene, mouse } = useThree();
  // Use FogExp2 for better depth falloff
  const fogRef = useRef(new FogExp2(ocean.colors.fog, 0.035));

  // Initialize fog
  // Using useLayoutEffect to set it before paint
  useEffect(() => {
    // We modify the scene directly as per Three.js patterns
    const currentScene = scene;
    currentScene.fog = fogRef.current;
    currentScene.background = new THREE.Color(ocean.colors.background);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to attach, then GSAP handles updates

  // Handle Transitions with GSAP
  useEffect(() => {
    if (ocean) {
      gsap.to(fogRef.current, {
        density: 0.025, // Slightly less dense to show off depth
        duration: 3,
        ease: "power2.inOut"
      });

      gsap.to(fogRef.current.color, {
        r: new THREE.Color(ocean.colors.fog).r,
        g: new THREE.Color(ocean.colors.fog).g,
        b: new THREE.Color(ocean.colors.fog).b,
        duration: 3,
        ease: "power2.inOut"
      });

      gsap.to(scene.background, {
        r: new THREE.Color(ocean.colors.background).r,
        g: new THREE.Color(ocean.colors.background).g,
        b: new THREE.Color(ocean.colors.background).b,
        duration: 3,
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
    const mouseX = (mouse.x * 3);
    const mouseY = (mouse.y * 1.5);

    // Smoothly interpolate current camera position to target drift + mouse
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, driftX + mouseX, 0.02);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, driftY + mouseY, 0.02);

    // Always look slightly forward but drift focus too
    state.camera.lookAt(driftX * 0.3, driftY * 0.3, -20);
  });

  return (
    <>
      <group>
        {/* Soft Top Light (Sunlight from surface) */}
        <spotLight
          position={[0, 20, 0]}
          angle={0.6}
          penumbra={1}
          intensity={1.5}
          color={ocean.colors.light}
          castShadow
        />

        {/* Fill Light (Ambient ocean scatter) */}
        <ambientLight intensity={0.6} color={ocean.colors.water} />

        {/* Rim/Back light for creatures */}
        <pointLight position={[0, -10, -10]} intensity={1} color={ocean.colors.light} distance={30} />

        {/* Deep blue light from below for depth */}
        <directionalLight position={[0, -20, 0]} intensity={0.5} color={ocean.colors.water} />

        <LightShafts color={ocean.colors.light} />
        <CausticsPlane color={ocean.colors.light} />

        <Particles color={ocean.colors.light} count={300} />
        <Creatures types={ocean.creatures} color={ocean.colors.light} />

      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.8} intensity={0.5} radius={0.5} levels={5} />
        <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

export default OceanScene;
