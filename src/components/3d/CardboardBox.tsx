import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface BoxFlapsProps {
  scrollProgress: number;
}

const BoxFlaps = ({ scrollProgress }: BoxFlapsProps) => {
  const frontFlapRef = useRef<THREE.Mesh>(null);
  const backFlapRef = useRef<THREE.Mesh>(null);
  const leftFlapRef = useRef<THREE.Mesh>(null);
  const rightFlapRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Box dimensions
  const boxWidth = 2;
  const boxHeight = 1.5;
  const boxDepth = 1.5;
  const flapHeight = 0.75;
  const cardboardThickness = 0.05;

  // Cardboard material
  const cardboardColor = new THREE.Color('#8B6914');
  const cardboardDarkColor = new THREE.Color('#6B5210');

  useFrame(() => {
    // Animate flaps based on scroll progress (0 = closed, 1 = fully open)
    const openAngle = scrollProgress * Math.PI * 0.5; // 90 degrees when fully open

    if (frontFlapRef.current) {
      frontFlapRef.current.rotation.x = openAngle;
    }
    if (backFlapRef.current) {
      backFlapRef.current.rotation.x = -openAngle;
    }
    if (leftFlapRef.current) {
      leftFlapRef.current.rotation.z = -openAngle;
    }
    if (rightFlapRef.current) {
      rightFlapRef.current.rotation.z = openAngle;
    }

    // Gentle rotation based on scroll
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(scrollProgress * Math.PI) * 0.3 + 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} position={[0, 0, 0]}>
        {/* Main box body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
          <meshStandardMaterial 
            color={cardboardColor} 
            roughness={0.9} 
            metalness={0}
          />
        </mesh>

        {/* Inner box (slightly darker) */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[boxWidth - 0.1, boxHeight - 0.1, boxDepth - 0.1]} />
          <meshStandardMaterial 
            color={cardboardDarkColor} 
            roughness={0.95} 
            metalness={0}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Front flap */}
        <group position={[0, boxHeight / 2, boxDepth / 2]}>
          <mesh ref={frontFlapRef} position={[0, flapHeight / 2, 0]}>
            <boxGeometry args={[boxWidth, flapHeight, cardboardThickness]} />
            <meshStandardMaterial 
              color={cardboardColor} 
              roughness={0.9} 
              metalness={0}
            />
          </mesh>
        </group>

        {/* Back flap */}
        <group position={[0, boxHeight / 2, -boxDepth / 2]}>
          <mesh ref={backFlapRef} position={[0, flapHeight / 2, 0]}>
            <boxGeometry args={[boxWidth, flapHeight, cardboardThickness]} />
            <meshStandardMaterial 
              color={cardboardColor} 
              roughness={0.9} 
              metalness={0}
            />
          </mesh>
        </group>

        {/* Left flap */}
        <group position={[-boxWidth / 2, boxHeight / 2, 0]}>
          <mesh ref={leftFlapRef} position={[-flapHeight / 2, 0, 0]}>
            <boxGeometry args={[flapHeight, cardboardThickness, boxDepth]} />
            <meshStandardMaterial 
              color={cardboardColor} 
              roughness={0.9} 
              metalness={0}
            />
          </mesh>
        </group>

        {/* Right flap */}
        <group position={[boxWidth / 2, boxHeight / 2, 0]}>
          <mesh ref={rightFlapRef} position={[flapHeight / 2, 0, 0]}>
            <boxGeometry args={[flapHeight, cardboardThickness, boxDepth]} />
            <meshStandardMaterial 
              color={cardboardColor} 
              roughness={0.9} 
              metalness={0}
            />
          </mesh>
        </group>

        {/* Tape strips on sides */}
        <mesh position={[0, boxHeight / 2 + 0.01, boxDepth / 2 + cardboardThickness / 2 + 0.01]}>
          <boxGeometry args={[0.3, 0.05, 0.02]} />
          <meshStandardMaterial color="#D4A574" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, boxHeight / 2 + 0.01, -boxDepth / 2 - cardboardThickness / 2 - 0.01]}>
          <boxGeometry args={[0.3, 0.05, 0.02]} />
          <meshStandardMaterial color="#D4A574" roughness={0.5} metalness={0.1} />
        </mesh>

        {/* Logo/branding on box front */}
        <mesh position={[0, 0, boxDepth / 2 + 0.01]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshStandardMaterial color="#1B2845" roughness={0.8} metalness={0} />
        </mesh>
      </group>
    </Float>
  );
};

interface CardboardBoxSceneProps {
  scrollProgress: number;
}

const CardboardBoxScene = ({ scrollProgress }: CardboardBoxSceneProps) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={45} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#F5E6D3" />
      
      <BoxFlaps scrollProgress={scrollProgress} />
      
      <Environment preset="warehouse" />
    </>
  );
};

export const CardboardBox3D = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the section is visible
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      
      // Start animation when section enters viewport
      // Complete when section center reaches viewport center
      const progress = Math.max(0, Math.min(1, 
        (windowHeight - sectionTop) / (windowHeight + sectionHeight * 0.5)
      ));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-[80vh] bg-gradient-to-b from-background via-secondary/30 to-background overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[60vh]">
          {/* Text content */}
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary leading-tight">
              Embalagens que
              <span className="block text-accent">protegem seu negócio</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
              Da caixa de papelão ao stretch film, oferecemos soluções completas 
              para embalar, proteger e transportar seus produtos com segurança.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-primary/80">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Papelão ondulado</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary/80">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Plástico bolha</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary/80">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Stretch film</span>
              </div>
            </div>
          </div>

          {/* 3D Canvas */}
          <div className="h-[400px] md:h-[500px] lg:h-[600px] relative">
            <Canvas
              shadows
              dpr={[1, 2]}
              gl={{ 
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
              }}
              style={{ background: 'transparent' }}
            >
              <CardboardBoxScene scrollProgress={scrollProgress} />
            </Canvas>

            {/* Scroll indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary/60">
              <span className="text-xs uppercase tracking-wider">Role para abrir</span>
              <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2">
                <div 
                  className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
                  style={{ animationDuration: '1.5s' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </section>
  );
};

export default CardboardBox3D;
