"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    PerspectiveCamera,
    Sky,
    Stars,
    Cloud,
    useGLTF,
    Environment,
    Html,
    Text
} from '@react-three/drei';
import * as THREE from 'three';
import { UserProfile } from '@/lib/types';
import { RealtimeVibeJetService, VibeJetPlayerData } from '@/services/RealtimeVibeJetService';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/game-utils';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Button } from '../ui/button';
import { ArrowLeft, Gamepad2, Trophy, Zap } from 'lucide-react';

// --- Constants ---
const GROUND_SIZE = 8000;
const TERRAIN_AMPLITUDE = 50;
const TERRAIN_FREQUENCY = (8 * Math.PI * 2) / GROUND_SIZE;
const PLAYER_SPEED = 200.0;
const AFTERBURNER_MULTIPLIER = 3.0;
const ROLL_SPEED = Math.PI * 1.0;
const PITCH_SPEED = Math.PI * 0.8;
const YAW_SPEED = Math.PI * 0.5;
// DAMPING removed - not currently used
const ASSETS_PATH = '/games/vibe-jet/assets';
const MODEL_URL = `${ASSETS_PATH}/shenyang_j-11.glb`;

// --- Terrain Utility ---
function getTerrainHeight(x: number, z: number) {
    return (
        Math.sin(x * TERRAIN_FREQUENCY) *
        Math.cos(z * TERRAIN_FREQUENCY) *
        TERRAIN_AMPLITUDE
    );
}

// --- Components ---

function Aircraft({ modelUrl, isPlayer, position, quaternion, name, color }: {
    modelUrl: string,
    isPlayer?: boolean,
    position?: [number, number, number],
    quaternion?: [number, number, number, number],
    name?: string,
    color?: string
}) {
    const { scene } = useGLTF(modelUrl);
    const copiedScene = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        copiedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (!isPlayer && color) {
                    child.material = child.material.clone();
                    child.material.color.set(color);
                }
            }
        });
    }, [copiedScene, isPlayer, color]);

    useFrame(() => {
        if (!isPlayer && groupRef.current && position && quaternion) {
            groupRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
            groupRef.current.quaternion.slerp(new THREE.Quaternion(...quaternion), 0.1);
        }
    });

    return (
        <group ref={groupRef} position={position} quaternion={quaternion ? new THREE.Quaternion(...quaternion) : undefined}>
            <primitive object={copiedScene} scale={0.8} rotation={[0, Math.PI, 0]} />
            {!isPlayer && name && (
                <Html position={[0, 10, 0]} center>
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs whitespace-nowrap border border-white/10">
                        {name}
                    </div>
                </Html>
            )}
        </group>
    );
}

function Terrain() {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 100, 100);
        const vertices = geo.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            vertices[i + 2] = getTerrainHeight(x, z);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    return (
        <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
        </mesh>
    );
}

// Optimized Skyscrapers using InstancedMesh
function InstancedSkyscrapers({ count = 200 }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < count; i++) {
            const height = 50 + Math.random() * 350;
            const width = 20 + Math.random() * 30;
            const depth = 20 + Math.random() * 30;
            const x = (Math.random() - 0.5) * GROUND_SIZE * 0.8;
            const z = (Math.random() - 0.5) * GROUND_SIZE * 0.8;
            const y = getTerrainHeight(x, z) + height / 2;

            tempObject.position.set(x, y, z);
            tempObject.scale.set(width, height, depth);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [count, tempObject]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#222" roughness={0.8} metalness={0.2} />
        </instancedMesh>
    );
}

function Trees({ count = 500 }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * GROUND_SIZE * 0.9;
            const z = (Math.random() - 0.5) * GROUND_SIZE * 0.9;
            const y = getTerrainHeight(x, z);

            tempObject.position.set(x, y + 5, z);
            tempObject.scale.setScalar(2 + Math.random() * 3);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [count, tempObject]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
            <coneGeometry args={[2, 10, 8]} />
            <meshStandardMaterial color="#1a331a" />
        </instancedMesh>
    );
}

function Castle() {
    return (
        <group position={[2000, 0, 1000]} scale={3}>
            {/* Main Keep */}
            <mesh position={[0, 30, 0]} castShadow receiveShadow>
                <boxGeometry args={[40, 60, 40]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            {/* Towers */}
            {[[-22, 35, -22], [22, 35, -22], [-22, 35, 22], [22, 35, 22]].map((pos, i) => (
                <group key={i} position={pos as [number, number, number]}>
                    <mesh castShadow receiveShadow>
                        <cylinderGeometry args={[6, 8, 70, 8]} />
                        <meshStandardMaterial color="#555" />
                    </mesh>
                    <mesh position={[0, 42, 0]} castShadow>
                        <coneGeometry args={[8, 15, 8]} />
                        <meshStandardMaterial color="#422" />
                    </mesh>
                </group>
            ))}
            {/* Banner */}
            <mesh position={[0, 40, 20.1]}>
                <planeGeometry args={[30, 15]} />
                <meshBasicMaterial color="#7c3aed" transparent opacity={0.8} />
                <Text position={[0, 0, 0.1]} fontSize={4} color="white" anchorX="center" anchorY="middle">
                    CASTLE
                </Text>
            </mesh>
        </group>
    );
}

function World() {
    return (
        <>
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Terrain />
            <InstancedSkyscrapers />
            <Trees />
            <Castle />
            <Cloud position={[-1000, 1000, -1000]} speed={0.2} opacity={0.5} />
            <Cloud position={[1000, 1200, 1000]} speed={0.2} opacity={0.5} />
            <Cloud position={[0, 1500, 2000]} speed={0.2} opacity={0.5} />
            <Environment preset="night" />
            <ambientLight intensity={0.2} />
            <directionalLight
                position={[100, 1000, 100]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />
        </>
    );
}

// --- Main Game Logic ---

export default function VibeJet({ onGameEnd, user, roomId }: {
    onGameEnd: () => void,
    user: UserProfile,
    roomId: string
}) {
    const { rtdb } = useFirebase();
    const isMobile = useIsMobile();
    const [_isStarted, _setIsStarted] = useState(false);
    const [otherPlayers, setOtherPlayers] = useState<{ [userId: string]: VibeJetPlayerData }>({});
    const serviceRef = useRef<RealtimeVibeJetService | null>(null);

    // Player State
    const playerRef = useRef<THREE.Group>(null);
    const [stats, setStats] = useState({ health: 100, score: 0, speed: 0, altitude: 0, ammo: 50 });
    const [projectiles, setProjectiles] = useState<{ id: string, position: THREE.Vector3, velocity: THREE.Vector3, createdAt: number }[]>([]);
    const [muzzleFlash, setMuzzleFlash] = useState<THREE.Vector3 | null>(null);
    const lastFireTimeRef = useRef(0);

    // Controls
    const controlsRef = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        boost: false,
        fire: false
    });

    useEffect(() => {
        if (!rtdb) return;
        const service = new RealtimeVibeJetService(rtdb, roomId, user.id);
        serviceRef.current = service;

        const unsubscribe = service.subscribe((state) => {
            if (state.players) {
                const others: { [userId: string]: VibeJetPlayerData } = {};
                Object.entries(state.players).forEach(([id, data]) => {
                    if (id !== user.id) others[id] = data;
                });
                setOtherPlayers(others);
            }
        });

        return () => {
            unsubscribe();
            service.destroy();
        };
    }, [rtdb, roomId, user.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'w': controlsRef.current.up = true; break;
                case 's': controlsRef.current.down = true; break;
                case 'a': controlsRef.current.left = true; break;
                case 'd': controlsRef.current.right = true; break;
                case 'shift': controlsRef.current.boost = true; break;
                case ' ': controlsRef.current.fire = true; break;
                case 'arrowup': controlsRef.current.forward = true; break;
                case 'arrowdown': controlsRef.current.backward = true; break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'w': controlsRef.current.up = false; break;
                case 's': controlsRef.current.down = false; break;
                case 'a': controlsRef.current.left = false; break;
                case 'd': controlsRef.current.right = false; break;
                case 'shift': controlsRef.current.boost = false; break;
                case ' ': controlsRef.current.fire = false; break;
                case 'arrowup': controlsRef.current.forward = false; break;
                case 'arrowdown': controlsRef.current.backward = false; break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const updatePhysics = (delta: number) => {
        if (!playerRef.current) return;

        const aircraft = playerRef.current;
        const controls = controlsRef.current;

        // Rotation
        let targetRoll = 0;
        let targetPitch = 0;
        let targetYaw = 0;

        if (controls.left) targetRoll += ROLL_SPEED;
        if (controls.right) targetRoll -= ROLL_SPEED;
        if (controls.up) targetPitch -= PITCH_SPEED;
        if (controls.down) targetPitch += PITCH_SPEED;
        if (controls.forward) targetYaw += YAW_SPEED;
        if (controls.backward) targetYaw -= YAW_SPEED;

        // Apply rotation
        aircraft.rotateX(targetPitch * delta);
        aircraft.rotateY(targetYaw * delta);
        aircraft.rotateZ(targetRoll * delta);

        // Movement
        const speed = PLAYER_SPEED * (controls.boost ? AFTERBURNER_MULTIPLIER : 1);
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(aircraft.quaternion);
        aircraft.position.add(forward.multiplyScalar(speed * delta));

        // Terrain Collision
        const terrainHeight = getTerrainHeight(aircraft.position.x, aircraft.position.z);
        if (aircraft.position.y < terrainHeight + 5) {
            aircraft.position.y = terrainHeight + 5;
            // Damage or bounce?
            setStats(prev => ({ ...prev, health: Math.max(0, prev.health - 10 * delta) }));
            hapticFeedback('medium');
        }

        // Update Stats
        setStats(prev => ({
            ...prev,
            speed: Math.round(speed),
            altitude: Math.round(aircraft.position.y)
        }));

        // Fire
        if (controls.fire && Date.now() - lastFireTimeRef.current > 100 && stats.ammo > 0) {
            lastFireTimeRef.current = Date.now();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(aircraft.quaternion);
            const pos = aircraft.position.clone().add(forward.clone().multiplyScalar(20));
            const vel = forward.clone().multiplyScalar(1500);

                setProjectiles(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    position: pos,
                    velocity: vel,
                    createdAt: Date.now()
                }]);
                setMuzzleFlash(pos);
                setTimeout(() => setMuzzleFlash(null), 50);
                setStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));
            hapticFeedback('light');
        }

        // Update Projectiles
        setProjectiles(prev => {
            const now = Date.now();
            return prev
                .map(p => ({
                    ...p,
                    position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta))
                }))
                .filter(p => now - p.createdAt < 3000);
        });

        // Sync with Firebase
        if (serviceRef.current) {
            serviceRef.current.updateMyPlayer({
                userName: user.name,
                position: [aircraft.position.x, aircraft.position.y, aircraft.position.z],
                quaternion: [aircraft.quaternion.x, aircraft.quaternion.y, aircraft.quaternion.z, aircraft.quaternion.w],
                health: stats.health,
                score: stats.score,
                isDead: stats.health <= 0
            });
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden font-sans">
            {/* HUD */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Скорость</div>
                            <div className="text-xl font-black text-white leading-none">{stats.speed} <span className="text-xs font-normal text-white/40">км/ч</span></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Высота</div>
                            <div className="text-xl font-black text-white leading-none">{stats.altitude} <span className="text-xs font-normal text-white/40">м</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl w-48">
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Прочность</div>
                        <div className="text-xs font-bold text-white">{Math.round(stats.health)}%</div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                stats.health > 50 ? "bg-emerald-500" : stats.health > 20 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${stats.health}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white font-bold shadow-2xl">
                    СЧЕТ: {stats.score}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onGameEnd}
                    className="bg-black/60 backdrop-blur-md hover:bg-white/10 text-white rounded-xl border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="w-8 h-8 border-2 border-white/20 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                </div>
            </div>

            {/* Game Over Overlay */}
            {stats.health <= 0 && (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center p-6 text-center">
                    <div className="max-w-sm">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Zap className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">САМОЛЕТ УНИЧТОЖЕН</h2>
                        <p className="text-white/60 mb-8">Вы не справились с управлением или получили слишком много урона.</p>
                        <Button
                            onClick={() => {
                                setStats({ health: 100, score: 0, speed: 0, altitude: 0, ammo: 50 });
                                if (playerRef.current) {
                                    playerRef.current.position.set(0, 500, 0);
                                    playerRef.current.rotation.set(0, 0, 0);
                                }
                            }}
                            className="w-full bg-white text-black hover:bg-white/90 font-bold py-6 rounded-2xl"
                        >
                            ВОССТАНОВИТЬ
                        </Button>
                    </div>
                </div>
            )}

            {/* 3D Canvas */}
            <Canvas shadows gl={{ antialias: true, powerPreference: "high-performance" }}>
                <Suspense fallback={null}>
                    <World />

                    {/* Player */}
                    <group ref={playerRef} position={[0, 500, 0]}>
                        <Aircraft modelUrl={MODEL_URL} isPlayer />
                        <PerspectiveCamera makeDefault position={[0, 5, -15]} fov={75} />
                    </group>

                    {/* Other Players */}
                    {Object.entries(otherPlayers).map(([id, data]) => (
                        <Aircraft
                            key={id}
                            modelUrl={MODEL_URL}
                            position={data.position}
                            quaternion={data.quaternion}
                            name={data.userName}
                            color="#00aaff"
                        />
                    ))}

                    {/* Projectiles */}
                    {projectiles.map(p => (
                        <mesh key={p.id} position={p.position}>
                            <sphereGeometry args={[1, 8, 8]} />
                            <meshBasicMaterial color="#ff4400" />
                        </mesh>
                    ))}

                    {/* Muzzle Flash */}
                    {muzzleFlash && (
                        <pointLight position={muzzleFlash} color="#ff4400" intensity={5} distance={50} />
                    )}

                    {/* Physics Loop */}
                    <PhysicsRunner onUpdate={updatePhysics} />
                </Suspense>
            </Canvas>

            {/* Controls Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold pointer-events-none">
                {isMobile ? 'ИСПОЛЬЗУЙТЕ КНОПКИ НА ЭКРАНЕ' : 'W/S: ТАНГАЖ • A/D: КРЕН • СТРЕЛКИ: РЫСКАНИЕ • SHIFT: ФОРСАЖ • SPACE: ОГОНЬ'}
            </div>

            {/* Mobile Controls */}
            {isMobile && (
                <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-6">
                    <button
                        className="w-20 h-20 rounded-full bg-violet-500/30 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
                        onPointerDown={() => controlsRef.current.boost = true}
                        onPointerUp={() => controlsRef.current.boost = false}
                    >
                        <Zap className="w-10 h-10 text-white" />
                    </button>
                    <button
                        className="w-20 h-20 rounded-full bg-red-500/30 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
                        onPointerDown={() => controlsRef.current.fire = true}
                        onPointerUp={() => controlsRef.current.fire = false}
                    >
                        <div className="w-6 h-6 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                    </button>
                </div>
            )}
        </div>
    );
}

function PhysicsRunner({ onUpdate }: { onUpdate: (delta: number) => void }) {
    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useFrame((state, delta) => {
        onUpdateRef.current(delta);
    });
    return null;
}

// Preload model
useGLTF.preload(MODEL_URL);
