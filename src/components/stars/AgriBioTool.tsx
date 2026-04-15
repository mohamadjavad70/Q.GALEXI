/**
 * Agri-Bio Planet — Agricultural Simulation Tool
 * ───────────────────────────────────────────────
 * Simulates plant growth with soil, light, and environmental factors
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Sprout, Droplets, Sun, Wind, Thermometer,
  TrendingUp, Play, Pause, RotateCcw, Leaf,
} from 'lucide-react';

interface PlantData {
  growth: number; // 0-100
  health: number; // 0-100
  stage: 'seed' | 'sprout' | 'growing' | 'mature' | 'flowering';
  needsWater: boolean;
  needsLight: boolean;
}

interface EnvironmentData {
  soilMoisture: number; // 0-100
  lightIntensity: number; // 0-100
  temperature: number; // -20 to 50
  humidity: number; // 0-100
  windSpeed: number; // 0-100
}

// 3D Plant visualization
function Plant3D({ growth, stage, health }: PlantData) {
  const stemRef = useRef<THREE.Mesh>(null);
  const leafRefs = useRef<THREE.Mesh[]>([]);
  
  const scale = Math.max(0.1, growth / 100);
  const healthColor = new THREE.Color().setHSL(health / 300, 0.8, 0.5);

  useFrame((state) => {
    // Gentle sway animation
    if (stemRef.current) {
      stemRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 * scale;
    }
    leafRefs.current.forEach((leaf, i) => {
      if (leaf) {
        leaf.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.15;
      }
    });
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Soil */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.2, 32]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </mesh>

      {stage !== 'seed' && (
        <>
          {/* Stem */}
          <mesh ref={stemRef} position={[0, scale * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.05 * scale, 0.08 * scale, scale, 8]} />
            <meshStandardMaterial color="#2d5016" />
          </mesh>

          {/* Leaves */}
          {stage !== 'sprout' && Array.from({ length: stage === 'growing' ? 4 : 6 }).map((_, i) => (
            <mesh
              key={i}
              ref={(el) => { if (el) leafRefs.current[i] = el; }}
              position={[
                Math.cos((i / (stage === 'growing' ? 4 : 6)) * Math.PI * 2) * 0.3 * scale,
                scale * (0.3 + i * 0.15),
                Math.sin((i / (stage === 'growing' ? 4 : 6)) * Math.PI * 2) * 0.3 * scale,
              ]}
              rotation={[Math.PI / 2, 0, (i / (stage === 'growing' ? 4 : 6)) * Math.PI * 2]}
              castShadow
            >
              <planeGeometry args={[0.3 * scale, 0.4 * scale]} />
              <meshStandardMaterial color={healthColor} side={THREE.DoubleSide} />
            </mesh>
          ))}

          {/* Flower (mature stage) */}
          {stage === 'flowering' && (
            <group position={[0, scale, 0]}>
              {Array.from({ length: 8 }).map((_, i) => (
                <mesh
                  key={i}
                  position={[
                    Math.cos((i / 8) * Math.PI * 2) * 0.15,
                    0,
                    Math.sin((i / 8) * Math.PI * 2) * 0.15,
                  ]}
                  rotation={[Math.PI / 2, 0, (i / 8) * Math.PI * 2]}
                >
                  <circleGeometry args={[0.1, 16]} />
                  <meshStandardMaterial color="#ff69b4" emissive="#ff1493" emissiveIntensity={0.3} />
                </mesh>
              ))}
              <mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#ffeb3b" emissive="#ffd700" emissiveIntensity={0.5} />
              </mesh>
            </group>
          )}
        </>
      )}

      {stage === 'seed' && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      )}
    </group>
  );
}

export default function AgriBioTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('simulation');

  const [plant, setPlant] = useState<PlantData>({
    growth: 0,
    health: 100,
    stage: 'seed',
    needsWater: false,
    needsLight: false,
  });

  const [environment, setEnvironment] = useState<EnvironmentData>({
    soilMoisture: 50,
    lightIntensity: 70,
    temperature: 22,
    humidity: 60,
    windSpeed: 10,
  });

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setPlant((prev) => {
        let newGrowth = prev.growth;
        let newHealth = prev.health;
        let newStage = prev.stage;
        let needsWater = false;
        let needsLight = false;

        // Calculate growth based on conditions
        const optimalConditions =
          environment.soilMoisture > 30 &&
          environment.soilMoisture < 80 &&
          environment.lightIntensity > 40 &&
          environment.temperature > 15 &&
          environment.temperature < 30;

        if (optimalConditions) {
          newGrowth = Math.min(100, prev.growth + 0.5 * speed);
          newHealth = Math.min(100, prev.health + 0.2);
        } else {
          newHealth = Math.max(0, prev.health - 0.3);
          
          if (environment.soilMoisture < 30) needsWater = true;
          if (environment.lightIntensity < 40) needsLight = true;
        }

        // Update stage based on growth
        if (newGrowth > 80) newStage = 'flowering';
        else if (newGrowth > 60) newStage = 'mature';
        else if (newGrowth > 30) newStage = 'growing';
        else if (newGrowth > 10) newStage = 'sprout';

        // Decrease soil moisture over time
        setEnvironment((env) => ({
          ...env,
          soilMoisture: Math.max(0, env.soilMoisture - 0.2 * speed),
        }));

        return {
          growth: newGrowth,
          health: newHealth,
          stage: newStage,
          needsWater,
          needsLight,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, speed, environment.soilMoisture, environment.lightIntensity, environment.temperature]);

  const resetSimulation = () => {
    setPlant({
      growth: 0,
      health: 100,
      stage: 'seed',
      needsWater: false,
      needsLight: false,
    });
    setEnvironment({
      soilMoisture: 50,
      lightIntensity: 70,
      temperature: 22,
      humidity: 60,
      windSpeed: 10,
    });
    setIsRunning(false);
  };

  const addWater = () => {
    setEnvironment((prev) => ({
      ...prev,
      soilMoisture: Math.min(100, prev.soilMoisture + 20),
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-green-950/20 via-background to-emerald-950/20">
      {/* Header */}
      <div className="p-4 border-b border-border/20 backdrop-blur-sm bg-card/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-500" />
            <h2 className="text-foreground font-bold text-sm">Agri-Bio Simulator</h2>
            <Badge variant="outline" className="text-xs">
              <Leaf className="w-3 h-3 mr-1" />
              {plant.stage}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isRunning ? 'default' : 'outline'}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSimulation}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 3D View */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border/20 bg-card/10 backdrop-blur-sm">
          <Canvas camera={{ position: [2, 2, 2], fov: 50 }} shadows>
            <color attach="background" args={['#0a0f0a']} />
            <ambientLight intensity={0.3} />
            <directionalLight
              position={[5, 5, 5]}
              intensity={environment.lightIntensity / 100}
              castShadow
            />
            <pointLight position={[-5, 3, -5]} intensity={0.3} color="#4a9eff" />
            <Plant3D {...plant} />
            <OrbitControls enablePan={false} minDistance={2} maxDistance={5} />
            <fog attach="fog" args={['#0a0f0a', 5, 15]} />
          </Canvas>
        </div>

        {/* Controls Panel */}
        <div className="w-80 space-y-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="simulation" className="text-xs">Simulation</TabsTrigger>
              <TabsTrigger value="environment" className="text-xs">Environment</TabsTrigger>
            </TabsList>

            <TabsContent value="simulation" className="space-y-3">
              {/* Plant Status */}
              <Card className="p-3 bg-card/40 backdrop-blur-sm border-border/20">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Plant Status
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Growth</span>
                      <span>{plant.growth.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${plant.growth}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Health</span>
                      <span>{plant.health.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${plant.health}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Alerts */}
              <AnimatePresence>
                {(plant.needsWater || plant.needsLight) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="p-3 bg-yellow-950/30 border-yellow-700/30">
                      <h3 className="text-xs font-semibold mb-2 text-yellow-400">⚠️ Attention Needed</h3>
                      <div className="space-y-1 text-[10px]">
                        {plant.needsWater && (
                          <div className="flex items-center justify-between">
                            <span>Low soil moisture</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={addWater}>
                              <Droplets className="w-3 h-3 mr-1" />
                              Water
                            </Button>
                          </div>
                        )}
                        {plant.needsLight && <p>Insufficient light</p>}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Speed Control */}
              <Card className="p-3 bg-card/40 backdrop-blur-sm border-border/20">
                <h3 className="text-xs font-semibold mb-2">Simulation Speed</h3>
                <div className="space-y-2">
                  <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="text-[10px] text-center text-muted-foreground">{speed}x</div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="environment" className="space-y-3">
              {/* Environmental Controls */}
              {[
                { icon: Droplets, label: 'Soil Moisture', key: 'soilMoisture', unit: '%', color: 'blue' },
                { icon: Sun, label: 'Light Intensity', key: 'lightIntensity', unit: '%', color: 'yellow' },
                { icon: Thermometer, label: 'Temperature', key: 'temperature', unit: '°C', color: 'red', min: -20, max: 50 },
                { icon: Wind, label: 'Wind Speed', key: 'windSpeed', unit: 'km/h', color: 'cyan' },
              ].map(({ icon: Icon, label, key, unit, color, min = 0, max = 100 }) => (
                <Card key={key} className="p-3 bg-card/40 backdrop-blur-sm border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {environment[key as keyof EnvironmentData]}{unit}
                    </span>
                  </div>
                  <Slider
                    value={[environment[key as keyof EnvironmentData]]}
                    onValueChange={([v]) =>
                      setEnvironment((prev) => ({ ...prev, [key]: v }))
                    }
                    min={min}
                    max={max}
                    step={1}
                    className="w-full"
                  />
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
