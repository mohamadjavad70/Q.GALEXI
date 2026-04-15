/**
 * Open World Tool — Minecraft-style Block Building System
 * ─────────────────────────────────────────────────────────
 * Voxel-based 3D building interface with block placement and removal
 */

import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Boxes, Trash2, Download, Upload, RotateCcw,
  Grid3x3, Box as CubeIcon, Save, Grid,
} from 'lucide-react';

interface Block {
  position: [number, number, number];
  color: string;
  type: string;
}

interface BlockTypeConfig {
  name: string;
  color: string;
  icon: string;
}

const BLOCK_TYPES: BlockTypeConfig[] = [
  { name: 'Grass', color: '#4a9e4a', icon: '🌱' },
  { name: 'Dirt', color: '#8b4513', icon: '🟫' },
  { name: 'Stone', color: '#888888', icon: '🪨' },
  { name: 'Wood', color: '#a0522d', icon: '🪵' },
  { name: 'Sand', color: '#f4e4a4', icon: '🏖️' },
  { name: 'Water', color: '#4a90e2', icon: '💧' },
  { name: 'Lava', color: '#ff4500', icon: '🌋' },
  { name: 'Glass', color: '#e0f7fa', icon: '🔷' },
  { name: 'Gold', color: '#ffd700', icon: '✨' },
  { name: 'Diamond', color: '#00bfff', icon: '💎' },
];

// Grid Helper
function GridPlane() {
  return (
    <gridHelper args={[20, 20, '#444444', '#222222']} position={[0, -0.01, 0]} />
  );
}

// Individual Voxel Block
function VoxelBlock({
  position,
  color,
  onClick,
  onRightClick,
}: {
  position: [number, number, number];
  color: string;
  onClick: () => void;
  onRightClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.button === 2) {
      onRightClick();
    } else {
      onClick();
    }
  };

  return (
    <Box
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.nativeEvent.preventDefault();
      }}
    >
      <meshStandardMaterial
        color={color}
        transparent={color === '#e0f7fa'}
        opacity={color === '#e0f7fa' ? 0.6 : 1}
        emissive={hovered ? new THREE.Color(color).multiplyScalar(0.3) : undefined}
      />
    </Box>
  );
}

// 3D Scene
function BuildingScene({
  blocks,
  onAddBlock,
  onRemoveBlock,
}: {
  blocks: Block[];
  onAddBlock: (position: [number, number, number]) => void;
  onRemoveBlock: (position: [number, number, number]) => void;
}) {
  const planeRef = useRef<THREE.Mesh>(null);

  const handlePlaneClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    
    const point = e.point;
    const x = Math.round(point.x);
    const y = Math.round(Math.max(0, point.y));
    const z = Math.round(point.z);
    
    onAddBlock([x, y, z]);
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      <GridPlane />
      
      {/* Invisible plane for placing first blocks */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handlePlaneClick}
        visible={false}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {blocks.map((block, i) => (
        <VoxelBlock
          key={`${block.position.join(',')}-${i}`}
          position={block.position}
          color={block.color}
          onClick={() => {
            // Place block on top
            const newPos: [number, number, number] = [
              block.position[0],
              block.position[1] + 1,
              block.position[2],
            ];
            onAddBlock(newPos);
          }}
          onRightClick={() => onRemoveBlock(block.position)}
        />
      ))}

      <OrbitControls
        enablePan={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={30}
      />
    </>
  );
}

export default function OpenWorldTool() {
  const [blocks, setBlocks] = useState<Block[]>([
    // Starting platform
    { position: [0, 0, 0], color: '#4a9e4a', type: 'Grass' },
    { position: [1, 0, 0], color: '#4a9e4a', type: 'Grass' },
    { position: [0, 0, 1], color: '#4a9e4a', type: 'Grass' },
    { position: [1, 0, 1], color: '#4a9e4a', type: 'Grass' },
  ]);
  const [selectedBlockType, setSelectedBlockType] = useState(BLOCK_TYPES[0]);
  const [isGridVisible, setIsGridVisible] = useState(true);

  const addBlock = (position: [number, number, number]) => {
    // Check if block already exists at position
    const exists = blocks.some(
      (b) => b.position[0] === position[0] && b.position[1] === position[1] && b.position[2] === position[2]
    );
    
    if (!exists) {
      setBlocks([...blocks, {
        position,
        color: selectedBlockType.color,
        type: selectedBlockType.name,
      }]);
    }
  };

  const removeBlock = (position: [number, number, number]) => {
    setBlocks(blocks.filter(
      (b) => !(b.position[0] === position[0] && b.position[1] === position[1] && b.position[2] === position[2])
    ));
  };

  const clearAll = () => {
    setBlocks([
      { position: [0, 0, 0], color: '#4a9e4a', type: 'Grass' },
      { position: [1, 0, 0], color: '#4a9e4a', type: 'Grass' },
      { position: [0, 0, 1], color: '#4a9e4a', type: 'Grass' },
      { position: [1, 0, 1], color: '#4a9e4a', type: 'Grass' },
    ]);
  };

  const saveWorld = () => {
    const data = JSON.stringify(blocks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `open-world-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadWorld = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            setBlocks(data);
          } catch (error) {
            console.error('Failed to load world:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-green-950/20 via-background to-blue-950/20">
      {/* Header */}
      <div className="p-4 border-b border-border/20 backdrop-blur-sm bg-card/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-green-500" />
            <h2 className="text-foreground font-bold text-sm">Open World Builder</h2>
            <Badge variant="outline" className="text-xs">
              <CubeIcon className="w-3 h-3 mr-1" />
              {blocks.length} blocks
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={saveWorld}>
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={loadWorld}>
              <Upload className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 3D View */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border/20 bg-card/10 backdrop-blur-sm">
          <Canvas
            camera={{ position: [10, 10, 10], fov: 50 }}
            shadows
            onContextMenu={(e) => e.preventDefault()}
          >
            <color attach="background" args={['#0a0f14']} />
            <fog attach="fog" args={['#0a0f14', 10, 50]} />
            <BuildingScene
              blocks={blocks}
              onAddBlock={addBlock}
              onRemoveBlock={removeBlock}
            />
          </Canvas>
        </div>

        {/* Block Palette */}
        <div className="w-64 space-y-3">
          <Card className="p-3 bg-card/40 backdrop-blur-sm border-border/20">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Grid3x3 className="w-3.5 h-3.5" />
              Block Palette
            </h3>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.map((blockType) => (
                  <button
                    key={blockType.name}
                    onClick={() => setSelectedBlockType(blockType)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      selectedBlockType.name === blockType.name
                        ? 'border-primary bg-primary/10'
                        : 'border-border/20 bg-secondary/20 hover:bg-secondary/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{blockType.icon}</div>
                    <div className="text-[10px] font-medium">{blockType.name}</div>
                    <div
                      className="w-full h-3 rounded mt-1"
                      style={{ backgroundColor: blockType.color }}
                    />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="p-3 bg-card/40 backdrop-blur-sm border-border/20">
            <h3 className="text-xs font-semibold mb-2">Controls</h3>
            <div className="space-y-2 text-[10px] text-muted-foreground">
              <p>🖱️ <strong>Left Click:</strong> Place block</p>
              <p>🖱️ <strong>Right Click:</strong> Remove block</p>
              <p>🖱️ <strong>Drag:</strong> Rotate view</p>
              <p>🖱️ <strong>Scroll:</strong> Zoom in/out</p>
              <p>🖱️ <strong>Middle Drag:</strong> Pan view</p>
            </div>
          </Card>

          <Card className="p-3 bg-card/40 backdrop-blur-sm border-border/20">
            <h3 className="text-xs font-semibold mb-2">Selected Block</h3>
            <div className="flex items-center gap-2 p-2 rounded bg-secondary/20">
              <div className="text-2xl">{selectedBlockType.icon}</div>
              <div>
                <div className="text-xs font-medium">{selectedBlockType.name}</div>
                <div
                  className="w-full h-2 rounded mt-1"
                  style={{ backgroundColor: selectedBlockType.color }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
