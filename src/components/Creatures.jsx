import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Improved Jellyfish with organic pulsing
const Jellyfish = ({ count = 5, color }) => {
  const mesh = useRef();

  // Use state to initialize random data once to avoid impurity
  const [data] = useState(() => {
    return new Array(count).fill().map(() => ({
      position: new THREE.Vector3(Math.random() * 20 - 10, Math.random() * 10 - 5, Math.random() * 20 - 15),
      speed: Math.random() * 0.5 + 0.5,
      offset: Math.random() * Math.PI * 2,
      scale: Math.random() * 0.5 + 0.8
    }));
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (mesh.current) {
        data.forEach((d, i) => {
        // Bobbing motion
        const y = d.position.y + Math.sin(time * d.speed * 0.5 + d.offset) * 2;
        const x = d.position.x + Math.cos(time * 0.1 + d.offset) * 1;
        const z = d.position.z + Math.sin(time * 0.1 + d.offset) * 1;

        dummy.position.set(x, y, z);

        // Bell pulsation (contraction/expansion) - Squash and Stretch
        const pulse = Math.sin(time * 2 + d.offset);

        // Contract: taller and thinner. Expand: shorter and wider.
        const stretch = 1 + pulse * 0.1; // Height factor
        const squash = 1 - pulse * 0.1; // Width factor

        dummy.scale.set(d.scale * squash, d.scale * stretch, d.scale * squash);

        // Tilt in direction of movement (approximated)
        dummy.rotation.x = pulse * 0.2;
        dummy.rotation.z = Math.cos(time * 0.1) * 0.1;

        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      {/* Semi-sphere for the bell */}
      <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transmission={0.8}
        thickness={2}
        roughness={0.1}
        ior={1.5}
        clearcoat={1}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

// Improved School of Fish with cohesive movement
const SchoolOfFish = ({ count = 200, color }) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const center = useRef(new THREE.Vector3(0, 0, -10));

    const [data] = useState(() => {
        return new Array(count).fill().map(() => ({
            offset: new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 10
            ),
            speed: Math.random() * 0.2 + 0.8,
            phase: Math.random() * Math.PI * 2,
            noiseOffset: Math.random() * 100
        }));
    });

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();

        // Move the center of the school in a figure-eight
        center.current.x = Math.sin(time * 0.2) * 12;
        center.current.z = Math.cos(time * 0.1) * 8 - 12;
        center.current.y = Math.sin(time * 0.3) * 3;

        // Calculate velocity (direction) of the center
        const velX = Math.cos(time * 0.2) * 2.4; // derivative of sin is cos
        const velZ = -Math.sin(time * 0.1) * 0.8;
        const angle = Math.atan2(velX, velZ) + Math.PI; // Face direction

        if (mesh.current) {
            data.forEach((d, i) => {
                // Fish position relative to center
                // Add some individual wave motion
                const x = center.current.x + d.offset.x;
                const y = center.current.y + d.offset.y + Math.sin(time * 2 + d.phase) * 0.2;
                const z = center.current.z + d.offset.z;

                dummy.position.set(x, y, z);

                // Orientation
                dummy.rotation.y = angle + Math.sin(time + d.noiseOffset) * 0.1;
                dummy.rotation.z = Math.sin(time * 4 + d.phase) * 0.1; // Banking
                dummy.rotation.x = Math.sin(time * 0.5 + d.phase) * 0.1; // Pitch

                dummy.scale.set(0.1, 0.1, 0.3); // Elongated

                dummy.updateMatrix();
                mesh.current.setMatrixAt(i, dummy.matrix);
            });
            mesh.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            {/* Simple cone shape for fish */}
            <coneGeometry args={[1, 3, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
        </instancedMesh>
    );
};

// Procedural Whale using segments
const Whale = ({ color }) => {
    const segments = 12;
    // Fix: initialized refs properly without side effects in render
    // Use an array of correct size to avoid potential sparse array issues if something goes wrong
    const bodyRefs = useRef(new Array(segments).fill(null));

    // Store positions history for the "snake" effect
    const pathRef = useRef(new Array(segments).fill(null).map(() => new THREE.Vector3(0,0,0)));

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime() * 0.5;

        // Head position (Leading the way)
        const headPos = new THREE.Vector3(
            Math.sin(t * 0.3) * 25,
            Math.sin(t * 0.5) * 5 - 5,
            Math.cos(t * 0.3) * 15 - 15
        );

        // Calculate tangent for head rotation
        const nextPos = new THREE.Vector3(
             Math.sin((t + 0.01) * 0.3) * 25,
             Math.sin((t + 0.01) * 0.5) * 5 - 5,
             Math.cos((t + 0.01) * 0.3) * 15 - 15
        );
        const direction = nextPos.clone().sub(headPos).normalize();

        if (!pathRef.current[0]) return;

        // Move head
        pathRef.current[0].copy(headPos);

        // Update body segments
        for (let i = 1; i < segments; i++) {
            const target = pathRef.current[i-1];
            const current = pathRef.current[i];

            // Move towards target, maintaining distance
            const dist = 1.5; // segment distance
            const vec = target.clone().sub(current);
            const length = vec.length();

            // Simple follow logic: move if too far
            if (length > dist) {
                const move = vec.normalize().multiplyScalar(length - dist);
                current.add(move);
            }
        }

        // Render segments
        bodyRefs.current.forEach((mesh, i) => {
            if (!mesh) return;
            mesh.position.copy(pathRef.current[i]);

            // Look at prev segment (or next) to orient
            if (i > 0) {
                 mesh.lookAt(pathRef.current[i-1]);
            } else {
                 mesh.lookAt(headPos.clone().add(direction.multiplyScalar(10)));
            }

            // Scale body to taper
            let s = 1.5;
            if (i > segments - 4) s *= (segments - i) / 4; // Taper tail
            if (i === 0) s = 1.2; // Head size

            mesh.scale.set(s, s, s);
        });
    });

    return (
        <group>
             {/* Create an array to map over. We can't use bodyRefs.current.map because it might be empty initially. */}
             {new Array(segments).fill().map((_, i) => (
                 <mesh
                    key={i}
                    ref={el => bodyRefs.current[i] = el}
                    position={[0,0,0]} // Initial
                 >
                    {/* Use a sphere or capsule for smooth segments */}
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
                 </mesh>
             ))}
        </group>
    );
};

// Ray: Flat, wide creature
const Ray = ({ count = 3, color }) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const [data] = useState(() => {
        return new Array(count).fill().map(() => ({
            position: [Math.random() * 40 - 20, Math.random() * 10 - 10, Math.random() * 40 - 20],
            speed: Math.random() * 0.05 + 0.02,
            phase: Math.random() * Math.PI * 2
        }));
    });

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();
        if (mesh.current) {
            data.forEach((d, i) => {
                // Glide
                const z = d.position[2] + Math.cos(time * d.speed + d.phase) * 10;
                const x = d.position[0] + Math.sin(time * d.speed * 0.5 + d.phase) * 10;
                const y = d.position[1];

                dummy.position.set(x, y, z);
                // Look ahead
                const lookAtX = x + Math.cos(time * d.speed * 0.5) * 5;
                const lookAtZ = z - Math.sin(time * d.speed) * 5;
                dummy.lookAt(lookAtX, y, lookAtZ);

                // Wing flap (scale width)
                const flap = Math.sin(time * 3 + d.phase) * 0.5 + 1.5;
                dummy.scale.set(flap * 2, 0.2, 1.5);

                dummy.updateMatrix();
                mesh.current.setMatrixAt(i, dummy.matrix);
            });
            mesh.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[1, 1, 2]} />
            <meshStandardMaterial color={color} roughness={0.5} />
        </instancedMesh>
    );
}


const Creatures = ({ types, color }) => {
  return (
    <group>
      {types.includes('jellyfish') && <Jellyfish count={15} color={color} />}
      {types.includes('school') && <SchoolOfFish count={200} color={color} />}
      {types.includes('whale') && <Whale color={color} />}
      {types.includes('ray') && <Ray count={5} color={color} />}
    </group>
  );
};

export default Creatures;
