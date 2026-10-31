import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CATEGORY_LABELS, CATEGORY_ORDER, PARTS, type Build, type BuildIssue, type PartCategory, type PcPart } from '../game/pcBuilder';

const SLOT_POSITIONS: Record<PartCategory, [number, number, number]> = {
  case: [0, 0, -0.3],
  motherboard: [-0.85, 0.15, 0.6],
  cpu: [-1.47, 0.57, 0.84],
  ram: [-0.5, 0.68, 0.86],
  gpu: [-0.15, -0.82, 1.18],
  storage: [1.85, 0.76, 0.78],
  psu: [1.9, -1.08, 0.62],
  cooler: [-1.47, 0.57, 1.28],
};

interface SceneProps {
  build: Build;
  selectedId: string | null;
  issues: BuildIssue[];
  caseOpen?: boolean;
  disabled?: boolean;
  onInstall: (category: PartCategory, partId: string) => void;
  onBusyChange?: (busy: boolean) => void;
  installRequest?: { partId: string; nonce: number } | null;
  onInstallRequestConsumed?: () => void;
}

export function BuilderScene3D(props: SceneProps) {
  return (
    <div className="relative isolate h-[560px] w-full overflow-hidden rounded-[1.75rem] bg-[#050912] sm:h-[620px]" role="group" aria-label="โต๊ะประกอบคอมสามมิติ ใช้เมาส์หรือนิ้วลากเพื่อเปลี่ยนมุมมอง">
      <Canvas
        aria-hidden="true"
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [0.5, 0.8, 10.8], fov: 52, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <color attach="background" args={['#050912']} />
        <fog attach="fog" args={['#050912', 12, 25]} />
        <ambientLight intensity={0.42} />
        <hemisphereLight args={['#dbeafe', '#101827', 1.05]} />
        <directionalLight castShadow position={[5, 8, 8]} intensity={3.2} color="#fff7ed" shadow-mapSize={[2048, 2048]} shadow-bias={-0.00025} shadow-normalBias={0.035} />
        <pointLight position={[-5, 2, 5]} intensity={35} distance={12} color="#22d3ee" />
        <pointLight position={[5, 1, 3]} intensity={24} distance={10} color="#fb7185" />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={3.5} position={[0, 5, -4]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={2.2} position={[5, 1, 4]} rotation={[0, -0.8, 0]} scale={[4, 5, 1]} />
          <Lightformer intensity={1.4} position={[-5, 0, 3]} rotation={[0, 0.8, 0]} scale={[3, 4, 1]} color="#67e8f9" />
        </Environment>
        <Workshop {...props} />
        <AdaptiveCamera />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          target={[0.45, 0, 0]}
          minDistance={8.5}
          maxDistance={12}
          minAzimuthAngle={-0.42}
          maxAzimuthAngle={0.42}
          minPolarAngle={1.12}
          maxPolarAngle={1.62}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,.48)_100%)]" />
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md" role="status" aria-live="polite">
        {props.selectedId ? 'กำลังถือ ' + (PARTS.find((part) => part.id === props.selectedId)?.name ?? '') : 'เลือกอะไหล่จากคลังด้านซ้าย'}
      </div>
    </div>
  );
}

function Workshop(props: SceneProps) {
  const selected = PARTS.find((part) => part.id === props.selectedId) ?? null;
  const [installing, setInstalling] = useState<{ part: PcPart; category: PartCategory; nonce: number } | null>(null);

  useEffect(() => {
    props.onBusyChange?.(!!installing);
    return () => props.onBusyChange?.(false);
  }, [installing, props.onBusyChange]);

  function beginInstall(category: PartCategory, requestedPart = selected) {
    if (!requestedPart || requestedPart.category !== category || installing || props.disabled) return;
    setInstalling({ part: requestedPart, category, nonce: Date.now() });
  }

  useEffect(() => {
    if (!props.installRequest || installing || props.disabled) return;
    const requestedPart = PARTS.find((part) => part.id === props.installRequest?.partId);
    if (!requestedPart) return;
    beginInstall(requestedPart.category, requestedPart);
    props.onInstallRequestConsumed?.();
  }, [props.installRequest?.nonce]);

  return (
    <>
      <Workbench />
      <ComputerCase installed={!!props.build.case && installing?.category !== 'case'} color={props.build.case?.color} open={props.caseOpen ?? true} onClick={() => beginInstall('case')} active={selected?.category === 'case' && !installing && !props.disabled} />
      {CATEGORY_ORDER.filter((category) => category !== 'case').map((category) => (
        <Slot3D
          key={category}
          category={category}
          part={installing?.category === category ? undefined : props.build[category]}
          active={selected?.category === category && !installing}
          invalid={props.issues.some((issue) => issue.severity === 'block' && issue.categories.includes(category))}
          disabled={!!installing || !!props.disabled}
          onInstall={() => beginInstall(category)}
        />
      ))}
      <EasyInstallSurface active={!!selected && !installing && !props.disabled} label={selected ? CATEGORY_LABELS[selected.category].th : ''} onInstall={() => selected && beginInstall(selected.category)} />
      {!installing && <FirstPersonHands selected={selected} />}
      {installing && (
        <InstallSequence
          key={installing.nonce}
          part={installing.part}
          target={SLOT_POSITIONS[installing.category]}
          onDone={() => {
            props.onInstall(installing.category, installing.part.id);
            setInstalling(null);
          }}
        />
      )}
      <ContactShadows position={[0, -2.17, 0]} opacity={0.42} scale={16} blur={2.6} far={6} frames={1} resolution={512} />
    </>
  );
}

function EasyInstallSurface({ active, label, onInstall }: { active: boolean; label: string; onInstall: () => void }) {
  const [hovered, setHovered] = useState(false);
  useCursor(active && hovered);
  if (!active) return null;
  return (
    <group position={[0, 0, 1.82]}>
      <mesh onClick={(event) => { event.stopPropagation(); onInstall(); }} onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
        <planeGeometry args={[6.15, 4.05]} />
        <meshBasicMaterial color="#34d399" transparent opacity={hovered ? 0.1 : 0.025} depthWrite={false} />
      </mesh>
      <Html position={[0, 1.72, 0.03]} center zIndexRange={[1, 0]}><SceneLabel tone="cyan">แตะบริเวณเคสเพื่อใส่ {label}</SceneLabel></Html>
    </group>
  );
}

function Workbench() {
  return (
    <group>
      <RoundedBox args={[13, 0.45, 6]} radius={0.18} position={[0, -2.45, 0]} receiveShadow>
        <meshStandardMaterial color="#182235" roughness={0.78} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, -2.2, 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12.2, 5.2]} />
        <meshStandardMaterial color="#0b1220" roughness={0.9} />
      </mesh>
      {[-5.7, 5.7].map((x) => <mesh key={x} position={[x, -1.95, -1.8]}><boxGeometry args={[0.08, 0.08, 1.4]} /><meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={2} /></mesh>)}
    </group>
  );
}

function ComputerCase({ installed, color, active, open, onClick }: { installed: boolean; color?: string; active: boolean; open: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && active);
  const frameColor = installed ? color ?? '#64748b' : active ? '#22d3ee' : '#64748b';
  return (
    <group onClick={active ? (event) => { event.stopPropagation(); setHovered(false); onClick(); } : undefined} onPointerOver={active ? (event) => { event.stopPropagation(); setHovered(true); } : undefined} onPointerOut={active ? () => setHovered(false) : undefined}>
      <mesh position={[0, 0, -0.55]} receiveShadow><boxGeometry args={[6.5, 4.6, 0.22]} /><meshStandardMaterial color="#121b2b" metalness={0.6} roughness={0.42} /></mesh>
      <FramePiece position={[0, 2.18, 0]} size={[6.65, 0.22, 1.65]} color={frameColor} glow={active || hovered} />
      <FramePiece position={[0, -2.18, 0]} size={[6.65, 0.22, 1.65]} color={frameColor} glow={active || hovered} />
      <FramePiece position={[-3.22, 0, 0]} size={[0.22, 4.55, 1.65]} color={frameColor} glow={active || hovered} />
      <FramePiece position={[3.22, 0, 0]} size={[0.22, 4.55, 1.65]} color={frameColor} glow={active || hovered} />
      {!open && <group position={[0, 0, 0.82]}>
        <mesh><boxGeometry args={[6.08, 4.05, 0.075]} /><meshPhysicalMaterial color="#8ca9b8" metalness={0.48} roughness={0.22} transmission={0.32} thickness={0.08} transparent opacity={0.78} /></mesh>
        {[[-2.82, -1.78], [2.82, -1.78], [-2.82, 1.78], [2.82, 1.78]].map(([x, y], index) => <mesh key={index} position={[x, y, 0.052]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.075, 0.075, 0.045, 12]} /><meshStandardMaterial color="#d3dbe1" metalness={0.92} roughness={0.22} /></mesh>)}
      </group>}
      {!installed && <mesh position={[0, 0, 0.15]}><boxGeometry args={[6.2, 4.15, 1.2]} /><meshBasicMaterial color={active ? '#22d3ee' : '#475569'} transparent opacity={active ? 0.11 : 0.045} wireframe /></mesh>}
      {(active || hovered) && <Html position={[0, 2.65, 0]} center zIndexRange={[1, 0]}><SceneLabel tone="cyan">ติดตั้งเคส</SceneLabel></Html>}
    </group>
  );
}

function FramePiece({ position, size, color, glow }: { position: [number, number, number]; size: [number, number, number]; color: string; glow: boolean }) {
  return <mesh position={position} castShadow><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={0.72} roughness={0.28} emissive={glow ? color : '#000000'} emissiveIntensity={glow ? 0.55 : 0} /></mesh>;
}

function Slot3D({ category, part, active, invalid, disabled, onInstall }: { category: PartCategory; part?: PcPart; active: boolean; invalid: boolean; disabled: boolean; onInstall: () => void }) {
  const [hovered, setHovered] = useState(false);
  const position = SLOT_POSITIONS[category];
  useCursor(hovered && !disabled);
  return (
    <group position={position}>
      {part && <PartModel part={part} invalid={invalid} />}
      <mesh
        visible={!part || active || hovered}
        raycast={active && !disabled ? undefined : () => null}
        onClick={(event) => { event.stopPropagation(); setHovered(false); if (active && !disabled) onInstall(); }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={slotSize(category)} />
        <meshStandardMaterial color={part ? '#fb7185' : '#164e63'} emissive={part ? '#e11d48' : '#0891b2'} emissiveIntensity={active || hovered ? 1.2 : 0.28} transparent opacity={part ? 0.08 : active ? 0.32 : 0.24} wireframe={active} />
      </mesh>
      {(!part || active || hovered) && <Html position={[0, category === 'gpu' ? 0.65 : 0.7, 0.45]} center zIndexRange={[1, 0]}><SceneLabel tone={active ? 'cyan' : 'slate'}>{active ? (part ? 'เปลี่ยน ' + CATEGORY_LABELS[category].th : 'ใส่ ' + CATEGORY_LABELS[category].th) : CATEGORY_LABELS[category].en}</SceneLabel></Html>}
    </group>
  );
}

function PartModel({ part, invalid = false }: { part: PcPart; invalid?: boolean }) {
  const color = invalid ? '#fb7185' : part.color;
  switch (part.category) {
    case 'motherboard': return <group scale={[1, part.formFactor === 'ATX' ? 1.07 : 0.92, 1]}><MotherboardModel color={color} invalid={invalid} /></group>;
    case 'cpu': return <CpuModel color={color} invalid={invalid} />;
    case 'ram': return <RamModel color={color} invalid={invalid} modules={(part.capacityGb ?? 0) >= 64 ? 4 : 2} />;
    case 'gpu': return <group scale={[THREE.MathUtils.clamp((part.length ?? 270) / 280, 0.88, 1.1), 1, 1]}><GpuModel color={color} invalid={invalid} /></group>;
    case 'storage': return <StorageModel color={color} invalid={invalid} />;
    case 'psu': return <PsuModel color={color} invalid={invalid} />;
    case 'cooler': return part.id === 'cool-liquid' ? <AioCoolerModel color={color} invalid={invalid} /> : <CoolerModel color={color} invalid={invalid} />;
    case 'case': return <CasePartModel color={color} invalid={invalid} />;
  }
}

function MotherboardModel({ color, invalid }: ModelProps) {
  return <group>
    <RoundedBox args={[3, 2.55, 0.16]} radius={0.07} castShadow><meshPhysicalMaterial color={invalid ? '#4c0519' : '#0b302a'} roughness={0.48} metalness={0.18} clearcoat={0.45} clearcoatRoughness={0.55} /></RoundedBox>
    {[-1.22, -0.72, -0.15, 0.46, 1.05].map((x, i) => <mesh key={'trace' + x} position={[x, -0.25 + (i % 2) * 0.45, 0.095]}><boxGeometry args={[0.018, 1.75 - i * 0.12, 0.012]} /><meshStandardMaterial color="#b89b4f" metalness={0.85} roughness={0.34} /></mesh>)}
    <group position={[-0.62, 0.42, 0.15]}><RoundedBox args={[0.82, 0.82, 0.12]} radius={0.035}><meshStandardMaterial color="#9ca3af" metalness={0.95} roughness={0.22} /></RoundedBox><mesh position={[0, 0, 0.075]}><boxGeometry args={[0.58, 0.58, 0.025]} /><meshStandardMaterial color="#111827" metalness={0.55} /></mesh></group>
    {[-0.03, 0.16, 0.35, 0.54].map((x) => <group key={x} position={[x, 0.54, 0.15]}><mesh><boxGeometry args={[0.1, 1.15, 0.12]} /><meshStandardMaterial color="#111827" roughness={0.34} /></mesh><mesh position={[0, 0.58, 0.01]}><boxGeometry args={[0.08, 0.05, 0.14]} /><meshStandardMaterial color="#e5e7eb" metalness={0.8} /></mesh></group>)}
    {[-0.72, -0.25, 0.32].map((y, i) => <mesh key={y} position={[0.32 + i * 0.18, y - 0.72, 0.16]}><boxGeometry args={[1.55 - i * 0.25, 0.12, 0.11]} /><meshStandardMaterial color={i === 0 ? '#d4af37' : '#111827'} metalness={0.62} roughness={0.3} /></mesh>)}
    {[-1.24, -1.04, -0.84, -0.64, 0.72, 0.94].map((x, i) => <mesh key={'cap' + i} position={[x, 0.98 - (i % 3) * 0.2, 0.19]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.065, 0.065, 0.16, 12]} /><meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.3} /></mesh>)}
    <RoundedBox args={[0.54, 0.48, 0.22]} radius={0.04} position={[0.95, -0.76, 0.18]}><meshStandardMaterial color={color} metalness={0.78} roughness={0.24} emissive={invalid ? '#be123c' : '#000'} emissiveIntensity={invalid ? 0.7 : 0} /></RoundedBox>
    <RoundedBox args={[0.64, 0.92, 0.2]} radius={0.04} position={[-1.05, 0.35, 0.18]}><meshStandardMaterial color="#475569" metalness={0.9} roughness={0.23} /></RoundedBox>
    <RoundedBox args={[0.82, 0.38, 0.2]} radius={0.04} position={[-0.62, 0.97, 0.18]}><meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.25} /></RoundedBox>
    <mesh position={[1.36, 0.25, 0.18]}><boxGeometry args={[0.16, 0.82, 0.18]} /><meshStandardMaterial color="#171717" roughness={0.34} /></mesh>
    {[-1.34, 1.34].flatMap((x) => [-1.08, 1.08].map((y) => <group key={x + ':' + y} position={[x, y, 0.12]}><mesh><cylinderGeometry args={[0.085, 0.085, 0.04, 18]} /><meshStandardMaterial color="#d4af37" metalness={0.95} /></mesh><mesh position={[0, 0, 0.025]}><cylinderGeometry args={[0.045, 0.045, 0.05, 18]} /><meshStandardMaterial color="#05080d" /></mesh></group>))}
    {[-1.34, -0.92, -0.5, -0.08, 0.34, 0.76, 1.18].map((x) => <mesh key={'io' + x} position={[x, 1.18, 0.18]}><boxGeometry args={[0.22, 0.22, 0.18]} /><meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.22} /></mesh>)}
  </group>;
}

function CpuModel({ color, invalid }: ModelProps) {
  return <group>
    <RoundedBox args={[0.82, 0.82, 0.08]} radius={0.035} castShadow><meshStandardMaterial color="#164e3f" roughness={0.5} metalness={0.22} /></RoundedBox>
    <RoundedBox args={[0.66, 0.66, 0.12]} radius={0.045} position={[0, 0, 0.09]} castShadow><meshPhysicalMaterial color={invalid ? '#fb7185' : '#c9cdd2'} metalness={0.96} roughness={0.2} clearcoat={0.35} clearcoatRoughness={0.25} /></RoundedBox>
    <mesh position={[0, 0.04, 0.155]}><boxGeometry args={[0.38, 0.026, 0.008]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={[0, -0.03, 0.155]}><boxGeometry args={[0.25, 0.018, 0.008]} /><meshBasicMaterial color="#64748b" /></mesh>
    <mesh position={[-0.3, -0.3, 0.158]} rotation={[0, 0, Math.PI / 4]}><coneGeometry args={[0.045, 0.012, 3]} /><meshBasicMaterial color="#d4af37" /></mesh>
  </group>;
}

function RamModel({ color, invalid, modules }: ModelProps & { modules: 2 | 4 }) {
  return <group>
    {(modules === 4 ? [-0.3, -0.1, 0.1, 0.3] : [-0.17, 0.17]).map((x) => <group key={x} position={[x, 0, 0]}>
      <RoundedBox args={[0.22, 1.55, 0.09]} radius={0.025} castShadow><meshStandardMaterial color="#0f3b32" roughness={0.46} /></RoundedBox>
      {[-0.52, -0.18, 0.18, 0.52].map((y) => <mesh key={y} position={[0, y, 0.075]}><boxGeometry args={[0.16, 0.22, 0.05]} /><meshStandardMaterial color="#080b10" roughness={0.38} /></mesh>)}
      <mesh position={[0, 0, 0.12]}><boxGeometry args={[0.25, 1.3, 0.055]} /><meshPhysicalMaterial color={invalid ? '#fb7185' : color} metalness={0.82} roughness={0.24} clearcoat={0.5} /></mesh>
      <mesh position={[0, 0, 0.16]}><boxGeometry args={[0.27, 0.07, 0.04]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} /></mesh>
      {[-0.54, -0.38, -0.22, -0.06, 0.1, 0.26, 0.42, 0.58].map((y) => <mesh key={'gold' + y} position={[0, y, -0.065]}><boxGeometry args={[0.17, 0.06, 0.02]} /><meshStandardMaterial color="#d6b85c" metalness={0.9} roughness={0.25} /></mesh>)}
    </group>)}
  </group>;
}

function GpuModel({ color, invalid }: ModelProps) {
  return <group>
    <RoundedBox args={[3.25, 0.78, 0.46]} radius={0.11} castShadow><meshPhysicalMaterial color={invalid ? '#4c0519' : '#111827'} metalness={0.72} roughness={0.25} clearcoat={0.65} clearcoatRoughness={0.28} /></RoundedBox>
    <mesh position={[0, 0, -0.27]}><boxGeometry args={[3.05, 0.62, 0.08]} /><meshStandardMaterial color={color} metalness={0.82} roughness={0.26} /></mesh>
    {Array.from({ length: 14 }, (_, i) => <mesh key={'fin' + i} position={[-1.3 + i * 0.2, 0, 0.12]}><boxGeometry args={[0.035, 0.62, 0.18]} /><meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} /></mesh>)}
    {[-0.88, 0, 0.88].map((x) => <DetailedFan key={x} position={[x, 0, 0.27]} scale={0.58} accent={color} />)}
    <mesh position={[0, -0.43, -0.02]}><boxGeometry args={[2.55, 0.075, 0.18]} /><meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.23} /></mesh>
    <mesh position={[-1.66, 0, 0]}><boxGeometry args={[0.1, 1.05, 0.62]} /><meshStandardMaterial color="#a8afb8" metalness={0.98} roughness={0.18} /></mesh>
    {[0.98, 1.18].map((x) => <mesh key={x} position={[x, 0.43, 0]}><boxGeometry args={[0.14, 0.12, 0.22]} /><meshStandardMaterial color="#080b10" /></mesh>)}
  </group>;
}

function StorageModel({ color, invalid }: ModelProps) {
  return <group>
    <RoundedBox args={[1.42, 0.62, 0.08]} radius={0.035} castShadow><meshStandardMaterial color="#123c32" roughness={0.5} /></RoundedBox>
    {[-0.44, -0.08, 0.28].map((x, i) => <RoundedBox key={x} args={[0.26, 0.38, 0.1]} radius={0.025} position={[x, 0, 0.09]}><meshStandardMaterial color={i === 2 ? '#202631' : '#05080d'} roughness={0.32} /></RoundedBox>)}
    <mesh position={[0.5, 0, 0.1]}><boxGeometry args={[0.2, 0.44, 0.08]} /><meshPhysicalMaterial color={invalid ? '#fb7185' : color} roughness={0.28} clearcoat={0.42} /></mesh>
    {[-0.23, -0.12, -0.01, 0.1, 0.21].map((y) => <mesh key={y} position={[0.71, y, 0]}><boxGeometry args={[0.08, 0.065, 0.04]} /><meshStandardMaterial color="#d6b85c" metalness={0.92} /></mesh>)}
  </group>;
}

function PsuModel({ color, invalid }: ModelProps) {
  return <group>
    <RoundedBox args={[1.48, 1.22, 1.02]} radius={0.08} castShadow><meshPhysicalMaterial color={invalid ? '#4c0519' : '#171b22'} metalness={0.88} roughness={0.3} clearcoat={0.22} /></RoundedBox>
    <DetailedFan position={[0, 0, 0.53]} scale={0.8} accent={color} />
    {[[-0.45, -0.42], [0, -0.42], [0.45, -0.42]].map(([x, y]) => <mesh key={x} position={[x, y, 0.54]}><boxGeometry args={[0.25, 0.15, 0.05]} /><meshStandardMaterial color="#05080d" /></mesh>)}
    <mesh position={[0, 0.5, 0.54]}><boxGeometry args={[0.72, 0.12, 0.045]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>
    <mesh position={[0.52, 0.23, 0.55]}><boxGeometry args={[0.32, 0.2, 0.06]} /><meshStandardMaterial color="#030712" roughness={0.4} /></mesh>
    <mesh position={[0.52, 0.23, 0.59]}><boxGeometry args={[0.18, 0.1, 0.025]} /><meshStandardMaterial color="#94a3b8" metalness={0.9} /></mesh>
  </group>;
}

function CoolerModel({ color, invalid }: ModelProps) {
  return <group>
    {Array.from({ length: 13 }, (_, i) => <mesh key={i} position={[0, 0, -0.3 + i * 0.05]}><boxGeometry args={[1.24, 1.18, 0.025]} /><meshStandardMaterial color="#bac3cc" metalness={0.95} roughness={0.22} /></mesh>)}
    {[-0.38, -0.13, 0.13, 0.38].map((x) => <mesh key={x} position={[x, -0.56, 0]}><cylinderGeometry args={[0.055, 0.055, 1.28, 12]} /><meshStandardMaterial color="#b87333" metalness={0.98} roughness={0.23} /></mesh>)}
    <DetailedFan position={[0, 0, 0.4]} scale={0.88} accent={invalid ? '#fb7185' : color} />
    <RoundedBox args={[0.74, 0.18, 0.52]} radius={0.04} position={[0, -0.66, -0.02]}><meshStandardMaterial color="#b87333" metalness={0.95} roughness={0.2} /></RoundedBox>
  </group>;
}

function AioCoolerModel({ color, invalid }: ModelProps) {
  const tubes = useMemo(() => [
    new THREE.CatmullRomCurve3([new THREE.Vector3(-0.28, -0.35, 0), new THREE.Vector3(-0.7, -0.7, 0.1), new THREE.Vector3(-1.05, -0.55, 0.08)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(0.28, -0.35, 0), new THREE.Vector3(0.72, -0.72, -0.08), new THREE.Vector3(1.05, -0.55, 0.04)]),
  ], []);
  return <group>
    <RoundedBox args={[2.5, 0.9, 0.2]} radius={0.08} position={[0, -0.72, -0.08]} castShadow><meshStandardMaterial color="#202733" metalness={0.78} roughness={0.32} /></RoundedBox>
    {[-0.62, 0.62].map((x) => <DetailedFan key={x} position={[x, -0.72, 0.08]} scale={0.58} accent={color} />)}
    <mesh castShadow><cylinderGeometry args={[0.46, 0.5, 0.22, 32]} /><meshPhysicalMaterial color={invalid ? '#4c0519' : '#111827'} metalness={0.72} roughness={0.22} clearcoat={0.72} /></mesh>
    <mesh position={[0, 0, 0.14]}><cylinderGeometry args={[0.31, 0.31, 0.05, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} metalness={0.45} /></mesh>
    {tubes.map((curve, index) => <mesh key={index}><tubeGeometry args={[curve, 22, 0.055, 10, false]} /><meshStandardMaterial color="#080b10" roughness={0.72} /></mesh>)}
  </group>;
}

function CasePartModel({ color, invalid }: ModelProps) {
  return <group>
    <RoundedBox args={[2.2, 2.8, 1.35]} radius={0.12} castShadow><meshPhysicalMaterial color={invalid ? '#4c0519' : '#111827'} metalness={0.78} roughness={0.28} clearcoat={0.35} /></RoundedBox>
    <mesh position={[0, 0, 0.69]}><planeGeometry args={[1.86, 2.44]} /><meshPhysicalMaterial color="#bdefff" transmission={0.72} thickness={0.12} ior={1.46} transparent opacity={0.42} roughness={0.08} /></mesh>
    {[-0.68, 0, 0.68].map((y) => <DetailedFan key={y} position={[-0.89, y, 0.22]} scale={0.36} accent={color} />)}
    <mesh position={[0.9, -0.78, 0.18]}><boxGeometry args={[0.12, 0.55, 0.7]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} /></mesh>
  </group>;
}

type ModelProps = { color: string; invalid: boolean };

function DetailedFan({ position = [0, 0, 0], scale = 1, accent = '#67e8f9' }: { position?: [number, number, number]; scale?: number; accent?: string }) {
  return <group position={position} scale={scale}>
    <mesh><torusGeometry args={[0.5, 0.065, 10, 40]} /><meshStandardMaterial color="#111827" metalness={0.72} roughness={0.3} /></mesh>
    <group>{Array.from({ length: 9 }, (_, index) => <group key={index} rotation={[0, 0, index * Math.PI * 2 / 9]}><mesh position={[0.27, 0, 0]} rotation={[0.12, 0.4, -0.18]} scale={[1, 1.3, 0.42]}><capsuleGeometry args={[0.085, 0.31, 4, 10]} /><meshPhysicalMaterial color="#b8c2cc" metalness={0.38} roughness={0.3} clearcoat={0.4} /></mesh></group>)}</group>
    {[0.31, 0.4].map((radius) => <mesh key={radius} position={[0, 0, 0.065]}><torusGeometry args={[radius, 0.012, 6, 40]} /><meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.25} /></mesh>)}
    <mesh position={[0, 0, 0.04]}><cylinderGeometry args={[0.14, 0.14, 0.12, 24]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.75} metalness={0.55} /></mesh>
  </group>;
}

function FirstPersonHands({ selected }: { selected: PcPart | null }) {
  const rig = useRef<THREE.Group>(null);
  const localPosition = useMemo(() => new THREE.Vector3(), []);
  const partScale = selected ? heldScale(selected.category) : 1;
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  useFrame(({ camera, clock }) => {
    if (!rig.current) return;
    const bob = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.4) * 0.025;
    localPosition.set(0, -1.12 + bob, -3.15).applyQuaternion(camera.quaternion);
    rig.current.position.copy(camera.position).add(localPosition);
    rig.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={rig}>
      <Hand side="left" pose={selected ? 'hold' : 'relaxed'} position={[-0.82, -0.12, 0]} rotation={[0.12, -0.1, -0.18]} />
      <Hand side="right" pose={selected ? 'hold' : 'relaxed'} position={[0.82, -0.12, 0]} rotation={[0.12, 0.1, 0.18]} />
      {selected && <group scale={partScale} position={[0, 0.52, -0.28]} rotation={[0.25, 0, 0]}><PartModel part={selected} /></group>}
    </group>
  );
}

function AdaptiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const portrait = size.width / size.height < 0.8;
    camera.fov = portrait ? 70 : 52;
    camera.position.z = portrait ? 14 : 10.8;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

type HandPose = 'open' | 'relaxed' | 'hold' | 'press';

function Hand({ side, pose, ...props }: { side: 'left' | 'right'; pose: HandPose; position: [number, number, number]; rotation: [number, number, number] }) {
  const mirror = side === 'left' ? -1 : 1;
  return (
    <group {...props} scale={[mirror, 1, 1]}>
      <mesh position={[0, -0.52, -0.03]}><cylinderGeometry args={[0.25, 0.33, 0.86, 14]} /><meshStandardMaterial color="#121820" roughness={0.88} /></mesh>
      <mesh position={[0, -0.31, 0]}><torusGeometry args={[0.31, 0.055, 10, 20]} /><meshStandardMaterial color="#334155" metalness={0.5} roughness={0.45} /></mesh>
      <RoundedBox args={[0.76, 0.72, 0.28]} radius={0.2}><meshPhysicalMaterial color="#d89562" roughness={0.58} sheen={0.22} sheenColor="#ffd6bd" /></RoundedBox>
      <mesh position={[0, 0.04, 0.16]} scale={[0.75, 0.78, 0.35]}><sphereGeometry args={[0.42, 16, 10]} /><meshPhysicalMaterial color="#e5a06d" roughness={0.6} sheen={0.18} sheenColor="#ffd6bd" /></mesh>
      {[-0.27, -0.09, 0.09, 0.27].map((x, index) => <Finger key={x} x={x} index={index} pose={pose} />)}
      <group position={[0.39, -0.03, 0]} rotation={[0, 0, -0.78]}><Finger x={0} index={4} pose={pose} thumb /></group>
    </group>
  );
}

function Finger({ x, index, pose, thumb = false }: { x: number; index: number; pose: HandPose; thumb?: boolean }) {
  const base = useRef<THREE.Group>(null);
  const middle = useRef<THREE.Group>(null);
  const tip = useRef<THREE.Group>(null);
  const lengths = thumb ? [0.23, 0.18, 0.12] : [0.3 - index * 0.012, 0.23 - index * 0.009, 0.17 - index * 0.006];
  const target = fingerCurl(pose, index, thumb);
  useFrame((_, delta) => {
    if (base.current) base.current.rotation.x = THREE.MathUtils.damp(base.current.rotation.x, target[0], 12, delta);
    if (middle.current) middle.current.rotation.x = THREE.MathUtils.damp(middle.current.rotation.x, target[1], 14, delta);
    if (tip.current) tip.current.rotation.x = THREE.MathUtils.damp(tip.current.rotation.x, target[2], 16, delta);
  });
  const skin = '#dc9866';
  return <group ref={base} position={[x, thumb ? 0 : 0.34 - Math.abs(x) * 0.07, -0.01]} rotation={[0, 0, thumb ? 0 : x * 0.16]}>
    <FingerBone length={lengths[0]} radius={thumb ? 0.085 : 0.072} color={skin} />
    <group ref={middle} position={[0, lengths[0], 0]}>
      <Knuckle radius={thumb ? 0.09 : 0.078} color={skin} />
      <FingerBone length={lengths[1]} radius={thumb ? 0.077 : 0.064} color={skin} />
      <group ref={tip} position={[0, lengths[1], 0]}>
        <Knuckle radius={thumb ? 0.078 : 0.067} color={skin} />
        <FingerBone length={lengths[2]} radius={thumb ? 0.07 : 0.057} color={skin} nail />
      </group>
    </group>
  </group>;
}

function FingerBone({ length, radius, color, nail }: { length: number; radius: number; color: string; nail?: boolean }) {
  return <group><mesh position={[0, length / 2, 0]}><capsuleGeometry args={[radius, Math.max(0.03, length - radius * 2), 5, 10]} /><meshPhysicalMaterial color={color} roughness={0.57} sheen={0.2} sheenColor="#ffd6bd" /></mesh>{nail && <mesh position={[0, length * 0.72, radius * 0.88]} scale={[1, 1.45, 0.22]}><sphereGeometry args={[radius * 0.62, 10, 6]} /><meshPhysicalMaterial color="#f7c7b4" roughness={0.42} clearcoat={0.3} /></mesh>}</group>;
}

function Knuckle({ radius, color }: { radius: number; color: string }) {
  return <mesh><sphereGeometry args={[radius, 12, 8]} /><meshPhysicalMaterial color={color} roughness={0.6} sheen={0.18} sheenColor="#ffd6bd" /></mesh>;
}

function fingerCurl(pose: HandPose, index: number, thumb: boolean): [number, number, number] {
  if (pose === 'open') return [-0.03, -0.02, -0.01];
  if (pose === 'relaxed') return [-0.16 - index * 0.02, -0.24 - index * 0.025, -0.12];
  if (pose === 'press') return index < 2 && !thumb ? [-0.12, -0.16, -0.08] : [-0.52, -0.7, -0.4];
  return thumb ? [-0.72, -0.92, -0.52] : [-0.58 - index * 0.04, -0.88 - index * 0.035, -0.5];
}

function InstallSequence({ part, target, onDone }: { part: PcPart; target: [number, number, number]; onDone: () => void }) {
  const group = useRef<THREE.Group>(null);
  const hands = useRef<THREE.Group>(null);
  const partGroup = useRef<THREE.Group>(null);
  const started = useRef<number | null>(null);
  const capturedStart = useRef<THREE.Vector3 | null>(null);
  const done = useRef(false);
  const [pose, setPose] = useState<HandPose>('hold');
  const poseRef = useRef<HandPose>('hold');
  const end = useMemo(() => new THREE.Vector3(...target), [target]);
  const motion = INSTALL_MOTIONS[part.category];
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  useFrame(({ clock, camera }) => {
    if (!group.current) return;
    if (started.current === null) {
      started.current = clock.elapsedTime;
      capturedStart.current = camera.position.clone().add(new THREE.Vector3(0, -1.05, -3.2).applyQuaternion(camera.quaternion));
    }
    const raw = Math.min(1, (clock.elapsedTime - started.current) / (reducedMotion ? 0.08 : motion.duration));
    const frame = sampleInstallMotion(motion, raw, capturedStart.current ?? end, end);
    group.current.position.copy(frame.position);
    group.current.rotation.set(frame.rotation[0], frame.rotation[1], frame.rotation[2]);
    partGroup.current?.scale.setScalar(heldScale(part.category) + (1 - heldScale(part.category)) * smoothStep(raw));
    const release = THREE.MathUtils.clamp((raw - 0.88) / 0.12, 0, 1);
    if (hands.current) hands.current.position.set(0, -release * 0.35, release * 0.72);
    const nextPose: HandPose = raw > 0.9 ? 'open' : raw > motion.pressAt ? 'press' : 'hold';
    if (nextPose !== poseRef.current) { poseRef.current = nextPose; setPose(nextPose); }
    if (raw >= 1 && !done.current) { done.current = true; onDone(); }
  });
  const grip = gripWidth(part.category);
  return <group ref={group}><group ref={hands}><Hand side="left" pose={pose} position={[-grip, -0.25, 0]} rotation={[0.15, -0.08, -0.18]} /><Hand side="right" pose={pose} position={[grip, -0.25, 0]} rotation={[0.15, 0.08, 0.18]} /></group><group ref={partGroup}><PartModel part={part} /></group></group>;
}

type InstallKeyframe = { t: number; offset: [number, number, number]; rotation: [number, number, number] };
type InstallMotion = { duration: number; pressAt: number; keyframes: InstallKeyframe[] };

const INSTALL_MOTIONS: Record<PartCategory, InstallMotion> = {
  case: { duration: 1.18, pressAt: 0.7, keyframes: [{ t: 0.48, offset: [0, 2.1, 1.6], rotation: [0.08, -0.12, 0] }, { t: 0.82, offset: [0, -0.16, 0.08], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  motherboard: { duration: 1.42, pressAt: 0.72, keyframes: [{ t: 0.46, offset: [0, 0.25, 2.1], rotation: [-0.18, 0.08, -0.08] }, { t: 0.78, offset: [0, 0.08, 0.28], rotation: [-0.03, 0, 0] }, { t: 0.92, offset: [0, 0, -0.06], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  cpu: { duration: 1.55, pressAt: 0.76, keyframes: [{ t: 0.5, offset: [0, 0, 1.55], rotation: [0, 0, 0.18] }, { t: 0.76, offset: [0, 0, 0.34], rotation: [0, 0, 0.04] }, { t: 0.93, offset: [0, 0, -0.035], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  ram: { duration: 1.32, pressAt: 0.66, keyframes: [{ t: 0.44, offset: [0, 1.7, 1.25], rotation: [0.14, 0, -0.1] }, { t: 0.72, offset: [0, 0.25, 0.2], rotation: [0.04, 0, 0] }, { t: 0.9, offset: [0, -0.09, 0], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  gpu: { duration: 1.5, pressAt: 0.7, keyframes: [{ t: 0.42, offset: [2.1, 1.05, 1.8], rotation: [-0.12, 0.22, -0.22] }, { t: 0.76, offset: [0.42, 0.25, 0.4], rotation: [-0.04, 0.05, -0.05] }, { t: 0.92, offset: [-0.08, -0.035, 0], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  storage: { duration: 1.48, pressAt: 0.72, keyframes: [{ t: 0.48, offset: [1.25, 0.72, 1.5], rotation: [0, 0, 0.52] }, { t: 0.74, offset: [0.24, 0.13, 0.28], rotation: [0, 0, 0.4] }, { t: 0.92, offset: [0, 0, 0.02], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  psu: { duration: 1.36, pressAt: 0.68, keyframes: [{ t: 0.42, offset: [3.1, 0.15, 1.0], rotation: [0, -0.18, 0] }, { t: 0.8, offset: [0.34, 0, 0.18], rotation: [0, -0.03, 0] }, { t: 0.93, offset: [-0.08, 0, 0], rotation: [0, 0, 0] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
  cooler: { duration: 1.62, pressAt: 0.7, keyframes: [{ t: 0.46, offset: [0.35, 1.75, 1.7], rotation: [0.12, 0, -0.12] }, { t: 0.73, offset: [0.08, 0.24, 0.3], rotation: [0.04, 0, -0.03] }, { t: 0.9, offset: [0, -0.08, 0], rotation: [0, 0, 0.025] }, { t: 1, offset: [0, 0, 0], rotation: [0, 0, 0] }] },
};

function sampleInstallMotion(motion: InstallMotion, t: number, start: THREE.Vector3, target: THREE.Vector3) {
  const points = [{ t: 0, position: start, rotation: [0.12, 0, 0.16] as [number, number, number] }, ...motion.keyframes.map((key) => ({ t: key.t, position: target.clone().add(new THREE.Vector3(...key.offset)), rotation: key.rotation }))];
  const nextIndex = Math.max(1, points.findIndex((point) => point.t >= t));
  const from = points[nextIndex - 1];
  const to = points[nextIndex] ?? points[points.length - 1];
  const local = smoothStep((t - from.t) / Math.max(0.001, to.t - from.t));
  return {
    position: from.position.clone().lerp(to.position, local),
    rotation: from.rotation.map((value, index) => THREE.MathUtils.lerp(value, to.rotation[index], local)) as [number, number, number],
  };
}

function smoothStep(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function gripWidth(category: PartCategory) {
  if (category === 'case') return 1.32;
  if (category === 'gpu' || category === 'motherboard') return 1.16;
  if (category === 'psu' || category === 'cooler') return 0.86;
  return 0.66;
}

function SceneLabel({ children, tone }: { children: React.ReactNode; tone: 'cyan' | 'rose' | 'slate' }) {
  const colors = tone === 'cyan' ? 'border-cyan-300/40 bg-cyan-950/90 text-cyan-100' : tone === 'rose' ? 'border-rose-300/40 bg-rose-950/90 text-rose-100' : 'border-white/15 bg-slate-950/90 text-slate-200';
  return <span className={'pointer-events-none whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] font-bold shadow-xl backdrop-blur-sm ' + colors}>{children}</span>;
}

function useCursor(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = ''; };
  }, [active]);
}

function slotSize(category: PartCategory): [number, number, number] {
  const sizes: Record<PartCategory, [number, number, number]> = {
    case: [6.5, 4.6, 1.4], motherboard: [3.15, 2.7, 0.32], cpu: [0.95, 0.95, 0.42], ram: [0.8, 1.7, 0.45],
    gpu: [3.45, 0.82, 0.62], storage: [1.5, 0.82, 0.4], psu: [1.65, 1.4, 1.2], cooler: [1.6, 1.6, 0.8],
  };
  return sizes[category];
}

function heldScale(category: PartCategory) {
  return category === 'case' ? 0.27 : category === 'motherboard' || category === 'gpu' ? 0.4 : category === 'psu' ? 0.55 : 0.75;
}
