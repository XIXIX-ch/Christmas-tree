import { Vector3, MathUtils } from 'three';
import { ParticleData } from '../types';

export const generateTreeData = (count: number, type: 'needle' | 'ornament' | 'gift' | 'bauble' | 'sparkle'): ParticleData[] => {
  const particles: ParticleData[] = [];
  const treeHeight = 14; 
  const maxRadius = 6;
  const scatterRadius = 30;

  for (let i = 0; i < count; i++) {
    // 1. Calculate Tree Position (Cone)
    let treePos = new Vector3();
    
    if (type === 'sparkle') {
        // Sparkles surround the tree in a loose cylinder/cloud
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * (maxRadius + 2); // Slightly wider than tree
        const y = (Math.random() * (treeHeight + 4)) - (treeHeight / 2) - 1;
        treePos.set(r * Math.cos(theta), y, r * Math.sin(theta));
    } else {
        // Standard Tree Cone Logic
        const yNorm = Math.pow(Math.random(), type === 'needle' ? 0.8 : 1.0);
        const y = yNorm * treeHeight - (treeHeight / 2); 
        
        const currentRadiusMax = (1 - yNorm) * maxRadius;
        const r = Math.sqrt(Math.random()) * currentRadiusMax; 
        
        const theta = Math.random() * Math.PI * 2;
        
        const treeX = r * Math.cos(theta);
        const treeZ = r * Math.sin(theta);
        treePos.set(treeX, y, treeZ);
    }

    // 2. Scatter Position
    const u = Math.random();
    const v = Math.random();
    const phi = Math.acos(2 * v - 1);
    const lambda = 2 * Math.PI * u;
    const scatterR = Math.cbrt(Math.random()) * scatterRadius; 

    const scatterX = scatterR * Math.sin(phi) * Math.cos(lambda);
    const scatterY = scatterR * Math.sin(phi) * Math.sin(lambda) + 5; 
    const scatterZ = scatterR * Math.cos(phi);
    const scatterPos = new Vector3(scatterX, scatterY, scatterZ);

    // 3. Rotation & Scale
    const rotation: [number, number, number] = [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    ];

    let scale = 1;
    let color: string | undefined = undefined;

    if (type === 'needle') {
        scale = MathUtils.randFloat(1.0, 1.8);
    } else if (type === 'ornament') {
        scale = MathUtils.randFloat(1.5, 3.0);
    } else if (type === 'gift') {
        // Much Larger Gifts
        scale = MathUtils.randFloat(4.5, 7.0);
        const giftColors = ['#E63946', '#2A9D8F', '#F4A261', '#457B9D', '#D62828', '#8338EC'];
        color = giftColors[Math.floor(Math.random() * giftColors.length)];
    } else if (type === 'bauble') {
        scale = MathUtils.randFloat(1.5, 2.5);
        const baubleColors = ['#F1FAEE', '#A8DADC', '#FFD700', '#FF69B4'];
        color = baubleColors[Math.floor(Math.random() * baubleColors.length)];
    } else if (type === 'sparkle') {
        scale = MathUtils.randFloat(0.5, 1.2);
    }

    particles.push({
      id: i,
      treePosition: treePos,
      scatterPosition: scatterPos,
      rotation,
      scale,
      color,
      speed: MathUtils.randFloat(0.02, 0.05),
    });
  }

  return particles;
};