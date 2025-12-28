import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

// Improved Jellyfish with "breathing" motion and trails
const Jellyfish = ({ count = 5, color }) => {
  const mesh = useRef();

  const data = useMemo(() => {
    return new Array(count).fill().map(() => ({
      position: new THREE.Vector3(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 20),
      speed: Math.random() * 0.5 + 0.2,
      offset: Math.random() * Math.PI * 2,
      scale: Math.random() * 0.5 + 0.5
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    data.forEach((d, i) => {
      // Bobbing motion
      const y = d.position.y + Math.sin(time * d.speed + d.offset) * 2;
      const x = d.position.x + Math.sin(time * 0.2 + d.offset) * 1;

      dummy.position.set(x, y, d.position.z);

      // Bell pulsation (contraction/expansion)
      const pulse = Math.sin(time * 3 + d.offset);
      // Scale changes based on pulse - stretch when moving up (contracting), flatten when drifting down
      const scaleY = d.scale * (1 - pulse * 0.1);
      const scaleXZ = d.scale * (1 + pulse * 0.05);

      dummy.scale.set(scaleXZ, scaleY, scaleXZ);
      dummy.rotation.x = pulse * 0.1; // Slight tilt

      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
        <instancedMesh ref={mesh} args={[null, null, count]}>
        {/* Semi-sphere for the bell */}
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.2}
            transmission={0.6} // Glass-like
            thickness={1}
            roughness={0.2}
            clearcoat={1}
            side={THREE.DoubleSide}
        />
        </instancedMesh>
    </group>
  );
};

// Improved School of Fish with cohesive movement
const SchoolOfFish = ({ count = 100, color }) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const center = useRef(new THREE.Vector3(0, 0, -10));

    const data = useMemo(() => {
        return new Array(count).fill().map(() => ({
            offset: new THREE.Vector3(Math.random() * 10 - 5, Math.random() * 4 - 2, Math.random() * 10 - 5),
            speed: Math.random() * 0.2 + 0.5,
            phase: Math.random() * Math.PI * 2
        }));
    }, [count]);

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();

        // Move the center of the school
        center.current.x = Math.sin(time * 0.1) * 15;
        center.current.z = Math.cos(time * 0.1) * 10 - 15;
        center.current.y = Math.sin(time * 0.2) * 2;

        const rotY = Math.cos(time * 0.1) + Math.PI / 2; // Approximate direction derivative

        data.forEach((d, i) => {
            // Fish position relative to center
            const x = center.current.x + d.offset.x + Math.sin(time * 2 + d.phase) * 0.5;
            const y = center.current.y + d.offset.y + Math.cos(time * 1.5 + d.phase) * 0.5;
            const z = center.current.z + d.offset.z;

            dummy.position.set(x, y, z);

            // Orient towards general movement direction + local noise
            dummy.rotation.y = rotY + Math.sin(time + d.phase) * 0.2;
            dummy.rotation.z = Math.sin(time * 3 + d.phase) * 0.1; // Banking

            dummy.scale.set(0.3, 0.1, 0.1);

            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <coneGeometry args={[1, 4, 4]} rotation={[0, 0, -Math.PI / 2]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} />
        </instancedMesh>
    );
};


// Majestic Whale with tail movement (simulated by parenting or vertex shader?)
// For simplicity and "restraint", we'll use a segmented approach or a single mesh with slow rotation.
// Let's stick to a sleek, abstract shape.
const Whale = ({ color }) => {
    const group = useRef();
    const body = useRef();
    const tail = useRef();

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        // Large, slow swimming path
        group.current.position.z = Math.sin(t * 0.05) * 30 - 20;
        group.current.position.x = Math.cos(t * 0.05) * 20;
        group.current.position.y = Math.sin(t * 0.08) * 5 - 5;

        // Banking
        group.current.rotation.y = -t * 0.05 + Math.PI; // Face direction of travel
        group.current.rotation.z = Math.sin(t * 0.5) * 0.1;

        // Tail stroke
        if (tail.current) {
            tail.current.rotation.y = Math.sin(t * 1) * 0.2;
            tail.current.position.x = Math.sin(t * 1) * 0.5; // Slight lateral shift for visual weight
        }
    });

    return (
        <group ref={group}>
            {/* Body */}
            <mesh ref={body} position={[0, 0, 0]}>
                <capsuleGeometry args={[1.5, 8, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
            </mesh>

            {/* Tail */}
            <group ref={tail} position={[-4, 0, 0]}>
                 <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <coneGeometry args={[1, 4, 4]} />
                    <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
                 </mesh>
                 <mesh position={[-3, 0, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[1, 3, 0.2]} />
                    <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
                 </mesh>
            </group>

            {/* Fins */}
             <mesh position={[2, -1, 0]} rotation={[0.5, 0, -0.5]}>
                <boxGeometry args={[2, 0.2, 1]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
             </mesh>
             <mesh position={[2, -1, 0]} rotation={[-0.5, 0, -0.5]}>
                <boxGeometry args={[2, 0.2, 1]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
             </mesh>
        </group>
    );
}

// Ray: Flat, wide creature
const Ray = ({ count = 3, color }) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const data = useMemo(() => {
        return new Array(count).fill().map(() => ({
            position: [Math.random() * 40 - 20, Math.random() * 10 - 10, Math.random() * 40 - 20],
            speed: Math.random() * 0.05 + 0.02,
            phase: Math.random() * Math.PI * 2
        }));
    }, [count]);

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();
        data.forEach((d, i) => {
             // Glide
             const z = d.position[2] + Math.cos(time * d.speed + d.phase) * 10;
             const x = d.position[0] + Math.sin(time * d.speed * 0.5 + d.phase) * 10;
             const y = d.position[1];

             dummy.position.set(x, y, z);
             dummy.lookAt(x + Math.cos(time * d.speed * 0.5), y, z - Math.sin(time * d.speed)); // Approx direction

             // Wing flap (scale width)
             const flap = Math.sin(time * 2 + d.phase) * 0.2 + 1;
             dummy.scale.set(flap * 2, 0.2, 1);

             dummy.updateMatrix();
             mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
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
      {types.includes('jellyfish') && <Jellyfish count={20} color={color} />}
      {types.includes('school') && <SchoolOfFish count={150} color={color} />}
      {types.includes('whale') && <Whale color={color} />}
      {types.includes('ray') && <Ray count={5} color={color} />}
    </group>
  );
};

export default Creatures;
