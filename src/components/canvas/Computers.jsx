import { Suspense, useEffect, useState, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader";
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
      return (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#915EFF',
          padding: '20px'
        }}>
          <p>Unable to load 3D model</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Your device may not support this feature
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component when 3D model fails to load
const ModelErrorFallback = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      color: '#915EFF',
      padding: '20px'
    }}>
      <p>Unable to load 3D model</p>
      <p style={{ fontSize: '12px', marginTop: '10px' }}>
        Your device may not support this feature
      </p>
    </div>
  );
};

const ComputerModel = ({ isMobile }) => {
  const base = import.meta.env.BASE_URL || '/';
  const modelPath = base.endsWith('/') ? `${base}desktop_pc/scene.gltf` : `${base}/desktop_pc/scene.gltf`;
  
  console.log('Attempting to load model from:', modelPath);
  
  // Fix: Correct useGLTF API usage with proper DRACO loader setup
  const gltf = useGLTF(
    modelPath,
    undefined,
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
    }
  );

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
  const [isAndroid, setIsAndroid] = useState(false);
  
  console.log('ComputersCanvas rendering, base URL:', import.meta.env.BASE_URL);

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
        onCreated={({ gl }) => {
          // Additional memory optimizations for mobile
          if (isLowPowerDevice) {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1));
          }
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <hemisphereLight intensity={isLowPowerDevice ? 0.1 : 0.15} groundColor="black" skyColor="white" />
          <spotLight
            position={[-20, 50, 10]}
            angle={0.12}
            penumbra={1}
            intensity={isLowPowerDevice ? 1 : 1.5}
            castShadow={false}
          />
          <pointLight intensity={isLowPowerDevice ? 0.7 : 1} />
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
