import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeState } from '../types';
import ChristmasTree from './ChristmasTree';

interface SceneProps {
  treeState: TreeState;
  mouseInteraction: React.MutableRefObject<{ x: number; y: number }>;
  onTreeClick: () => void;
}

const Scene: React.FC<SceneProps> = ({ treeState, mouseInteraction, onTreeClick }) => {
  return (
    <Canvas
      dpr={[1, 2]} // Optimize for pixel density
      gl={{ antialias: false, toneMappingExposure: 1.5 }}
      shadows
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={45} />
        
        {/* Environment - The "Lobby" HDRI gives that warm interior luxury feel */}
        <Environment preset="lobby" background={false} blur={0.6} />

        {/* Dynamic Lighting */}
        {/* @ts-ignore */}
        <ambientLight intensity={0.2} color="#001a10" />
        {/* @ts-ignore */}
        <spotLight
          position={[10, 20, 10]}
          angle={0.25}
          penumbra={1}
          intensity={100}
          color="#ffd700"
          castShadow
        />
        {/* @ts-ignore */}
        <pointLight position={[-10, 5, -10]} intensity={20} color="#022D1A" />

        {/* The Star of the Show */}
        <ChristmasTree 
            currentState={treeState} 
            mouseInteraction={mouseInteraction} 
            onTreeClick={onTreeClick}
        />

        {/* Post Processing for the "Cinematic Glow" */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6}
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        {/* OrbitControls mainly for debugging, but limited for user experience */}
        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.5} 
            minPolarAngle={Math.PI / 3}
            maxDistance={30}
            minDistance={10}
        />
      </Suspense>
    </Canvas>
  );
};

export default Scene;