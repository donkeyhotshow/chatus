"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
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

    // Reusable objects for interpolation to avoid GC pressure
    const targetPosition = useMemo(() => new THREE.Vector3(), []);
    const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);

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

        // Cleanup cloned materials on unmount
        return () => {
            copiedScene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                }
            });
        };
    }, [copiedScene, isPlayer, color]);

    useFrame(() => {
        if (!isPlayer && groupRef.current && position && quaternion) {
            // Reuse objects instead of creating new ones each frame
            targetPosition.set(position[0], position[1], position[2]);
            targetQuaternion.set(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
            groupRef.current.position.lerp(targetPosition, 0.1);
            groupRef.current.quaternion.slerp(targetQuaternion, 0.1);
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

    // Cleanup geometry on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

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
    const geometryRef = useRef<THREE.BoxGeometry | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

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

        // Store refs for cleanup
        geometryRef.current = meshRef.current.geometry as THREE.BoxGeometry;
        materialRef.current = meshRef.current.material as THREE.MeshStandardMaterial;

        return () => {
            geometryRef.current?.dispose();
            materialRef.current?.dispose();
        };
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
    const geometryRef = useRef<THREE.ConeGeometry | null>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

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

        // Store refs for cleanup
        geometryRef.current = meshRef.current.geometry as THREE.ConeGeometry;
        materialRef.current = meshRef.current.material as THREE.MeshStandardMaterial;

        return () => {
            geometryRef.current?.dispose();
            materialRef.current?.dispose();
        };
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

function World({ isMobile }: { isMobile?: boolean }) {
    return (
        <>
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <Stars radius={100} depth={50} count={isMobile ? 2000 : 5000} factor={4} saturation={0} fade speed={1} />
            <Terrain />
            <InstancedSkyscrapers count={isMobile ? 100 : 200} />
            <Trees count={isMobile ? 200 : 500} />
            <Castle />
            {!isMobile && (
                <>
                    <Cloud position={[-1000, 1000, -1000]} speed={0.2} opacity={0.5} />
                    <Cloud position={[1000, 1200, 1000]} speed={0.2} opacity={0.5} />
                    <Cloud position={[0, 1500, 2000]} speed={0.2} opacity={0.5} />
                </>
            )}
            <Environment preset="night" />
            <ambientLight intensity={0.2} />
            <directionalLight
                position={[100, 1000, 100]}
                intensity={1.5}
                castShadow={!isMobile}
                shadow-mapSize={isMobile ? [512, 512] : [2048, 2048]}
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
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [otherPlayers, setOtherPlayers] = useState<{ [userId: string]: VibeJetPlayerData }>({});
    const serviceRef = useRef<RealtimeVibeJetService | null>(null);

    // Player State
    const playerRef = useRef<THREE.Group>(null);
    const [stats, setStats] = useState({ health: 100, score: 0, speed: 0, altitude: 0, ammo: 50 });
    const [projectiles, setProjectiles] = useState<{ id: string, position: THREE.Vector3, velocity: THREE.Vector3, createdAt: number }[]>([]);
    const [muzzleFlash, setMuzzleFlash] = useState<THREE.Vector3 | null>(null);
    const lastFireTimeRef = useRef(0);

    // Reusable vectors for physics calculations to avoid GC pressure
    const tempForward = useMemo(() => new THREE.Vector3(), []);
    // tempPosition and tempVelocity reserved for future physics optimizations

    // Projectile pool for object reuse
    const projectilePoolRef = useRef<{ position: THREE.Vector3, velocity: THREE.Vector3 }[]>([]);
    const MAX_PROJECTILES = 50;

    // Handle model loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                setLoadError('Завантаження займає занадто багато часу. Перевірте з\'єднання.');
            }
        }, 15000);
        return () => clearTimeout(timeout);
    }, [isLoading]);

    // BUG #11 FIX: Check if Firebase RTDB is available
    useEffect(() => {
        if (!rtdb) {
            console.warn('[VibeJet] Firebase RTDB not available');
            // Don't set error immediately, give it time to initialize
            const timeout = setTimeout(() => {
                if (!rtdb) {
                    setLoadError('Firebase не ініціалізовано. Спробуйте перезавантажити сторінку.');
                    setIsLoading(false);
                }
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [rtdb]);

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

    // Handle canvas ready
    const handleCanvasCreated = useCallback(() => {
        setIsLoading(false);
        setLoadError(null);
    }, []);

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
            serviceRef.current = null;
            // Clear projectile pool to free memory
            projectilePoolRef.current = [];
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

        // Movement - reuse tempForward vector
        const speed = PLAYER_SPEED * (controls.boost ? AFTERBURNER_MULTIPLIER : 1);
        tempForward.set(0, 0, 1).applyQuaternion(aircraft.quaternion);
        aircraft.position.addScaledVector(tempForward, speed * delta);

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

            // Reuse vectors from pool or create new ones
            let pooledObj = projectilePoolRef.current.pop();
            if (!pooledObj) {
                pooledObj = { position: new THREE.Vector3(), velocity: new THREE.Vector3() };
            }

            tempForward.set(0, 0, 1).applyQuaternion(aircraft.quaternion);
            pooledObj.position.copy(aircraft.position).add(tempForward.clone().multiplyScalar(20));
            pooledObj.velocity.copy(tempForward).multiplyScalar(1500);

            setProjectiles(prev => {
                // Limit max projectiles to prevent memory issues
                const newProjectiles = prev.length >= MAX_PROJECTILES
                    ? prev.slice(1)
                    : prev;
                return [...newProjectiles, {
                    id: Math.random().toString(36).substr(2, 9),
                    position: pooledObj!.position,
                    velocity: pooledObj!.velocity,
                    createdAt: Date.now()
                }];
            });
            setMuzzleFlash(pooledObj.position.clone());
            setTimeout(() => setMuzzleFlash(null), 50);
            setStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));
            hapticFeedback('light');
        }

        // Update Projectiles - optimized to avoid creating new objects
        setProjectiles(prev => {
            const now = Date.now();
            const active: typeof prev = [];

            for (const p of prev) {
                if (now - p.createdAt < 3000) {
                    // Update position in place instead of creating new Vector3
                    p.position.addScaledVector(p.velocity, delta);
                    active.push(p);
                } else {
                    // Return to pool for reuse
                    projectilePoolRef.current.push({ position: p.position, velocity: p.velocity });
                }
            }

            return active;
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
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin mb-4" />
                    <p className="text-white/60 text-sm">Завантаження 3D моделей...</p>
                </div>
            )}

            {/* Error Overlay */}
            {loadError && (
                <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <Gamepad2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Щось пішло не так</h2>
                    <p className="text-white/60 mb-6 max-w-sm">{loadError}</p>
                    <div className="flex gap-3">
                        <Button onClick={() => window.location.reload()} variant="outline" className="border-white/20 text-white">
                            Перезавантажити
                        </Button>
                        <Button onClick={onGameEnd} className="bg-violet-600 hover:bg-violet-700">
                            Назад до ігор
                        </Button>
                    </div>
                </div>
            )}

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
            <Canvas
                shadows={!isMobile}
                gl={{
                    antialias: !isMobile,
                    powerPreference: isMobile ? "low-power" : "high-performance",
                    precision: isMobile ? "mediump" : "highp"
                }}
                dpr={isMobile ? [1, 1.5] : [1, 2]}
                onCreated={handleCanvasCreated}
                onError={(error) => {
                    console.error('Canvas error:', error);
                    setLoadError('Помилка ініціалізації 3D. Ваш браузер може не підтримувати WebGL.');
                    setIsLoading(false);
                }}
            >
                <Suspense fallback={null}>
                    <World isMobile={isMobile} />

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
                <>
                    {/* Left side - Direction controls */}
                    <div className="absolute bottom-8 left-8 z-10 flex flex-col items-center gap-2">
                        {/* Pitch Up */}
                        <button
                            className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all touch-none"
                            onPointerDown={() => controlsRef.current.up = true}
                            onPointerUp={() => controlsRef.current.up = false}
                            onPointerLeave={() => controlsRef.current.up = false}
                        >
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-white/70" />
                        </button>
                        <div className="flex gap-2">
                            {/* Roll Left */}
                            <button
                                className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all touch-none"
                                onPointerDown={() => controlsRef.current.left = true}
                                onPointerUp={() => controlsRef.current.left = false}
                                onPointerLeave={() => controlsRef.current.left = false}
                            >
                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[15px] border-r-white/70" />
                            </button>
                            {/* Roll Right */}
                            <button
                                className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all touch-none"
                                onPointerDown={() => controlsRef.current.right = true}
                                onPointerUp={() => controlsRef.current.right = false}
                                onPointerLeave={() => controlsRef.current.right = false}
                            >
                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-white/70" />
                            </button>
                        </div>
                        {/* Pitch Down */}
                        <button
                            className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/20 transition-all touch-none"
                            onPointerDown={() => controlsRef.current.down = true}
                            onPointerUp={() => controlsRef.current.down = false}
                            onPointerLeave={() => controlsRef.current.down = false}
                        >
                            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-white/70" />
                        </button>
                    </div>

                    {/* Right side - Action buttons */}
                    <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-4">
                        <button
                            className="w-20 h-20 rounded-full bg-violet-500/30 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center active:scale-90 transition-transform shadow-2xl touch-none"
                            onPointerDown={() => controlsRef.current.boost = true}
                            onPointerUp={() => controlsRef.current.boost = false}
                            onPointerLeave={() => controlsRef.current.boost = false}
                        >
                            <Zap className="w-10 h-10 text-white" />
                        </button>
                        <button
                            className="w-20 h-20 rounded-full bg-red-500/30 backdrop-blur-xl border-2 border-white/10 flex items-center justify-center active:scale-90 transition-transform shadow-2xl touch-none"
                            onPointerDown={() => controlsRef.current.fire = true}
                            onPointerUp={() => controlsRef.current.fire = false}
                            onPointerLeave={() => controlsRef.current.fire = false}
                        >
                            <div className="w-6 h-6 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                        </button>
                    </div>
                </>
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
