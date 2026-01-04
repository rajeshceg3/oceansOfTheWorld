import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import Creatures from './Creatures';
import Particles from './Particles';

const LightShafts = ({ color }) => {
  const mesh = useRef();

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uTime: { value: 0 }
  }), [color]);

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

  useEffect(() => {
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
      <mesh ref={mesh} position={[0, -5, 0]}>
        <cylinderGeometry args={[5, 12, 40, 64, 1, true]} />
        <primitive object={shaderMaterial} attach="material" />
      </mesh>
    </group>
  );
};

const CausticsPlane = ({ color }) => {
    const mesh = useRef();

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) }
    }), [color]);

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

const OceanScene = ({ ocean, onTransitionComplete }) => {
  const { mouse } = useThree();
  const fogRef = useRef();
  const bgColorRef = useRef();
  const creaturesRef = useRef();
  const timelineRef = useRef(null);

  const [renderedOcean, setRenderedOcean] = useState(ocean);
  const [initialColors] = useState({
      fog: ocean.colors.fog,
      background: ocean.colors.background
  });

  // Handle Transitions with GSAP
  useEffect(() => {
    if (timelineRef.current) {
        timelineRef.current.kill();
    }

    if (ocean && fogRef.current && bgColorRef.current) {
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = isReducedMotion ? 0 : 1.5;

      const tl = gsap.timeline({
          onComplete: () => {
              if (onTransitionComplete) onTransitionComplete();
          }
      });
      timelineRef.current = tl;

      // --- Environment Animation (Parallel) ---
      tl.to(fogRef.current, {
        density: 0.012,
        duration: duration,
        ease: "power2.inOut"
      }, 0);

      tl.to(fogRef.current.color, {
        r: new THREE.Color(ocean.colors.fog).r,
        g: new THREE.Color(ocean.colors.fog).g,
        b: new THREE.Color(ocean.colors.fog).b,
        duration: duration,
        ease: "power2.inOut"
      }, 0);

      tl.to(bgColorRef.current, {
        r: new THREE.Color(ocean.colors.background).r,
        g: new THREE.Color(ocean.colors.background).g,
        b: new THREE.Color(ocean.colors.background).b,
        duration: duration,
        ease: "power2.inOut"
      }, 0);


      // --- Creatures Transition (Sequence) ---
      if (ocean.id !== renderedOcean.id) {
          if (creaturesRef.current) {
              tl.to(creaturesRef.current.position, {
                  y: -5,
                  duration: duration * 0.3,
                  ease: "power2.in"
              }, 0);
              tl.to(creaturesRef.current.scale, {
                  x: 0, y: 0, z: 0,
                  duration: duration * 0.3,
                  ease: "back.in(1.7)"
              }, 0);
          }

          tl.call(() => {
              setRenderedOcean(ocean);
          }, null, duration * 0.3);

          if (creaturesRef.current) {
               tl.set(creaturesRef.current.scale, { x: 0, y: 0, z: 0 }, duration * 0.31);
               tl.set(creaturesRef.current.position, { y: 5 }, duration * 0.31);

               tl.to(creaturesRef.current.scale, {
                   x: 1, y: 1, z: 1,
                   duration: duration * 0.5,
                   ease: "back.out(1.7)"
               }, duration * 0.35);

               tl.to(creaturesRef.current.position, {
                   y: 0,
                   duration: duration * 0.5,
                   ease: "power2.out"
               }, duration * 0.35);
          }
      }
    }

    return () => {
        if (timelineRef.current) {
            timelineRef.current.kill();
        }
    };
  }, [ocean, onTransitionComplete, renderedOcean.id]);


  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const driftX = Math.sin(t * 0.1) * 2;
    const driftY = Math.cos(t * 0.15) * 1;
    const mouseX = (mouse.x * 3);
    const mouseY = (mouse.y * 1.5);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, driftX + mouseX, 0.02);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, driftY + mouseY, 0.02);
    state.camera.lookAt(driftX * 0.3, driftY * 0.3, -20);
  });

  return (
    <>
      <color ref={bgColorRef} attach="background" args={[initialColors.background]} />
      <fogExp2 ref={fogRef} attach="fog" args={[initialColors.fog, 0.012]} />

      <group>
        {/* Disabled castShadow to prevent WebGL feedback loops and performance degradation */}
        <spotLight
          position={[0, 20, 0]}
          angle={0.6}
          penumbra={1}
          intensity={1.0}
          color={ocean.colors.light}
        />

        <ambientLight intensity={0.6} color={ocean.colors.water} />

        <pointLight position={[0, -10, -10]} intensity={0.8} color={ocean.colors.light} distance={30} />

        <directionalLight position={[0, -20, 0]} intensity={0.8} color={ocean.colors.water} />

        <LightShafts color={ocean.colors.light} />
        <CausticsPlane color={ocean.colors.light} />

        <Particles color={ocean.colors.light} count={300} />
        <group ref={creaturesRef}>
           <Creatures types={renderedOcean.creatures} color={ocean.colors.light} />
        </group>

      </group>
    </>
  );
};

export default OceanScene;
