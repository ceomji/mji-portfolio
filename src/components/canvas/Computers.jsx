import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import CanvasLoader from "../Loader";

const ComputerModel = ({ isMobile }) => {
  const base = import.meta.env.BASE_URL || '/';
  const modelPath = base.endsWith('/') ? `${base}desktop_pc/scene.gltf` : `${base}/desktop_pc/scene.gltf`;
  
  console.log('Attempting to load model from:', modelPath);
  
  const gltf = useGLTF(modelPath);

  if (!gltf || !gltf.scene) {
    console.warn('Model scene is null or undefined');
    return null;
  }
  
  console.log('Computer model loaded successfully', gltf.scene);

  return (
    <primitive
      object={gltf.scene}
      scale={isMobile ? 0.7 : 0.75}
      position={isMobile ? [0, -3, -2.2] : [0, -3.25, -1.5]}
      rotation={[-0.01, -0.2, -0.1]}
    />
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  console.log('ComputersCanvas rendering, base URL:', import.meta.env.BASE_URL);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 500px)");
    
    // Set initial value immediately
    setIsMobile(mediaQuery.matches);

    const handleMediaQueryChange = (event) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return (
    <Canvas
      shadows={false}
      dpr={[1, 1]}
      camera={{ position: [20, 3, 5], fov: 25 }}
      gl={{ 
        preserveDrawingBuffer: false,
        antialias: false,
        alpha: true,
        powerPreference: "default",
        stencil: false,
        depth: true
      }}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
        background: 'transparent'
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <hemisphereLight intensity={0.15} groundColor="black" skyColor="white" />
        <spotLight
          position={[-20, 50, 10]}
          angle={0.12}
          penumbra={1}
          intensity={1.5}
          castShadow={false}
        />
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <ComputerModel isMobile={isMobile} />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

export default ComputersCanvas;
