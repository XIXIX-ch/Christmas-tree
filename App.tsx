import React, { useState, useRef, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import Gallery from './components/Gallery';
import { TreeState } from './types';
import { Camera, Loader2 } from 'lucide-react';
// @ts-ignore
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

const PHOTO_URLS = [
    "https://via.placeholder.com/600x400/000000/FFFFFF?text=Christmas+Memory+1",
    "https://via.placeholder.com/600x400/101010/FFFFFF?text=Christmas+Memory+2",
    "https://via.placeholder.com/600x400/202020/FFFFFF?text=Christmas+Memory+3",
    "https://via.placeholder.com/600x400/303030/FFFFFF?text=Christmas+Memory+4",
    "https://via.placeholder.com/600x400/404040/FFFFFF?text=Christmas+Memory+5",
];

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const mouseInteraction = useRef({ x: 0, y: 0 });
  const [useCamera, setUseCamera] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const gestureRecognizerRef = useRef<any>(null);
  const requestRef = useRef<number>(0);

  // Initialize MediaPipe Gesture Recognizer
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        setModelLoaded(true);
      } catch (error) {
        console.error("Failed to load MediaPipe model:", error);
      }
    };
    loadModel();
  }, []);

  // Prediction Loop
  const predictWebcam = useCallback(() => {
    if (gestureRecognizerRef.current && videoRef.current && videoRef.current.readyState === 4) {
      try {
        const results = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, Date.now());

        // 1. Hand Tracking for Parallax (adjusts view)
        if (results.landmarks && results.landmarks.length > 0) {
            const hand = results.landmarks[0]; 
            const point = hand[9]; 
            const x = (point.x - 0.5) * 2;
            const y = -(point.y - 0.5) * 2; 
            mouseInteraction.current = { x: -x, y }; 
        }

        // 2. Gesture Recognition for State
        if (results.gestures.length > 0) {
          const category = results.gestures[0][0].categoryName;
          const score = results.gestures[0][0].score;
          
          if (score > 0.5) {
              if (category === 'Open_Palm') {
                // If Gallery is open, Open_Palm could signify interaction, 
                // but we primarily use it for SCATTERED state in Scene mode.
                if (!isGalleryOpen) setTreeState(TreeState.SCATTERED);
              } else if (category === 'Closed_Fist') {
                // Fist always resets: closes gallery, resets tree
                if (isGalleryOpen) setIsGalleryOpen(false);
                setTreeState(TreeState.TREE_SHAPE);
              }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [isGalleryOpen]); // Dependency on isGalleryOpen to ensure we use latest state in closure

  // Camera Management
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (useCamera) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
            stream = s;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                videoRef.current.addEventListener('loadeddata', () => {
                    predictWebcam();
                });
            }
            })
            .catch(err => {
            console.error("Camera access denied or failed", err);
            setUseCamera(false);
            });
      }
    } else {
        cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(requestRef.current);
    };
  }, [useCamera, predictWebcam]);


  // Mouse Fallback Handlers
  const handlePointerDown = () => {
    if (!useCamera && !isGalleryOpen) {
        setTreeState(TreeState.TREE_SHAPE);
    }
  };

  const handlePointerUp = () => {
    if (!useCamera && !isGalleryOpen) {
        setTreeState(TreeState.SCATTERED);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!useCamera) {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseInteraction.current = { x, y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!useCamera) {
        const x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        const y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        mouseInteraction.current = { x, y };
    }
  };

  // Triggered by clicking the 3D tree
  const handleTreeClick = () => {
      if (!isGalleryOpen) {
          setIsGalleryOpen(true);
          // Ensure tree is formed when entering gallery for better background visual
          setTreeState(TreeState.TREE_SHAPE);
      }
  };

  return (
    <div 
        className="w-full h-screen bg-black text-white overflow-hidden relative select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onTouchMove={handleTouchMove}
    >
      {/* 3D Scene Layer */}
      <div className={`absolute inset-0 z-0 transition-all duration-1000 ${isGalleryOpen ? 'blur-md scale-105 opacity-50' : ''}`}>
        <Scene 
            treeState={treeState} 
            mouseInteraction={mouseInteraction} 
            onTreeClick={handleTreeClick}
        />
      </div>

      {/* Gallery Overlay */}
      <Gallery 
        isOpen={isGalleryOpen} 
        images={PHOTO_URLS} 
        onClose={() => setIsGalleryOpen(false)} 
      />

      {/* Minimal UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        
        {/* Header - Only Camera Toggle Icon */}
        <header className="flex justify-end items-start w-full">
            <div className="pointer-events-auto">
                <button 
                    onClick={() => setUseCamera(!useCamera)}
                    disabled={!modelLoaded}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 ${
                        !modelLoaded ? 'opacity-50 cursor-wait bg-gray-800 border-gray-600' :
                        useCamera ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                >
                    {!modelLoaded ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                </button>
            </div>
        </header>
      </div>

      {/* Camera Feed - Bottom Right Fixed, Minimal */}
      {useCamera && (
        <div className="fixed bottom-6 right-6 z-50 w-32 h-24 md:w-48 md:h-36 rounded-xl overflow-hidden border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(255,215,0,0.3)] bg-black/80 transition-all duration-500 animate-in slide-in-from-right">
            <video 
                ref={videoRef} 
                className="w-full h-full object-cover transform -scale-x-100" 
                muted 
                playsInline 
            />
            {/* Minimal Focus Corners */}
            <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-xl">
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-yellow-400"></div>
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-yellow-400"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-yellow-400"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-yellow-400"></div>
            </div>
        </div>
      )}

        {/* Cinematic Vignette Overlay */}
        <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] ${isGalleryOpen ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
};

export default App;