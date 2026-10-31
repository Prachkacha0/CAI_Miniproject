import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Html, OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type DeviceId = 'keyboard' | 'mouse' | 'cpu' | 'ram' | 'ssd' | 'monitor' | 'speaker' | 'router';

const details: Record<DeviceId, { parts: string[]; functions: string[]; colors: string[] }> = {
  keyboard: { parts: ['ฝาครอบ', 'ชุดปุ่มกด', 'แผงวงจรรับคำสั่ง'], functions: ['ปกป้องชิ้นส่วนภายใน', 'แปลงการกดเป็นข้อมูลนำเข้า', 'ส่งคำสั่งไปยังคอมพิวเตอร์'], colors: ['#111827', '#22d3ee', '#34d399'] },
  mouse: { parts: ['เปลือกเมาส์', 'ล้อเลื่อน', 'เซนเซอร์ตรวจจับ'], functions: ['หุ้มและรองรับมือ', 'เลื่อนหน้าเอกสาร', 'ตรวจจับการเคลื่อนไหวบนพื้นผิว'], colors: ['#111827', '#f8fafc', '#22d3ee'] },
  cpu: { parts: ['ฝาโลหะระบายความร้อน', 'แกนประมวลผล', 'ขาสัมผัสเมนบอร์ด'], functions: ['กระจายความร้อน', 'คำนวณและทำตามคำสั่ง', 'เชื่อมต่อ CPU กับเมนบอร์ด'], colors: ['#94a3b8', '#f97316', '#fbbf24'] },
  ram: { parts: ['แผงหน่วยความจำ', 'ชิปเก็บข้อมูลชั่วคราว', 'ขาสัมผัส'], functions: ['ยึดชิปและเชื่อมวงจร', 'พักข้อมูลระหว่างที่โปรแกรมทำงาน', 'รับส่งข้อมูลกับเมนบอร์ด'], colors: ['#16a34a', '#111827', '#fbbf24'] },
  ssd: { parts: ['ฝาครอบ SSD', 'ชิปควบคุม/หน่วยเก็บข้อมูล', 'ขั้วต่อ'], functions: ['ปกป้องแผงวงจร', 'บันทึกข้อมูลและจัดการการอ่านเขียน', 'เชื่อมต่อ SSD กับคอมพิวเตอร์'], colors: ['#334155', '#111827', '#fbbf24'] },
  monitor: { parts: ['กรอบจอ', 'แผงภาพ', 'ขาตั้ง'], functions: ['ปกป้องและยึดแผงจอ', 'แสดงภาพจากคอมพิวเตอร์', 'รองรับจอให้ตั้งได้มั่นคง'], colors: ['#111827', '#38bdf8', '#475569'] },
  speaker: { parts: ['ตู้ลำโพง', 'กรวยขับเสียง', 'แม่เหล็ก/ชุดขับ'], functions: ['ยึดชุดขับและช่วยควบคุมเสียง', 'สั่นเพื่อสร้างคลื่นเสียง', 'ขับการเคลื่อนที่ของกรวย'], colors: ['#1e293b', '#94a3b8', '#64748b'] },
  router: { parts: ['ฝาครอบเราเตอร์', 'แผงวงจรสื่อสาร', 'เสาอากาศ'], functions: ['ปกป้องอุปกรณ์ภายใน', 'จัดการการเชื่อมต่อเครือข่าย', 'รับส่งสัญญาณไร้สาย'], colors: ['#e2e8f0', '#16a34a', '#f8fafc'] },
};

export function Mission2DeviceScene({ device, exploded, picked }: { device: DeviceId; exploded: boolean; picked: boolean }) {
  return <div className="relative h-[300px] overflow-hidden rounded-[1.5rem] border border-slate-700 bg-[#0b1220] sm:h-[390px]" aria-label="3D device inspection view">
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [4.1, 3.2, 5.8], fov: 42 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
      <color attach="background" args={['#0b1220']} />
      <fog attach="fog" args={['#0b1220', 10, 19]} />
      <ambientLight intensity={0.42} />
      <spotLight position={[3, 7, 4]} intensity={62} angle={0.48} penumbra={0.72} castShadow />
      <directionalLight position={[-4, 4, -2]} intensity={2.1} color="#dce7f3" />
      <pointLight position={[-4, 2, -3]} intensity={8} color="#a9c5da" />
      <Suspense fallback={null}><Environment files="/models/mission1/university_workshop_1k.hdr" /></Suspense>
      <Workbench />
      <Suspense fallback={<DeviceLoading />}><Device device={device} exploded={exploded} picked={picked} /></Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]}>
        <planeGeometry args={[4.2, 3.3]} />
        <shaderMaterial transparent depthWrite={false} vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}" fragmentShader="varying vec2 vUv; void main(){float d=length((vUv-0.5)*2.0);float a=(1.0-smoothstep(0.15,1.0,d))*0.3;gl_FragColor=vec4(0.0,0.0,0.0,a);}" />
      </mesh>
      <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={9} minPolarAngle={0.45} maxPolarAngle={1.48} />
    </Canvas>
    <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[10px] font-extrabold tracking-[.18em] text-cyan-200">3D COMPONENT VIEW</div>
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 text-[11px] font-semibold text-slate-200">ลากเมาส์เพื่อหมุน · เลื่อนเพื่อซูม</div>
    <div className={`pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-black tracking-widest ${exploded ? 'bg-amber-300 text-slate-950' : 'bg-emerald-300 text-slate-950'}`}>{exploded ? 'EXPLODED VIEW' : 'ASSEMBLED VIEW'}</div>
  </div>;
}

function Workbench() {
  return <group position={[0, -0.45, 0]}>
    <RoundedBox args={[7.2, 0.28, 5]} radius={0.035} smoothness={3} receiveShadow><meshStandardMaterial color="#434b52" metalness={0.62} roughness={0.38} /></RoundedBox>
    <RoundedBox args={[6.9, 0.035, 4.7]} radius={0.025} smoothness={2} position={[0, 0.16, 0]}><meshStandardMaterial color="#151b20" roughness={0.9} /></RoundedBox>
    {[[-3.1, -1.2], [3.1, -1.2], [-3.1, 1.2], [3.1, 1.2]].map(([x, z]) => <RoundedBox key={`${x}-${z}`} args={[0.18, 1.2, 0.18]} radius={0.04} position={[x, -0.78, z]} castShadow><meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} /></RoundedBox>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}><ringGeometry args={[1.42, 1.47, 64]} /><meshBasicMaterial color="#0e7490" /></mesh>
  </group>;
}

function DeviceLoading() {
  return <group position={[0, 0.5, 0]}><mesh castShadow><icosahedronGeometry args={[0.46, 2]} /><meshStandardMaterial color="#94a3b8" metalness={0.48} roughness={0.3} /></mesh></group>;
}

function Device({ device, exploded, picked }: { device: DeviceId; exploded: boolean; picked: boolean }) {
  const root = useRef<THREE.Group>(null);
  const content = useRef<THREE.Group>(null);
  useEffect(() => {
    if (root.current) root.current.scale.setScalar(0.78);
  }, [device]);
  useFrame((state, delta) => {
    if (!root.current || !content.current) return;
    const lift = picked ? 0.62 : 0;
    // The tabletop's finished surface is y=-0.2725. Keep resting devices planted
    // there; only add a restrained hand-held bob while the player is inspecting one.
    const inspectionBob = picked ? Math.sin(state.clock.elapsedTime * 1.7) * 0.018 : 0;
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, -0.265 + lift + inspectionBob, 7, delta);
    const scale = picked ? 1.08 : 0.78;
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, scale, 5, delta));
    const target = exploded ? 1 : 0;
    content.current.userData.explode = THREE.MathUtils.damp(content.current.userData.explode ?? 0, target, 5, delta);
  });
  const info = details[device];
  return <group ref={root}>
    <group ref={content}>
      <Model device={device} exploded={exploded} />
    </group>
    {exploded && info.parts.map((label, i) => <Html key={label} position={[-2.05 + i * 2.05, 2.35, 0]} center distanceFactor={8}>
      <div className="w-36 rounded-xl border border-white/15 bg-slate-950/90 px-3 py-2 text-center text-[11px] font-bold leading-snug text-white shadow-xl">
        <span className="mx-auto mb-1 block h-1 w-8 rounded-full" style={{ backgroundColor: info.colors[i] }} /><b className="block">{label}</b><span className="mt-1 block font-medium text-slate-300">{info.functions[i]}</span>
      </div>
    </Html>)}
  </group>;
}

function Piece({ position, exploded, offset, children }: { position: [number, number, number]; exploded: boolean; offset: [number, number, number]; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const t = exploded ? 1 : 0;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, position[0] + offset[0] * t, 6, delta);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, position[1] + offset[1] * t, 6, delta);
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, position[2] + offset[2] * t, 6, delta);
  });
  return <group ref={ref} position={position}>{children}</group>;
}

const DEVICE_ASSETS: Record<DeviceId, { src: string; scale: number; spread: number; rotation?: number }> = {
  // PBR assets use real-world dimensions and embedded color/roughness/normal maps.
  // Keep exploded offsets restrained so the assembled forms remain recognizable.
  monitor: { src: '/models/mission2/monitor-pbr.glb', scale: 2.62, spread: 0.18 },
  keyboard: { src: '/models/mission2/keyboard-pbr.glb', scale: 8, spread: 0.12 },
  mouse: { src: '/models/mission2/mouse-pbr.glb', scale: 5, spread: 0.12 },
  cpu: { src: '/models/mission2/cpu-processor-chip.glb', scale: 16, spread: 0.12 },
  ram: { src: '/models/mission2/ram-memory-module.glb', scale: 9, spread: 0.12 },
  ssd: { src: '/models/mission1/external-ssd.glb', scale: 10, spread: 0.1, rotation: 0.25 },
  speaker: { src: '/models/mission2/speaker-pbr.glb', scale: 7.2, spread: 0.14 },
  router: { src: '/models/mission2/router-pbr.glb', scale: 7, spread: 0.18 },
};

function Model({ device, exploded }: { device: DeviceId; exploded: boolean }) {
  if (device === 'cpu' || device === 'ram') return <PrecisionDevice device={device} exploded={exploded} />;
  return <RealisticDevice device={device} exploded={exploded} />;
}

/** Clean, component-scale CPU and DIMM meshes; the generated source GLBs were too blobby. */
function PrecisionDevice({ device, exploded }: { device: 'cpu' | 'ram'; exploded: boolean }) {
  const pcb = <meshStandardMaterial color={device === 'cpu' ? '#20292c' : '#17442f'} metalness={0.18} roughness={0.46} />;
  const contacts = device === 'cpu'
    ? Array.from({ length: 144 }, (_, i) => {
      const x = i % 12;
      const z = Math.floor(i / 12);
      return <mesh key={i} position={[-0.44 + x * 0.08, 0.012, -0.44 + z * 0.08]}>
        <cylinderGeometry args={[0.018, 0.018, 0.012, 8]} />
        <meshStandardMaterial color="#c99b45" metalness={0.88} roughness={0.24} />
      </mesh>;
    })
    : Array.from({ length: 44 }, (_, i) => {
      const x = -1.02 + i * 0.0475;
      // DIMM edge contacts stop at the key notch, as on a real module.
      if (Math.abs(x) < 0.07) return null;
      return <mesh key={i} position={[x, 0.018, 0.105]}>
        <boxGeometry args={[0.027, 0.012, 0.07]} />
        <meshStandardMaterial color="#c99b45" metalness={0.9} roughness={0.22} />
      </mesh>;
    });

  if (device === 'cpu') return <group>
    <Piece position={[0, 0, 0]} offset={[0, -0.12, 0]} exploded={exploded}>
      <RoundedBox args={[1.08, 0.09, 1.08]} radius={0.018} smoothness={2} position={[0, 0.07, 0]} castShadow receiveShadow><primitive object={pcb} attach="material" /></RoundedBox>
      {contacts}
      {Array.from({ length: 4 }, (_, i) => <mesh key={`pad-${i}`} position={[-0.38 + i * 0.25, 0.119, -0.51]}><boxGeometry args={[0.12, 0.006, 0.025]} /><meshStandardMaterial color="#9ca3a0" metalness={0.6} roughness={0.38} /></mesh>)}
    </Piece>
    <Piece position={[0, 0.145, 0]} offset={[0, 0.25, 0]} exploded={exploded}>
      <RoundedBox args={[0.86, 0.055, 0.86]} radius={0.025} smoothness={3} castShadow><meshStandardMaterial color="#aeb6b8" metalness={0.78} roughness={0.27} /></RoundedBox>
      <mesh position={[0, 0.028, 0.30]}><boxGeometry args={[0.46, 0.001, 0.002]} /><meshStandardMaterial color="#717c80" metalness={0.65} roughness={0.42} /></mesh>
      <mesh position={[0, 0.028, 0.34]}><boxGeometry args={[0.27, 0.001, 0.002]} /><meshStandardMaterial color="#717c80" metalness={0.65} roughness={0.42} /></mesh>
    </Piece>
    {[-1, 1].map((side) => <mesh key={side} position={[side * 0.505, 0.07, 0]}><boxGeometry args={[0.016, 0.025, 0.27]} /><meshStandardMaterial color="#c99b45" metalness={0.86} roughness={0.28} /></mesh>)}
  </group>;

  return <group>
    <Piece position={[0, 0, 0]} offset={[0, -0.08, 0]} exploded={exploded}>
      <RoundedBox args={[2.18, 0.045, 0.29]} radius={0.012} smoothness={2} position={[0, 0.068, 0]} castShadow receiveShadow><primitive object={pcb} attach="material" /></RoundedBox>
      {contacts}
      {/* Solder-mask traces and the keyed notch make the edge recognizable as a DIMM. */}
      {[-0.72, -0.38, 0.38, 0.72].map((x) => <mesh key={x} position={[x, 0.092, -0.095]}><boxGeometry args={[0.12, 0.002, 0.006]} /><meshStandardMaterial color="#8aa17c" metalness={0.3} roughness={0.5} /></mesh>)}
    </Piece>
    <Piece position={[0, 0.105, 0]} offset={[0, 0.2, 0]} exploded={exploded}>
      {[-0.78, -0.26, 0.26, 0.78].map((x, i) => <group key={x} position={[x, 0, 0]}>
        <RoundedBox args={[0.39, 0.17, 0.205]} radius={0.012} smoothness={2} castShadow><meshStandardMaterial color="#111619" metalness={0.28} roughness={0.3} /></RoundedBox>
        <mesh position={[0, 0.086, 0]}><boxGeometry args={[0.29, 0.002, 0.13]} /><meshStandardMaterial color="#263034" metalness={0.35} roughness={0.32} /></mesh>
        <mesh position={[0, 0.088, 0.074]}><boxGeometry args={[0.17, 0.001, 0.002]} /><meshStandardMaterial color={i % 2 ? '#a7a89e' : '#6d7777'} metalness={0.62} roughness={0.32} /></mesh>
      </group>)}
    </Piece>
    <RoundedBox args={[0.085, 0.006, 0.045]} radius={0.002} position={[0, 0.025, 0.102]}><meshStandardMaterial color="#1c2521" /></RoundedBox>
  </group>;
}

function RealisticDevice({ device, exploded }: { device: DeviceId; exploded: boolean }) {
  const asset = DEVICE_ASSETS[device];
  const { scene } = useGLTF(asset.src);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    // Normalize the pivot: center the footprint and put the lowest vertex at y=0.
    // Centering vertically made tall devices intersect the tabletop by half their height.
    clone.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(clone);
    if (!bounds.isEmpty()) {
      const center = bounds.getCenter(new THREE.Vector3());
      clone.position.x -= center.x;
      clone.position.z -= center.z;
      clone.position.y -= bounds.min.y;
    }
    const partRoot = clone.children.length === 1 && !(clone.children[0] instanceof THREE.Mesh) ? clone.children[0] : clone;
    const materialClones = new Map<THREE.Material, THREE.Material>();
    const tuneMaterial = (source: THREE.Material) => {
      const cached = materialClones.get(source);
      if (cached) return cached;
      let material = source.clone();
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        materialClones.set(source, material);
        return material;
      }
      const name = material.name.toLowerCase();
      const hasPbrMaps = Boolean(material.map || material.normalMap || material.roughnessMap || material.metalnessMap || material.aoMap);
      material.envMapIntensity = hasPbrMaps ? 1.12 : 1.28;

      // The CPU and DIMM files are untextured generated meshes; use believable
      // electronic finishes instead of their original near-clay roughness.
      if (!hasPbrMaps && (device === 'cpu' || device === 'ram')) {
        if (name === 'canvas') {
          material.color.set(device === 'cpu' ? '#202c32' : '#173626');
          material.roughness = 0.42;
          material.metalness = 0.18;
        } else if (name === 'dark') {
          material.color.set('#111417');
          material.roughness = 0.26;
          material.metalness = 0.12;
        } else if (name === 'ivory') {
          material.color.set('#c6a45e');
          material.roughness = 0.24;
          material.metalness = 0.82;
        }
      } else if (!hasPbrMaps) {
        if (name.includes('screen') || name.includes('display')) {
          const glass = new THREE.MeshPhysicalMaterial().copy(material);
          glass.roughness = 0.12;
          glass.metalness = 0.16;
          glass.clearcoat = 0.9;
          glass.clearcoatRoughness = 0.08;
          glass.envMapIntensity = 1.45;
          material.dispose();
          material = glass;
        } else if (name.includes('silver') || name.includes('metal') || name.includes('aluminum')) {
          material.metalness = 0.78;
          material.roughness = Math.min(material.roughness, 0.3);
        } else if (name.includes('fabric') || name.includes('rubber')) {
          material.roughness = Math.max(material.roughness, 0.8);
        } else {
          material.roughness = Math.min(material.roughness, 0.42);
          material.metalness = Math.min(material.metalness, 0.12);
        }
      }
      materialClones.set(source, material);
      return material;
    };
    const parts = partRoot.children;
    parts.forEach((child, index) => {
      child.userData.basePosition = child.position.clone();
      child.userData.explodeOffset = getPartOffset(device, child.name, index, asset.spread / asset.scale);
      child.traverse((piece) => {
        if (!(piece instanceof THREE.Mesh)) return;
        piece.castShadow = true;
        piece.receiveShadow = true;
        piece.material = Array.isArray(piece.material) ? piece.material.map(tuneMaterial) : tuneMaterial(piece.material);
      });
    });
    clone.userData.explodeParts = parts;
    return clone;
  }, [scene, asset]);
  useFrame((_, delta) => {
    const target = exploded ? 1 : 0;
    (model.userData.explodeParts as THREE.Object3D[]).forEach((child) => {
      const base = child.userData.basePosition as THREE.Vector3;
      const offset = child.userData.explodeOffset as THREE.Vector3;
      const destination = base.clone().addScaledVector(offset, target);
      child.position.x = THREE.MathUtils.damp(child.position.x, destination.x, 6, delta);
      child.position.y = THREE.MathUtils.damp(child.position.y, destination.y, 6, delta);
      child.position.z = THREE.MathUtils.damp(child.position.z, destination.z, 6, delta);
    });
  });
  return <group scale={asset.scale} rotation={[0, asset.rotation ?? 0, 0]}><primitive object={model} /></group>;
}

function getPartOffset(device: DeviceId, partName: string, index: number, unit: number) {
  const name = partName.toLowerCase();
  const offset = new THREE.Vector3();
  if (device === 'keyboard') {
    if (name.includes('keycap') || name.includes('space key')) offset.y = 0.78;
  } else if (device === 'monitor') {
    if (name.includes('glass')) offset.set(0, 0.18, 0.32);
    else if (name.includes('enclosure')) offset.y = 0.48;
    else if (name.includes('neck')) offset.y = -0.2;
    else if (name.includes('foot')) offset.y = -0.56;
  } else if (device === 'mouse') {
    if (name.includes('button') || name.includes('shell')) offset.set(0, 0.38, 0.2);
    else if (name.includes('wheel')) offset.y = 0.58;
    else if (name.includes('base')) offset.y = -0.38;
  } else if (device === 'speaker') {
    if (name.includes('driver') || name.includes('cone') || name.includes('dome') || name.includes('surround')) offset.z = 0.58;
    else if (name.includes('fixing') || name.includes('socket')) offset.z = 0.38;
    else if (name.includes('foot')) offset.y = -0.28;
  } else if (device === 'router') {
    if (name.includes('antenna')) offset.set(index % 2 ? 0.46 : -0.46, 0.42, 0);
    else if (name.includes('port')) offset.z = 0.48;
    else if (name.includes('status light')) offset.y = 0.3;
  } else {
    const directions = [
      new THREE.Vector3(-1, 0.4, 0.15), new THREE.Vector3(1, 0.35, 0.12),
      new THREE.Vector3(0, 1, 0.65), new THREE.Vector3(0, 0.45, -1),
    ];
    offset.copy(directions[index % directions.length]);
  }
  return offset.multiplyScalar(unit);
}

function ProceduralDevice({ device, exploded }: { device: DeviceId; exploded: boolean }) {
  if (device === 'monitor') return <>
    <Piece position={[0, 1.35, 0]} offset={[0, 1.18, 0.18]} exploded={exploded}><RoundedBox args={[2.15, 1.32, 0.16]} radius={0.1} castShadow><meshStandardMaterial color="#101722" metalness={0.55} roughness={0.26} /></RoundedBox></Piece>
    <Piece position={[0, 1.35, 0.1]} offset={[0, 0.12, 0.95]} exploded={exploded}><RoundedBox args={[1.92, 1.1, 0.025]} radius={0.04}><meshStandardMaterial color="#0ea5e9" emissive="#075985" emissiveIntensity={0.5} roughness={0.2} /></RoundedBox></Piece>
    <Piece position={[0, 0.4, 0]} offset={[0, -0.55, -0.15]} exploded={exploded}><RoundedBox args={[0.18, 0.9, 0.15]} radius={0.04} castShadow><meshStandardMaterial color="#475569" metalness={0.72} roughness={0.28} /></RoundedBox></Piece>
    <RoundedBox args={[1.15, 0.1, 0.55]} radius={0.05} position={[0, -0.05, 0]} castShadow><meshStandardMaterial color="#334155" metalness={0.65} roughness={0.3} /></RoundedBox>
  </>;
  if (device === 'keyboard') return <>
    <Piece position={[0, 0.52, 0]} offset={[0, 0.8, -0.16]} exploded={exploded}><RoundedBox args={[2.8, 0.18, 1.05]} radius={0.1} castShadow><meshStandardMaterial color="#111827" metalness={0.45} roughness={0.35} /></RoundedBox></Piece>
    <Piece position={[0, 0.68, 0]} offset={[0, 0.55, 0.2]} exploded={exploded}>{Array.from({ length: 5 }, (_, r) => Array.from({ length: 12 }, (_, c) => <RoundedBox key={`${r}-${c}`} args={[0.17, 0.1, 0.14]} radius={0.025} position={[-1.24 + c * 0.225, 0, -0.36 + r * 0.17]} castShadow><meshStandardMaterial color={r === 0 && c === 0 ? '#06b6d4' : '#64748b'} roughness={0.38} /></RoundedBox>))}</Piece>
    <Piece position={[0, 0.34, 0]} offset={[0, -0.3, 0]} exploded={exploded}><RoundedBox args={[2.45, 0.07, 0.7]} radius={0.04}><meshStandardMaterial color="#16a34a" metalness={0.2} roughness={0.6} /></RoundedBox></Piece>
  </>;
  if (device === 'mouse') return <>
    <Piece position={[0, 0.62, 0]} offset={[0, 0.72, 0]} exploded={exploded}><mesh castShadow scale={[0.64, 0.28, 0.9]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color="#1f2937" metalness={0.48} roughness={0.28} /></mesh></Piece>
    <Piece position={[0, 0.86, 0.18]} offset={[0, 0.2, 0.56]} exploded={exploded}><RoundedBox args={[0.08, 0.22, 0.16]} radius={0.04}><meshStandardMaterial color="#cbd5e1" /></RoundedBox></Piece>
    <Piece position={[0, 0.34, 0]} offset={[0, -0.4, -0.25]} exploded={exploded}><RoundedBox args={[0.5, 0.08, 0.55]} radius={0.08}><meshStandardMaterial color="#06b6d4" metalness={0.25} /></RoundedBox></Piece>
  </>;
  if (device === 'cpu') return <>
    <Piece position={[0, 0.75, 0]} offset={[0, 0.88, 0]} exploded={exploded}><RoundedBox args={[1.05, 0.18, 1.05]} radius={0.07} castShadow><meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.22} /></RoundedBox></Piece>
    <Piece position={[0, 0.55, 0]} offset={[0, 0, 0]} exploded={exploded}><RoundedBox args={[0.83, 0.14, 0.83]} radius={0.04}><meshStandardMaterial color="#ea580c" metalness={0.5} /></RoundedBox></Piece>
    <Piece position={[0, 0.38, 0]} offset={[0, -0.68, 0]} exploded={exploded}><RoundedBox args={[1.08, 0.1, 1.08]} radius={0.04}><meshStandardMaterial color="#1e293b" /></RoundedBox>{Array.from({ length: 64 }, (_, i) => <mesh key={i} position={[-0.46 + (i % 8) * 0.13, -0.08, -0.46 + Math.floor(i / 8) * 0.13]}><boxGeometry args={[0.035, 0.05, 0.035]} /><meshStandardMaterial color="#fbbf24" metalness={0.8} /></mesh>)}</Piece>
  </>;
  if (device === 'ram') return <>
    <Piece position={[0, 0.52, 0]} offset={[0, 0.55, 0]} exploded={exploded}><RoundedBox args={[2.15, 0.1, 0.55]} radius={0.025} castShadow><meshStandardMaterial color="#15803d" /></RoundedBox></Piece>
    <Piece position={[0, 0.62, 0]} offset={[0, 0.9, 0]} exploded={exploded}>{[-0.72, -0.24, 0.24, 0.72].map(x => <RoundedBox key={x} args={[0.35, 0.18, 0.36]} radius={0.04} position={[x, 0, 0]}><meshStandardMaterial color="#111827" metalness={0.35} /></RoundedBox>)}</Piece>
    <Piece position={[0, 0.42, 0]} offset={[0, -0.62, 0]} exploded={exploded}>{Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[-0.9 + i * 0.14, 0, 0.31]}><boxGeometry args={[0.06, 0.035, 0.04]} /><meshStandardMaterial color="#fbbf24" metalness={0.85} /></mesh>)}</Piece>
  </>;
  if (device === 'ssd') return <>
    <Piece position={[0, 0.58, 0]} offset={[0, 0.88, 0]} exploded={exploded}><RoundedBox args={[2.35, 0.15, 0.92]} radius={0.08} castShadow><meshStandardMaterial color="#334155" metalness={0.72} roughness={0.27} /></RoundedBox></Piece>
    <Piece position={[0, 0.4, 0]} offset={[0, 0, 0]} exploded={exploded}><RoundedBox args={[2.02, 0.06, 0.68]} radius={0.04}><meshStandardMaterial color="#15803d" /></RoundedBox>{[-0.48, 0, 0.48].map(x => <RoundedBox key={x} args={[0.33, 0.06, 0.38]} radius={0.03} position={[x, 0.07, 0]}><meshStandardMaterial color={x === 0 ? '#111827' : '#334155'} /></RoundedBox>)}</Piece>
    <Piece position={[1.29, 0.38, 0]} offset={[0.7, -0.38, 0]} exploded={exploded}><RoundedBox args={[0.48, 0.1, 0.42]} radius={0.025}><meshStandardMaterial color="#d6a94b" metalness={0.8} /></RoundedBox></Piece>
  </>;
  if (device === 'speaker') return <>
    <Piece position={[0, 0.88, 0]} offset={[0, 0.75, 0]} exploded={exploded}><RoundedBox args={[1.4, 1.5, 0.72]} radius={0.12} castShadow><meshStandardMaterial color="#1e293b" roughness={0.4} /></RoundedBox></Piece>
    <Piece position={[0, 0.95, 0.4]} offset={[0, 0.15, 0.8]} exploded={exploded}><mesh rotation={[0, 0, 0]}><cylinderGeometry args={[0.48, 0.36, 0.12, 40]} /><meshStandardMaterial color="#94a3b8" metalness={0.55} roughness={0.3} /></mesh></Piece>
    <Piece position={[0, 0.9, 0.52]} offset={[0, -0.65, 0.25]} exploded={exploded}><mesh><cylinderGeometry args={[0.18, 0.14, 0.16, 32]} /><meshStandardMaterial color="#334155" /></mesh></Piece>
  </>;
  return <>
    <Piece position={[0, 0.68, 0]} offset={[0, 0.82, 0]} exploded={exploded}><RoundedBox args={[2.1, 0.34, 1.25]} radius={0.18} castShadow><meshStandardMaterial color="#e2e8f0" roughness={0.3} /></RoundedBox></Piece>
    <Piece position={[0, 0.43, 0]} offset={[0, 0, 0]} exploded={exploded}><RoundedBox args={[1.68, 0.07, 0.92]} radius={0.04}><meshStandardMaterial color="#15803d" /></RoundedBox>{Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[-0.64 + i * 0.32, 0.13, -0.52]}><boxGeometry args={[0.15, 0.1, 0.16]} /><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.4} /></mesh>)}</Piece>
    {[-0.76, 0.76].map((x) => <Piece key={x} position={[x, 1.05, -0.38]} offset={[x * 0.65, 1.15, -0.2]} exploded={exploded}><RoundedBox args={[0.1, 1.4, 0.1]} radius={0.05} rotation={[0, 0, -0.16]}><meshStandardMaterial color="#f8fafc" metalness={0.6} /></RoundedBox></Piece>)}
  </>;
}
