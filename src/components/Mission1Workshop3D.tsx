import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Html, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface WorkshopClue {
  id: string;
  name: string;
  en: string;
  physical: boolean;
  position: [number, number, number];
  where: string;
  touch: string;
  observe: string;
  model: 'monitor' | 'keyboard' | 'mouse' | 'ram' | 'ssd' | 'browser' | 'file' | 'os';
}

interface SceneProps {
  clues: WorkshopClue[];
  collected: string[];
  onNear: (id: string | null) => void;
  onInspect: (id: string) => void;
  move: { forward: boolean; back: boolean; left: boolean; right: boolean };
  stepRequest?: { direction: 'forward' | 'back' | 'left' | 'right'; nonce: number } | null;
  controlsEnabled?: boolean;
  pickupId?: string | null;
  compact?: boolean;
}

export function Mission1Workshop3D(props: SceneProps) {
  return (
    <div className={`relative ${props.compact ? 'h-[36svh] min-h-[220px] sm:h-[min(52vh,560px)] sm:min-h-[340px] lg:h-[min(64vh,680px)] lg:min-h-[440px]' : 'h-[min(58svh,620px)] min-h-[320px] sm:h-[min(66vh,720px)] sm:min-h-[460px] lg:min-h-[520px]'} overflow-hidden rounded-2xl bg-[#0b111b] shadow-xl ring-1 ring-slate-800 sm:rounded-[1.75rem]`} aria-label="ฉากสำรวจห้องซ่อมคอมพิวเตอร์สามมิติ" onPointerDown={(event) => { if (event.target instanceof HTMLCanvasElement) event.target.focus({ preventScroll: true }); }}>
      <Canvas dpr={[1, 1.75]} shadows camera={{ position: [0, 3.9, 13], fov: 52 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.04; gl.domElement.tabIndex = 0; gl.domElement.focus({ preventScroll: true }); }}>
        <color attach="background" args={['#111c2a']} />
        <fog attach="fog" args={['#111c2a', 15, 34]} />
        <ambientLight intensity={0.32} />
        <hemisphereLight args={['#d9e5f2', '#20252b', 0.62]} />
        <directionalLight castShadow position={[-5, 10, 5]} intensity={3.1} color="#f3e9d6" shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
        <pointLight position={[-6, 4, -5]} intensity={10} distance={12} color="#77b9d4" />
        <pointLight position={[6, 4, -3]} intensity={8} distance={12} color="#edae70" />
        <Environment files="/models/mission1/university_workshop_1k.hdr" environmentIntensity={0.42} />
        <WorkshopRoom {...props} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(2,6,23,.44)_100%)]" />
      <div className="pointer-events-none absolute left-2 right-2 top-2 rounded-xl border border-white/10 bg-slate-950/75 px-2.5 py-2 text-[10px] font-bold leading-snug text-white backdrop-blur sm:left-4 sm:right-auto sm:top-4 sm:px-3 sm:text-sm">
        <span className="text-cyan-300">เวิร์กช็อปช่างคอม · 3D</span><span className="mx-1.5 text-white/40 sm:mx-2">|</span><span>WASD / ปุ่มเดิน</span><span className="mx-1.5 text-white/40 sm:mx-2">·</span><span>กด E เพื่อตรวจ</span>
      </div>
      {props.pickupId && <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-amber-200/30 bg-slate-950/80 px-4 py-2 text-sm font-bold text-amber-100 shadow-xl backdrop-blur animate-pulse">{props.clues.find((item) => item.id === props.pickupId)?.physical ? 'กำลังหยิบอุปกรณ์…' : 'กำลังสแกนข้อมูล…'}</div>}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-200/20 bg-slate-950/75 px-4 py-2 text-xs font-semibold text-cyan-50 backdrop-blur sm:text-sm">
        เดินเข้าใกล้ชิ้นส่วน แล้วกด E หรือแตะวัตถุในฉาก
      </div>
    </div>
  );
}

function WorkshopRoom({ clues, collected, onNear, onInspect, move, stepRequest, controlsEnabled = true, pickupId = null }: SceneProps) {
  const player = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(0, 0, 7));
  const cameraTarget = useRef(new THREE.Vector3());
  const keys = useRef(new Set<string>());
  const nearest = useRef<string | null>(null);
  const interact = useRef(onInspect);
  const walking = useRef(false);
  const stepPulse = useRef<{ dx: number; dz: number; until: number } | null>(null);
  const pickupProgress = useRef(0);

  useEffect(() => { interact.current = onInspect; }, [onInspect]);
  useEffect(() => {
    if (!pickupId || !player.current) return;
    const clue = clues.find((item) => item.id === pickupId);
    if (clue) player.current.rotation.y = Math.atan2(-(clue.position[0] - position.current.x), -(clue.position[2] - position.current.z));
  }, [pickupId, clues]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName ?? '')) return;
      // Use physical key positions so movement still works with Thai/other keyboard layouts.
      const key = ({ KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyE: 'e' } as Record<string, string>)[event.code] ?? event.key.toLowerCase();
      if (!controlsEnabled && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) return;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(key)) event.preventDefault();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) stepPulse.current = null;
      keys.current.add(key);
      if (key === 'e' && nearest.current) interact.current(nearest.current);
    };
    const up = (event: KeyboardEvent) => {
      const key = ({ KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyE: 'e' } as Record<string, string>)[event.code] ?? event.key.toLowerCase();
      keys.current.delete(key);
    };
    const clear = () => keys.current.clear();
    document.addEventListener('keydown', down, true);
    document.addEventListener('keyup', up, true);
    window.addEventListener('blur', clear);
    return () => { document.removeEventListener('keydown', down, true); document.removeEventListener('keyup', up, true); window.removeEventListener('blur', clear); };
  }, [controlsEnabled]);

  useEffect(() => { if (!controlsEnabled) keys.current.clear(); }, [controlsEnabled]);

  useEffect(() => {
    if (!stepRequest) return;
    const dir = stepVector(stepRequest.direction);
    stepPulse.current = { dx: dir[0], dz: dir[1], until: performance.now() + 320 };
  }, [stepRequest?.nonce]);

  useFrame(({ camera }, delta) => {
    const actor = player.current;
    if (!actor) return;
    pickupProgress.current = THREE.MathUtils.damp(pickupProgress.current, pickupId ? 1 : 0, pickupId ? 4.4 : 5.5, delta);
    const held = keys.current;
    const forward = move.forward || held.has('w') || held.has('arrowup');
    const back = move.back || held.has('s') || held.has('arrowdown');
    const left = move.left || held.has('a') || held.has('arrowleft');
    const right = move.right || held.has('d') || held.has('arrowright');
    const pulse = stepPulse.current;
    const pulsing = !!pulse && performance.now() < pulse.until;
    if (pulse && !pulsing) stepPulse.current = null;
    let dx = Number(right) - Number(left) + (pulsing ? pulse?.dx ?? 0 : 0);
    let dz = Number(back) - Number(forward) + (pulsing ? pulse?.dz ?? 0 : 0);
    const length = Math.hypot(dx, dz);
    walking.current = length > 0;
    if (length > 0) {
      const speed = Math.min(5.2 * Math.min(delta, 0.05), length);
      const nextX = THREE.MathUtils.clamp(position.current.x + (dx / length) * speed, -8.7, 8.7);
      const nextZ = THREE.MathUtils.clamp(position.current.z + (dz / length) * speed, -8.7, 8.7);
      position.current.x = nextX;
      position.current.z = nextZ;
      actor.rotation.y = Math.atan2(-dx, -dz);
    }
    actor.position.copy(position.current);
    cameraTarget.current.set(position.current.x, 3.8, position.current.z + 6.7);
    camera.position.lerp(cameraTarget.current, 1 - Math.exp(-delta * 5.5));
    camera.lookAt(position.current.x, 1.0, position.current.z - 1.35);

    let nextNearest: WorkshopClue | undefined;
    let best = 2.65;
    for (const clue of clues) {
      if (collected.includes(clue.id)) continue;
      const distance = Math.hypot(position.current.x - clue.position[0], position.current.z - clue.position[2]);
      if (distance < best) { best = distance; nextNearest = clue; }
    }
    const id = nextNearest?.id ?? null;
    if (id !== nearest.current) { nearest.current = id; onNear(id); }
  });

  return (
    <>
      <RoomGeometry />
      <Suspense fallback={null}>
        <RepairWorkbench position={[-3.7, 0, -5.45]} rotation={0.12} scale={[1.45, 1, 1.45]} />
        <RepairWorkbench position={[5.8, 0, -6]} rotation={-0.08} scale={[1.45, 1, 1.45]} />
        <RepairWorkbench position={[6.1, 0, 0.55]} rotation={Math.PI} />
        <DesktopTower position={[-7.6, 0.02, -4.1]} /><DesktopTower position={[7.8, 0.02, 4.6]} />
      </Suspense>
      <group ref={player}>
        <Technician walking={walking} pickupProgress={pickupProgress} twoHanded={clues.find((item) => item.id === pickupId)?.model === 'monitor' || clues.find((item) => item.id === pickupId)?.model === 'keyboard'} />
      </group>
      {clues.map((clue, index) => <ClueModel key={clue.id} clue={clue} index={index} found={collected.includes(clue.id)} nearest={nearest.current === clue.id} held={pickupId === clue.id && clue.physical} playerPosition={position} onInspect={() => onInspect(clue.id)} />)}
      <ContactShadows position={[0, 0.015, 0]} opacity={0.34} scale={28} blur={2.8} far={4} frames={1} resolution={256} />
    </>
  );
}

function stepVector(direction: NonNullable<SceneProps['stepRequest']>['direction']): [number, number] {
  if (direction === 'forward') return [0, -1];
  if (direction === 'back') return [0, 1];
  if (direction === 'left') return [-1, 0];
  return [1, 0];
}

function AssetModel({ src, scale = 1, rotation = 0 }: { src: string; scale?: number; rotation?: number }) {
  const { scene } = useGLTF(src);
  const clone = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
    return object;
  }, [scene]);
  return <primitive object={clone} scale={scale} rotation={[0, rotation, 0]} />;
}

function RepairWorkbench({ position, rotation, scale = [1, 1, 1] }: { position: [number, number, number]; rotation: number; scale?: [number, number, number] }) {
  return <group position={position} rotation={[0, rotation, 0]} scale={scale}><AssetModel src="/models/mission1/repair-workbench.glb" /></group>;
}

function DesktopTower({ position }: { position: [number, number, number] }) {
  return <group position={position} scale={1.5}><AssetModel src="/models/mission1/desktop-tower.glb" /></group>;
}

function RoomGeometry() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#20262c" roughness={0.86} metalness={0.04} /></mesh>
      {[-8, -4, 0, 4, 8].map((line) => <group key={line}>
        <mesh position={[line, -0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.012, 19.6]} /><meshBasicMaterial color="#69737c" transparent opacity={0.2} /></mesh>
        <mesh position={[0, -0.026, line]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[19.6, 0.012]} /><meshBasicMaterial color="#69737c" transparent opacity={0.2} /></mesh>
      </group>)}
      <RoundedBox args={[20, 5.4, 0.35]} radius={0.08} position={[0, 2.65, -9.9]} receiveShadow><meshStandardMaterial color="#34404b" roughness={0.76} /></RoundedBox>
      <RoundedBox args={[0.35, 5.4, 20]} radius={0.08} position={[-9.9, 2.65, 0]} receiveShadow><meshStandardMaterial color="#303b46" roughness={0.78} /></RoundedBox>
      <RoundedBox args={[0.35, 5.4, 20]} radius={0.08} position={[9.9, 2.65, 0]} receiveShadow><meshStandardMaterial color="#303b46" roughness={0.78} /></RoundedBox>
      <RoundedBox args={[20, 0.3, 0.35]} radius={0.06} position={[0, 5.35, -9.9]}><meshStandardMaterial color="#141c24" /></RoundedBox>
      {[-7, -3, 1, 5, 9].map((x) => <mesh key={x} position={[x, 3.1, -9.68]}><boxGeometry args={[0.06, 5.4, 0.06]} /><meshStandardMaterial color="#202b36" /></mesh>)}
      {[-6, -2, 2, 6].map((x) => <group key={x}><mesh position={[x, 5.05, -4]}><boxGeometry args={[2.2, 0.09, 0.14]} /><meshStandardMaterial color="#f1d7a1" emissive="#ffc86d" emissiveIntensity={1.5} /></mesh><pointLight position={[x, 4.95, -4]} intensity={8} distance={7} color="#ffe4b5" /></group>)}
      <mesh position={[0, 0.01, 7.8]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.05, 1.12, 48]} /><meshBasicMaterial color="#22d3ee" transparent opacity={0.55} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.02, 7.8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.96, 48]} /><meshBasicMaterial color="#0e7490" transparent opacity={0.08} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

function Technician({ walking, pickupProgress, twoHanded }: { walking: MutableRefObject<boolean>; pickupProgress: MutableRefObject<number>; twoHanded: boolean }) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 8;
    const pickup = pickupProgress.current;
    const swing = walking.current ? Math.sin(t) * 0.42 * (1 - pickup) : 0;
    if (leftArm.current) { leftArm.current.rotation.x = swing + (twoHanded ? pickup * 1.35 : 0); leftArm.current.rotation.z = twoHanded ? pickup * 0.28 : 0; }
    if (rightArm.current) { rightArm.current.rotation.x = -swing + pickup * 1.42; rightArm.current.rotation.z = -pickup * (twoHanded ? 0.28 : 0.12); }
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
  });
  return <group>
    <mesh position={[0, 0.82, 0]} castShadow><capsuleGeometry args={[0.28, 0.56, 8, 20]} /><meshStandardMaterial color="#253449" roughness={0.88} /></mesh>
    <group position={[0, 0.88, -0.205]}><RoundedBox args={[0.42, 0.67, 0.09]} radius={0.025} castShadow><meshStandardMaterial color="#d36b22" roughness={0.84} /></RoundedBox><mesh position={[0, 0.17, 0.051]}><boxGeometry args={[0.4, 0.045, 0.012]} /><meshStandardMaterial color="#f2cf73" metalness={0.12} roughness={0.5} /></mesh><mesh position={[0, -0.14, 0.051]}><boxGeometry args={[0.4, 0.045, 0.012]} /><meshStandardMaterial color="#f2cf73" metalness={0.12} roughness={0.5} /></mesh><mesh position={[0.28, -0.25, 0]}><boxGeometry args={[0.2, 0.25, 0.2]} /><meshStandardMaterial color="#303b48" roughness={0.9} /></mesh></group>
    <mesh position={[0, 1.28, 0]} castShadow><cylinderGeometry args={[0.105, 0.11, 0.13, 16]} /><meshStandardMaterial color="#b8805c" roughness={0.92} /></mesh>
    <mesh position={[0, 1.48, 0]} scale={[0.82, 1.08, 0.83]} castShadow><sphereGeometry args={[0.2, 24, 18]} /><meshStandardMaterial color="#b8805c" roughness={0.92} /></mesh>
    <mesh position={[0, 1.63, 0]} castShadow><sphereGeometry args={[0.215, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.39]} /><meshStandardMaterial color="#e8aa39" roughness={0.5} metalness={0.06} /></mesh>
    <mesh position={[0, 1.59, 0]} castShadow><cylinderGeometry args={[0.235, 0.235, 0.035, 24]} /><meshStandardMaterial color="#e8aa39" roughness={0.52} /></mesh>
    <mesh position={[0, 0.87, -0.3]}><boxGeometry args={[0.26, 0.34, 0.06]} /><meshStandardMaterial color="#f8fafc" roughness={0.8} /></mesh>
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftArm : rightArm} position={[side * 0.34, 1.08, 0]}><mesh position={[0, -0.25, 0]} rotation={[0, 0, side * -0.11]} castShadow><capsuleGeometry args={[0.088, 0.4, 6, 14]} /><meshStandardMaterial color="#253449" roughness={0.9} /></mesh><mesh position={[0, -0.49, 0]}><sphereGeometry args={[0.085, 16, 12]} /><meshStandardMaterial color="#303b48" roughness={0.82} /></mesh></group>)}
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * 0.14, 0.49, 0]}><mesh position={[0, -0.24, 0]} castShadow><capsuleGeometry args={[0.105, 0.42, 6, 14]} /><meshStandardMaterial color="#283444" roughness={0.9} /></mesh><mesh position={[0, -0.49, -0.08]}><boxGeometry args={[0.23, 0.12, 0.37]} /><meshStandardMaterial color="#171c23" roughness={0.84} /></mesh></group>)}
  </group>;
}

function ClueModel({ clue, index, found, nearest, held, playerPosition, onInspect }: { clue: WorkshopClue; index: number; found: boolean; nearest: boolean; held: boolean; playerPosition: MutableRefObject<THREE.Vector3>; onInspect: () => void }) {
  const marker = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const heldAmount = useRef(0);
  const basePosition = useMemo(() => new THREE.Vector3(...clue.position), [clue.position]);
  const handPosition = useRef(new THREE.Vector3());
  const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(({ clock }, delta) => {
    if (marker.current) marker.current.position.y = 1.5 + Math.sin(clock.elapsedTime * 2.1 + index) * 0.13;
    heldAmount.current = THREE.MathUtils.damp(heldAmount.current, held ? 1 : 0, held ? 4.4 : 5.5, delta);
    if (!root.current) return;
    if (heldAmount.current > 0.001) {
      const player = playerPosition.current;
      const dx = clue.position[0] - player.x;
      const dz = clue.position[2] - player.z;
      const yaw = Math.atan2(-dx, -dz);
      handPosition.current.set(0.42, 1.03, -0.48).applyAxisAngle(upAxis, yaw).add(player);
      root.current.position.lerpVectors(basePosition, handPosition.current, heldAmount.current);
    } else root.current.position.copy(basePosition);
    const pulse = !found && nearest && !held ? 1.04 + Math.sin(clock.elapsedTime * 5) * 0.018 : 1;
    root.current.scale.setScalar(pulse * (1 - heldAmount.current * 0.34));
  });
  const accent = clue.physical ? '#38bdf8' : '#c084fc';
  return (
    <group ref={root} position={clue.position} onClick={(event) => { event.stopPropagation(); if (!found && nearest && !held) onInspect(); }}>
      <Suspense fallback={null}><group>{renderItem(clue.model)}</group></Suspense>
      {!found && !held && <>
        <mesh position={[0, -clue.position[1] + 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.48, 0.59, 32]} /><meshBasicMaterial color={nearest ? '#fbbf24' : accent} transparent opacity={nearest ? 0.85 : 0.5} side={THREE.DoubleSide} /></mesh>
        <group ref={marker}><mesh><octahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} /></mesh><Html position={[0, 0.34, 0]} center distanceFactor={9}><span className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-extrabold shadow-lg ${nearest ? 'border-amber-200 bg-amber-300 text-slate-950' : 'border-white/20 bg-slate-950/85 text-white'}`}>{nearest ? 'E · ตรวจดู' : `หลักฐาน ${String(index + 1).padStart(2, '0')}`}</span></Html></group>
      </>}
      {found && <group position={[0, 1.6, 0]}><mesh><torusGeometry args={[0.18, 0.035, 8, 22]} /><meshBasicMaterial color="#34d399" /></mesh></group>}
    </group>
  );
}

function renderItem(model: WorkshopClue['model']) {
  const metal = <meshStandardMaterial color="#64748b" metalness={0.72} roughness={0.3} />;
  switch (model) {
    case 'monitor': return <AssetModel src="/models/mission1/monitor.glb" scale={2.1} />;
    case 'keyboard': return <AssetModel src="/models/mission1/keyboard.glb" scale={2.25} rotation={Math.PI} />;
    case 'mouse': return <AssetModel src="/models/mission1/mouse.glb" scale={2.5} />;
    case 'ram': return <group rotation={[0.03, 0.08, 0.015]}><RoundedBox args={[0.72, 0.105, 0.024]} radius={0.012} castShadow><meshStandardMaterial color="#12382f" metalness={0.3} roughness={0.48} /></RoundedBox>{[-0.24, -0.08, 0.08, 0.24].map((x) => <RoundedBox key={x} args={[0.105, 0.067, 0.018]} radius={0.007} position={[x, 0.005, 0.021]} castShadow><meshStandardMaterial color="#15191d" metalness={0.48} roughness={0.3} /></RoundedBox>)}{Array.from({ length: 12 }, (_, index) => <mesh key={index} position={[-0.33 + index * 0.06, -0.064, 0.004]}><boxGeometry args={[0.025, 0.018, 0.008]} /><meshStandardMaterial color="#c59c45" metalness={0.82} roughness={0.26} /></mesh>)}</group>;
    case 'ssd': return <AssetModel src="/models/mission1/external-ssd.glb" scale={2.5} rotation={0.25} />;
    case 'browser': return <group><mesh><boxGeometry args={[0.56, 0.62, 0.06]} /><meshBasicMaterial color="#a855f7" transparent opacity={0.25} /></mesh><mesh position={[0, 0, 0.04]}><planeGeometry args={[0.45, 0.5]} /><meshBasicMaterial color="#7e22ce" transparent opacity={0.68} /></mesh><mesh position={[0, 0.19, 0.05]}><circleGeometry args={[0.035, 12]} /><meshBasicMaterial color="#fda4af" /></mesh></group>;
    case 'file': return <group rotation={[0.1, 0.1, 0]}><mesh><planeGeometry args={[0.8, 0.98]} /><meshBasicMaterial color="#7c3aed" transparent opacity={0.14} side={THREE.DoubleSide} /></mesh><mesh position={[0, 0.1, 0.015]}><planeGeometry args={[0.45, 0.57]} /><meshBasicMaterial color="#e9d5ff" transparent opacity={0.68} side={THREE.DoubleSide} /></mesh><mesh position={[0.02, 0.25, 0.026]}><boxGeometry args={[0.24, 0.025, 0.01]} /><meshBasicMaterial color="#7e22ce" /></mesh><mesh position={[0.02, 0.14, 0.026]}><boxGeometry args={[0.31, 0.02, 0.01]} /><meshBasicMaterial color="#9333ea" /></mesh><mesh position={[0.02, 0.05, 0.026]}><boxGeometry args={[0.26, 0.02, 0.01]} /><meshBasicMaterial color="#9333ea" /></mesh><mesh position={[0.02, -0.04, 0.026]}><boxGeometry args={[0.33, 0.02, 0.01]} /><meshBasicMaterial color="#9333ea" /></mesh></group>;
    case 'os': return <group><mesh><planeGeometry args={[1.05, 0.76]} /><meshBasicMaterial color="#6d28d9" transparent opacity={0.16} side={THREE.DoubleSide} /></mesh><mesh position={[0, 0, 0.015]}><planeGeometry args={[0.9, 0.62]} /><meshBasicMaterial color="#1e1b4b" transparent opacity={0.62} side={THREE.DoubleSide} /></mesh><mesh position={[-0.31, 0.19, 0.03]}><circleGeometry args={[0.04, 12]} /><meshBasicMaterial color="#c084fc" /></mesh>{[-1, 1].flatMap((x) => [-1, 1].map((y) => <mesh key={`${x}-${y}`} position={[x * 0.16, y * 0.13 - 0.04, 0.04]}><planeGeometry args={[0.24, 0.19]} /><meshBasicMaterial color={x === y ? '#a78bfa' : '#7c3aed'} transparent opacity={0.85} side={THREE.DoubleSide} /></mesh>))}<mesh position={[0.36, -0.26, 0.035]}><boxGeometry args={[0.2, 0.025, 0.01]} /><meshBasicMaterial color="#ddd6fe" /></mesh></group>;
  }
}
