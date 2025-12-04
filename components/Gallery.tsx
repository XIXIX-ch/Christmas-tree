import React, { useState, useRef, useEffect } from 'react';

interface GalleryProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ images, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Physics & Animation State
  const progress = useRef(0); // Continuous scroll value (0, 1, 2...)
  const velocity = useRef(0);
  const startX = useRef(0);
  const lastX = useRef(0);
  const animationFrame = useRef(0);
  const isInteracting = useRef(false);

  // Constants
  const FRICTION = 0.92;
  const SPRING = 0.05;
  const MAX_VELOCITY = 0.5;

  // Animation Loop
  const animate = () => {
    if (!isOpen) return;

    if (!isInteracting.current) {
      // Apply Momentum / Snap logic when not dragging
      velocity.current *= FRICTION;

      // Snap to nearest index
      const targetIndex = Math.round(progress.current);
      const diff = targetIndex - progress.current;
      velocity.current += diff * SPRING;

      // Update progress
      progress.current += velocity.current;

      // Stop if close enough
      if (Math.abs(velocity.current) < 0.001 && Math.abs(diff) < 0.001) {
        progress.current = targetIndex;
        velocity.current = 0;
      }
    }

    // Boundaries
    if (progress.current < -0.5) {
        velocity.current += 0.05; // Bounce back start
    } else if (progress.current > images.length - 0.5) {
        velocity.current -= 0.05; // Bounce back end
    }

    // Render update
    if (trackRef.current) {
        // We update the state less frequently for React, but DOM styles every frame
        // Actually, let's update DOM styles directly for performance
        const items = trackRef.current.children;
        for (let i = 0; i < items.length; i++) {
            const item = items[i] as HTMLElement;
            const offset = i - progress.current;
            
            // 3D Film Strip Logic
            const absOffset = Math.abs(offset);
            const z = -absOffset * 150; // Push back side items
            const x = offset * 260; // Spread horizontally
            const rotateY = offset * -25; // Rotate to face center
            const scale = Math.max(0.6, 1 - absOffset * 0.2);
            const opacity = Math.max(0.3, 1 - absOffset * 0.4);
            const zIndex = 100 - Math.round(absOffset);

            item.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
            item.style.opacity = `${opacity}`;
            item.style.zIndex = `${zIndex}`;
        }
    }

    animationFrame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isOpen) {
      animationFrame.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame.current);
    }
    return () => cancelAnimationFrame(animationFrame.current);
  }, [isOpen, images]);

  // Handlers
  const handleStart = (clientX: number) => {
    isInteracting.current = true;
    setIsDragging(true);
    startX.current = clientX;
    lastX.current = clientX;
    velocity.current = 0;
  };

  const handleMove = (clientX: number) => {
    if (!isInteracting.current) return;
    const delta = clientX - lastX.current;
    lastX.current = clientX;
    
    // Sensitivity
    const move = -(delta / 300); // Inverse direction for "drag scene" feel
    progress.current += move;
  };

  const handleEnd = () => {
    isInteracting.current = false;
    setIsDragging(false);
    // Inertia is inherited from velocity loop implicitly via physics integration
    // We calculate final velocity based on last movement
    // But simplistic approach: just let the physics loop take over
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-700"
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
    >
      <div 
        ref={trackRef}
        className="relative w-full h-[60vh] flex items-center justify-center preserve-3d"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {images.map((src, index) => (
            <div 
                key={index}
                className="absolute w-[300px] h-[200px] md:w-[500px] md:h-[350px] bg-white p-2 shadow-2xl transition-shadow duration-300 ease-out select-none cursor-grab active:cursor-grabbing"
                style={{ 
                    // Initial positions set by JS loop
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity'
                }}
            >
                <div className="w-full h-full overflow-hidden bg-gray-900 border border-gray-200/20">
                    <img 
                        src={src} 
                        alt={`Memory ${index + 1}`} 
                        className="w-full h-full object-cover pointer-events-none" 
                        draggable={false}
                    />
                </div>
                {/* Film Strip Holes Decoration */}
                <div className="absolute top-0 left-0 w-full h-4 bg-black flex justify-between px-2 items-center space-x-2">
                    {Array.from({length: 8}).map((_, i) => <div key={i} className="w-2 h-2 bg-white/50 rounded-full" />)}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-4 bg-black flex justify-between px-2 items-center space-x-2">
                    {Array.from({length: 8}).map((_, i) => <div key={i} className="w-2 h-2 bg-white/50 rounded-full" />)}
                </div>
            </div>
        ))}
      </div>

      <div className="absolute bottom-10 text-white/50 text-sm font-light tracking-widest uppercase">
          Drag to Explore • Fist to Close
      </div>
    </div>
  );
};

export default Gallery;