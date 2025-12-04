import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { generateTreeData } from '../utils/math';

// Wrappers to bypass TypeScript errors with missing JSX.IntrinsicElements
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const InstancedMesh = 'instancedMesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const BoxGeometry = 'boxGeometry' as any;
const ConeGeometry = 'coneGeometry' as any;
const MeshBasicMaterial = 'meshBasicMaterial' as any;

interface ChristmasTreeProps {
  currentState: TreeState;
  mouseInteraction: React.MutableRefObject<{ x: number; y: number }>;
  onTreeClick?: () => void;
}

const NEEDLE_COUNT = 2500;
const ORNAMENT_COUNT = 150;
const GIFT_COUNT = 60;
const BAUBLE_COUNT = 80;
const SPARKLE_COUNT = 3000;

// Helper to create a striped texture for gift boxes
const createStripedTexture = () => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, 128, 128);
    
    ctx.fillStyle = '#e0e0e0'; 
    ctx.lineWidth = 10;
    for (let i = -128; i < 256; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for(let i=0; i<128; i+=16) {
        ctx.fillRect(i, 0, 8, 128);
        ctx.fillRect(0, i, 128, 8);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

const TopBow: React.FC<{ currentState: TreeState }> = ({ currentState }) => {
    const groupRef = useRef<THREE.Group>(null);
    const targetScale = currentState === TreeState.TREE_SHAPE ? 1.5 : 0; 
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 3);
            groupRef.current.scale.setScalar(s);
            
            const targetY = currentState === TreeState.TREE_SHAPE ? 7.2 : 15;
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 2);
            
            if (currentState === TreeState.TREE_SHAPE) {
                groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
            }
        }
    });

    const redMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: '#D6001C', 
        roughness: 0.3,
        metalness: 0.2,
        emissive: '#550000',
        emissiveIntensity: 0.3
    }), []);

    return (
        <Group ref={groupRef} position={[0, 7.5, 0]}>
             <Mesh material={redMaterial}>
                <SphereGeometry args={[0.3, 32, 32]} />
             </Mesh>
             <Mesh position={[-0.4, 0.1, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1.0, 1.5, 0.5]} material={redMaterial}>
                <SphereGeometry args={[0.4, 32, 32]} />
             </Mesh>
             <Mesh position={[0.4, 0.1, 0]} rotation={[0, 0, -Math.PI / 4]} scale={[1.0, 1.5, 0.5]} material={redMaterial}>
                <SphereGeometry args={[0.4, 32, 32]} />
             </Mesh>
             <Mesh position={[-0.3, -0.8, 0.1]} rotation={[0, 0, 0.3]} material={redMaterial}>
                <BoxGeometry args={[0.2, 1.5, 0.05]} />
             </Mesh>
             <Mesh position={[0.3, -0.8, 0.1]} rotation={[0, 0, -0.3]} material={redMaterial}>
                <BoxGeometry args={[0.2, 1.5, 0.05]} />
             </Mesh>
        </Group>
    )
}

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ currentState, mouseInteraction, onTreeClick }) => {
  const needlesRef = useRef<THREE.InstancedMesh>(null);
  const ornamentsRef = useRef<THREE.InstancedMesh>(null);
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  const ribbon1Ref = useRef<THREE.InstancedMesh>(null); 
  const ribbon2Ref = useRef<THREE.InstancedMesh>(null); 
  const baublesRef = useRef<THREE.InstancedMesh>(null);
  const sparklesRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const needlesData = useMemo(() => generateTreeData(NEEDLE_COUNT, 'needle'), []);
  const ornamentsData = useMemo(() => generateTreeData(ORNAMENT_COUNT, 'ornament'), []);
  const giftsData = useMemo(() => generateTreeData(GIFT_COUNT, 'gift'), []);
  const baublesData = useMemo(() => generateTreeData(BAUBLE_COUNT, 'bauble'), []);
  const sparklesData = useMemo(() => generateTreeData(SPARKLE_COUNT, 'sparkle'), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPos = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const giftTexture = useMemo(() => createStripedTexture(), []);
  
  const needleGeometry = useMemo(() => new THREE.ConeGeometry(0.18, 1.0, 5), []);
  const needleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#2E8B57", 
    roughness: 0.6,   
    metalness: 0.0,
  }), []);

  const ornamentGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.15, 0), []);
  const ornamentMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#FFD700",
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1,
    emissive: "#F4C430",
    emissiveIntensity: 0.5
  }), []);

  const giftGeometry = useMemo(() => new THREE.BoxGeometry(0.15, 0.15, 0.15), []);
  const giftMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: giftTexture || undefined,
    color: "#ffffff",
    roughness: 0.3,
    metalness: 0.1,
  }), []);

  const ribbonGeometry = useMemo(() => new THREE.BoxGeometry(0.152, 0.152, 0.152), []); 
  const ribbonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#FFD700", 
    roughness: 0.2,
    metalness: 0.8,
  }), []);

  const baubleGeometry = useMemo(() => new THREE.OctahedronGeometry(0.12, 0), []);
  const baubleMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.0,
    metalness: 0.9,
    emissiveIntensity: 0.2
  }), []);

  const sparkleGeometry = useMemo(() => new THREE.OctahedronGeometry(0.04, 0), []);
  const sparkleMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#FFD700",
    transparent: true,
    opacity: 0.8,
  }), []);

  const currentPositionsNeedles = useRef(new Float32Array(NEEDLE_COUNT * 3));
  const currentPositionsOrnaments = useRef(new Float32Array(ORNAMENT_COUNT * 3));
  const currentPositionsGifts = useRef(new Float32Array(GIFT_COUNT * 3));
  const currentPositionsBaubles = useRef(new Float32Array(BAUBLE_COUNT * 3));
  const currentPositionsSparkles = useRef(new Float32Array(SPARKLE_COUNT * 3));

  const initPositions = (data: any[], ref: React.MutableRefObject<Float32Array>) => {
      data.forEach((d, i) => {
          const start = currentState === TreeState.TREE_SHAPE ? d.treePosition : d.scatterPosition;
          ref.current[i * 3] = start.x;
          ref.current[i * 3 + 1] = start.y;
          ref.current[i * 3 + 2] = start.z;
      });
  };

  useLayoutEffect(() => {
    initPositions(needlesData, currentPositionsNeedles);
    initPositions(ornamentsData, currentPositionsOrnaments);
    initPositions(giftsData, currentPositionsGifts);
    initPositions(baublesData, currentPositionsBaubles);
    initPositions(sparklesData, currentPositionsSparkles);

    if (giftsRef.current) {
        giftsData.forEach((d, i) => {
            tempColor.set(d.color || '#ffffff');
            giftsRef.current!.setColorAt(i, tempColor);
        });
        if (giftsRef.current.instanceColor) giftsRef.current.instanceColor.needsUpdate = true;
    }
    if (baublesRef.current) {
        baublesData.forEach((d, i) => {
            tempColor.set(d.color || '#ffffff');
            baublesRef.current!.setColorAt(i, tempColor);
        });
        if (baublesRef.current.instanceColor) baublesRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  const animateLayer = (
      ref: React.RefObject<THREE.InstancedMesh>, 
      data: any[], 
      posBuffer: React.MutableRefObject<Float32Array>, 
      delta: number, 
      speedMult: number, 
      clock: number,
      extraTransform: ((d: any, dummy: THREE.Object3D) => void) | null = null,
      isSparkle: boolean = false
  ) => {
    if (!ref.current) return;

    data.forEach((d, i) => {
        const target = currentState === TreeState.TREE_SHAPE ? d.treePosition : d.scatterPosition;
        
        currentPos.set(
            posBuffer.current[i * 3],
            posBuffer.current[i * 3 + 1],
            posBuffer.current[i * 3 + 2]
        );

        const lerpSpeed = isSparkle 
            ? speedMult * delta 
            : (currentState === TreeState.TREE_SHAPE ? speedMult * 2 * delta : speedMult * delta);
        
        currentPos.lerp(target, lerpSpeed);

        if (currentState === TreeState.SCATTERED || isSparkle) {
             const floatSpeed = isSparkle ? 0.2 : 0.01;
             currentPos.y += Math.sin(clock * (isSparkle ? 0.5 : 1) + d.id) * floatSpeed * 0.1;
        }

        posBuffer.current[i * 3] = currentPos.x;
        posBuffer.current[i * 3 + 1] = currentPos.y;
        posBuffer.current[i * 3 + 2] = currentPos.z;

        dummy.position.copy(currentPos);
        
        if (isSparkle) {
            const scalePulse = Math.sin(clock * 2 + d.id) * 0.3 + 0.7;
            dummy.scale.setScalar(d.scale * scalePulse);
        } else {
            dummy.scale.setScalar(d.scale);
        }
        
        if (currentState === TreeState.SCATTERED || isSparkle) {
            dummy.rotation.set(
                d.rotation[0] + clock * 0.2,
                d.rotation[1] + clock * 0.1,
                d.rotation[2]
            );
        } else {
             dummy.rotation.set(d.rotation[0] * 0.1, d.rotation[1], d.rotation[2] * 0.1);
        }

        if (extraTransform) {
            extraTransform(d, dummy);
        }

        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, delta) => {
    if (groupRef.current) {
        const targetRotY = mouseInteraction.current.x * 0.5;
        const targetRotX = mouseInteraction.current.y * 0.2;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 2);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 2);
    }

    const t = state.clock.elapsedTime;
    
    animateLayer(needlesRef, needlesData, currentPositionsNeedles, delta, 1.5, t);
    animateLayer(ornamentsRef, ornamentsData, currentPositionsOrnaments, delta, 2.0, t);
    animateLayer(baublesRef, baublesData, currentPositionsBaubles, delta, 2.2, t);
    animateLayer(giftsRef, giftsData, currentPositionsGifts, delta, 1.8, t);
    
    animateLayer(ribbon1Ref, giftsData, currentPositionsGifts, delta, 1.8, t, (d, dummy) => {
        dummy.scale.set(d.scale * 0.2, d.scale * 1.01, d.scale * 1.01);
    });
    animateLayer(ribbon2Ref, giftsData, currentPositionsGifts, delta, 1.8, t, (d, dummy) => {
         dummy.scale.set(d.scale * 1.01, d.scale * 1.01, d.scale * 0.2);
    });

    animateLayer(sparklesRef, sparklesData, currentPositionsSparkles, delta, 0.5, t, null, true);

  });

  return (
    <Group ref={groupRef}>
        {/* Invisible Interaction Mesh - Acts as a hit box for the tree */}
        <Mesh visible={false} onClick={(e: any) => {
            e.stopPropagation();
            onTreeClick && onTreeClick();
        }}>
            <ConeGeometry args={[6, 14, 16]} />
            <MeshBasicMaterial transparent opacity={0} />
        </Mesh>

      <TopBow currentState={currentState} />
      
      <InstancedMesh ref={needlesRef} args={[needleGeometry, needleMaterial, NEEDLE_COUNT]} castShadow receiveShadow />
      <InstancedMesh ref={ornamentsRef} args={[ornamentGeometry, ornamentMaterial, ORNAMENT_COUNT]} castShadow receiveShadow />
      
      {/* Gifts & Ribbons */}
      <InstancedMesh ref={giftsRef} args={[giftGeometry, giftMaterial, GIFT_COUNT]} castShadow receiveShadow />
      <InstancedMesh ref={ribbon1Ref} args={[ribbonGeometry, ribbonMaterial, GIFT_COUNT]} castShadow receiveShadow />
      <InstancedMesh ref={ribbon2Ref} args={[ribbonGeometry, ribbonMaterial, GIFT_COUNT]} castShadow receiveShadow />

      <InstancedMesh ref={baublesRef} args={[baubleGeometry, baubleMaterial, BAUBLE_COUNT]} castShadow receiveShadow />
      
      {/* Golden Sparkles */}
      <InstancedMesh ref={sparklesRef} args={[sparkleGeometry, sparkleMaterial, SPARKLE_COUNT]} />
    </Group>
  );
};

export default ChristmasTree;