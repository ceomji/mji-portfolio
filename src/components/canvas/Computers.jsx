import { Suspense, useEffect, useState, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import CanvasLoader from "../Loader";

// Simple Error Boundary component
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return transparent container when Canvas crashes
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          zIndex: 0
        }} />
      );
    }

    return this.props.children;
  }
}

// Transparent fallback when model fails to load or is loading
const TransparentFallback = () => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'transparent',
      zIndex: 0
    }} />
  );
};

const ComputerModel = ({ isMobile }) => {
  const base = import.meta.env.BASE_URL || '/';
  const modelPath = base.endsWith('/') ? `${base}desktop_pc/scene.gltf` : `${base}/desktop_pc/scene.gltf`;
  
  // @react-three/drei 9.122+ handles DRACO decompression automatically
  const { scene } = useGLTF(modelPath);

  if (!scene) {
    console.warn('Computer model scene is null');
    return null;
  }

  return (
    <primitive
      object={scene}
      scale={isMobile ? 0.7 : 0.75}
      position={isMobile ? [0, -3, -2.2] : [0, -3.25, -1.5]}
      rotation={[-0.01, -0.2, -0.1]}
    />
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 500px)");
    
    // Detect Android devices
    const userAgent = navigator.userAgent.toLowerCase();
    const androidDetected = /android/.test(userAgent);
    setIsAndroid(androidDetected);
    
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

  // More conservative settings for mobile, especially Android
  const isLowPowerDevice = isMobile || isAndroid;

  return (
    <CanvasErrorBoundary>
      <Canvas
        shadows={false}
        frameloop={isLowPowerDevice ? "demand" : "always"}
        dpr={[1, isLowPowerDevice ? 1 : 1.5]}
        camera={{ position: [20, 3, 5], fov: 25 }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: !isLowPowerDevice,
          alpha: true,
          premultipliedAlpha: true,
          powerPreference: isLowPowerDevice ? "low-power" : "high-performance",
          stencil: false,
          depth: true,
          failIfMajorPerformanceCaveat: false
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
        onCreated={({ gl, scene }) => {
          // Additional memory optimizations for mobile
          if (isLowPowerDevice) {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1));
          }
          // Explicitly set transparent background for Android Chrome
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <ambientLight intensity={0.5} />
          <hemisphereLight intensity={isLowPowerDevice ? 0.35 : 0.5} groundColor="black" skyColor="white" />
          <spotLight
            position={[-20, 50, 10]}
            angle={0.12}
            penumbra={1}
            intensity={isLowPowerDevice ? 1.5 : 2}
            castShadow={false}
          />
          <pointLight intensity={isLowPowerDevice ? 1 : 1.5} position={[10, 10, 10]} />
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
            enableDamping={!isLowPowerDevice}
            dampingFactor={0.05}
          />
          <ComputerModel isMobile={isMobile} />
        </Suspense>
        <Preload all />
      </Canvas>
    </CanvasErrorBoundary>
  );
};

export default ComputersCanvas;
