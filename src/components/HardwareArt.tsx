import type { ReactElement } from 'react';

/** Stylised hardware illustrations (viewBox 0 0 200 140) used by Mission 05 and the Hardware Lab. */

export interface Hotspot {
  x: number; // percent of width
  y: number; // percent of height
  label: string;
  note: string;
}

const gold = '#f5b942';
const pcb = '#0f766e';
const pcbDark = '#115e59';
const chip = '#1e293b';
const metal = '#cbd5e1';
const metalDark = '#94a3b8';

const ART: Record<string, { svg: ReactElement; hotspots: Hotspot[] }> = {
  ram: {
    svg: (
      <g>
        <rect x="12" y="42" width="176" height="56" rx="4" fill={pcb} />
        <rect x="12" y="42" width="176" height="8" fill={pcbDark} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={20 + i * 21} y="56" width="16" height="22" rx="2" fill={chip} />
        ))}
        <rect x="12" y="86" width="176" height="12" fill={gold} />
        {Array.from({ length: 34 }).map((_, i) => (
          <rect key={i} x={15 + i * 5.1} y="88" width="3" height="10" fill="#d4961c" />
        ))}
        <rect x="104" y="86" width="6" height="14" fill="#f8fafc" />
        <rect x="6" y="60" width="6" height="14" rx="2" fill="#f8fafc" />
        <rect x="188" y="60" width="6" height="14" rx="2" fill="#f8fafc" />
      </g>
    ),
    hotspots: [
      { x: 45, y: 48, label: 'ชิปหน่วยความจำ', note: 'ชิปสีดำเรียงเป็นแถว ใช้พักข้อมูลที่กำลังใช้งาน' },
      { x: 54, y: 67, label: 'ร่องบาก (Notch)', note: 'บากไม่อยู่ตรงกลาง ป้องกันการเสียบกลับด้าน' },
      { x: 20, y: 67, label: 'ขาสีทอง', note: 'หน้าสัมผัสยาวตลอดแนว เสียบลงสล็อตบนเมนบอร์ด' },
    ],
  },
  cpu: {
    svg: (
      <g>
        <rect x="48" y="18" width="104" height="104" rx="8" fill="#14532d" />
        <rect x="58" y="28" width="84" height="84" rx="6" fill={metal} />
        <rect x="58" y="28" width="84" height="84" rx="6" fill="url(#shine)" />
        <text x="100" y="66" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">PROCESSOR</text>
        <text x="100" y="82" textAnchor="middle" fontSize="8" fill="#64748b">8-CORE · 4.2 GHz</text>
        <path d="M52 22 l8 0 l-8 8 z" fill={gold} />
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i}>
            <rect x={54 + i * 8} y="14" width="3" height="4" fill={gold} />
            <rect x={54 + i * 8} y="122" width="3" height="4" fill={gold} />
          </g>
        ))}
      </g>
    ),
    hotspots: [
      { x: 50, y: 50, label: 'ฝาโลหะ (Heat Spreader)', note: 'ช่วยกระจายความร้อนจากแกนประมวลผลไปยังฮีตซิงก์' },
      { x: 28, y: 18, label: 'สามเหลี่ยมมุมชิป', note: 'สัญลักษณ์บอกทิศทางการวางลง Socket' },
      { x: 50, y: 90, label: 'หน้าสัมผัสทอง', note: 'จุดสัมผัสจำนวนมากเชื่อมกับ Socket บนเมนบอร์ด' },
    ],
  },
  gpu: {
    svg: (
      <g>
        <rect x="8" y="30" width="172" height="70" rx="8" fill="#1e293b" />
        <rect x="8" y="30" width="172" height="8" rx="4" fill="#6366f1" />
        {[52, 128].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="68" r="26" fill="#0f172a" />
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={i} d={`M${cx} 68 L${cx + 22 * Math.cos((i * 2 * Math.PI) / 7)} ${68 + 22 * Math.sin((i * 2 * Math.PI) / 7)}`} stroke="#475569" strokeWidth="7" strokeLinecap="round" />
            ))}
            <circle cx={cx} cy="68" r="7" fill="#6366f1" />
          </g>
        ))}
        <rect x="24" y="100" width="110" height="10" fill={gold} />
        <rect x="180" y="30" width="12" height="80" fill={metalDark} />
        <rect x="183" y="40" width="6" height="10" rx="1" fill="#0f172a" />
        <rect x="183" y="56" width="6" height="10" rx="1" fill="#0f172a" />
        <rect x="183" y="72" width="6" height="14" rx="1" fill="#0f172a" />
      </g>
    ),
    hotspots: [
      { x: 26, y: 48, label: 'พัดลมระบายความร้อน', note: 'ชิปกราฟิกทำงานหนักจึงร้อน ต้องมีพัดลม 1–3 ตัว' },
      { x: 95, y: 50, label: 'พอร์ตต่อจอ', note: 'HDMI / DisplayPort ใช้ส่งภาพไปยังจอภาพ' },
      { x: 40, y: 80, label: 'ขา PCIe', note: 'เสียบลงสล็อต PCIe x16 บนเมนบอร์ด' },
    ],
  },
  hdd: {
    svg: (
      <g>
        <rect x="30" y="10" width="140" height="120" rx="8" fill={metalDark} />
        <rect x="36" y="16" width="128" height="108" rx="6" fill={metal} />
        <circle cx="96" cy="66" r="44" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="96" cy="66" r="30" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        <circle cx="96" cy="66" r="10" fill="#64748b" />
        <path d="M150 112 L108 72" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
        <circle cx="150" cy="112" r="8" fill="#334155" />
        {[46, 154, 46, 154].map((x, i) => (
          <circle key={i} cx={x} cy={i < 2 ? 24 : 116} r="3" fill="#64748b" />
        ))}
      </g>
    ),
    hotspots: [
      { x: 48, y: 30, label: 'จานแม่เหล็ก (Platter)', note: 'จานกลมหมุนเร็ว 5,400–7,200 รอบ/นาที ใช้บันทึกข้อมูล' },
      { x: 62, y: 60, label: 'แขนหัวอ่าน', note: 'เคลื่อนไปอ่าน-เขียนข้อมูลบนจาน จึงช้ากว่า SSD' },
      { x: 50, y: 88, label: 'กล่องโลหะ 3.5 นิ้ว', note: 'ป้องกันฝุ่นและแรงกระแทกให้ชิ้นส่วนภายใน' },
    ],
  },
  ssd: {
    svg: (
      <g>
        <rect x="14" y="52" width="168" height="36" rx="4" fill="#1e293b" />
        <rect x="30" y="58" width="42" height="24" rx="2" fill="#334155" />
        <rect x="80" y="58" width="42" height="24" rx="2" fill="#334155" />
        <rect x="130" y="60" width="22" height="20" rx="2" fill="#475569" />
        <rect x="182" y="56" width="10" height="28" fill={gold} />
        <rect x="186" y="66" width="6" height="4" fill="#f8fafc" />
        <circle cx="16" cy="70" r="5" fill="#f8fafc" />
        <text x="76" y="100" textAnchor="middle" fontSize="8" fill="#64748b">M.2 2280 · NVMe</text>
      </g>
    ),
    hotspots: [
      { x: 25, y: 50, label: 'ชิปแฟลช (NAND)', note: 'เก็บข้อมูลถาวรด้วยชิป ไม่มีชิ้นส่วนหมุน' },
      { x: 95, y: 50, label: 'หัวเสียบ M.2', note: 'เสียบลงช่อง M.2 บนเมนบอร์ดโดยตรง' },
      { x: 8, y: 50, label: 'รูยึดน็อต', note: 'ยึดปลายการ์ดกับเมนบอร์ด' },
    ],
  },
  mainboard: {
    svg: (
      <g>
        <rect x="20" y="6" width="160" height="128" rx="6" fill={pcbDark} />
        <rect x="64" y="20" width="40" height="40" rx="3" fill="#0f172a" />
        <rect x="70" y="26" width="28" height="28" rx="2" fill={metalDark} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={116 + i * 10} y="14" width="5" height="56" rx="1" fill="#0f172a" />
        ))}
        <rect x="30" y="80" width="110" height="7" rx="2" fill="#0f172a" />
        <rect x="30" y="100" width="110" height="7" rx="2" fill="#0f172a" />
        <rect x="24" y="14" width="18" height="50" rx="2" fill={metalDark} />
        <rect x="148" y="100" width="22" height="22" rx="3" fill="#334155" />
        <rect x="60" y="118" width="44" height="6" rx="1" fill="#1e293b" />
      </g>
    ),
    hotspots: [
      { x: 42, y: 28, label: 'CPU Socket', note: 'ช่องสี่เหลี่ยมสำหรับติดตั้ง CPU' },
      { x: 66, y: 30, label: 'สล็อต RAM', note: 'ช่องยาวแนวตั้งสำหรับเสียบ RAM' },
      { x: 45, y: 60, label: 'สล็อต PCIe', note: 'ช่องยาวแนวนอนสำหรับการ์ดจอและการ์ดอื่น ๆ' },
      { x: 16, y: 28, label: 'พอร์ต I/O ด้านหลัง', note: 'USB, LAN, เสียง ยื่นออกท้ายเคส' },
    ],
  },
  router: {
    svg: (
      <g>
        <rect x="56" y="10" width="8" height="54" rx="4" fill="#334155" />
        <rect x="136" y="10" width="8" height="54" rx="4" fill="#334155" />
        <rect x="22" y="60" width="156" height="50" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={48 + i * 14} cy="85" r="4" fill={i < 3 ? '#22c55e' : '#94a3b8'} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={120 + i * 13} y="78" width="10" height="12" rx="1" fill="#1e293b" />
        ))}
      </g>
    ),
    hotspots: [
      { x: 30, y: 20, label: 'เสาอากาศ Wi-Fi', note: 'กระจายสัญญาณไร้สายให้อุปกรณ์หลายเครื่อง' },
      { x: 78, y: 61, label: 'ช่อง LAN', note: 'ต่อสายแลนไปยังคอมพิวเตอร์หลายเครื่อง' },
      { x: 30, y: 61, label: 'ไฟสถานะ', note: 'บอกสถานะการเชื่อมต่อเครือข่าย' },
    ],
  },
  monitor: {
    svg: (
      <g>
        <rect x="20" y="10" width="160" height="96" rx="8" fill="#0f172a" />
        <rect x="28" y="18" width="144" height="80" rx="4" fill="url(#screen)" />
        <rect x="92" y="106" width="16" height="16" fill="#334155" />
        <rect x="64" y="122" width="72" height="8" rx="4" fill="#334155" />
      </g>
    ),
    hotspots: [{ x: 50, y: 40, label: 'หน้าจอ', note: 'แสดงภาพและข้อความ (Output)' }],
  },
  keyboard: {
    svg: (
      <g>
        <rect x="8" y="36" width="184" height="72" rx="10" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 12 }).map((_, c) => <rect key={`${r}-${c}`} x={16 + c * 14.4} y={44 + r * 14} width="12" height="11" rx="2" fill="#f8fafc" stroke="#cbd5e1" />),
        )}
        <rect x="52" y="96" width="96" height="8" rx="2" fill="#f8fafc" stroke="#cbd5e1" />
      </g>
    ),
    hotspots: [{ x: 50, y: 50, label: 'แป้นพิมพ์', note: 'ปุ่มจำนวนมากสำหรับป้อนข้อมูล (Input)' }],
  },
  mouse: {
    svg: (
      <g>
        <path d="M100 18 C136 18 146 50 146 80 C146 112 126 128 100 128 C74 128 54 112 54 80 C54 50 64 18 100 18 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <path d="M100 18 L100 62 M54 64 C80 60 120 60 146 64" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <rect x="95" y="30" width="10" height="20" rx="5" fill="#475569" />
      </g>
    ),
    hotspots: [{ x: 50, y: 28, label: 'ลูกกลิ้ง', note: 'เลื่อนหน้าจอขึ้น-ลง' }],
  },
  printer: {
    svg: (
      <g>
        <rect x="56" y="8" width="88" height="34" fill="#f8fafc" stroke="#cbd5e1" />
        <rect x="24" y="38" width="152" height="60" rx="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <rect x="52" y="86" width="96" height="40" fill="#f8fafc" stroke="#cbd5e1" />
        <circle cx="156" cy="54" r="4" fill="#22c55e" />
      </g>
    ),
    hotspots: [{ x: 50, y: 78, label: 'ช่องกระดาษออก', note: 'ผลลัพธ์ถูกพิมพ์ลงกระดาษ (Output)' }],
  },
  speaker: {
    svg: (
      <g>
        <rect x="60" y="8" width="80" height="124" rx="12" fill="#1e293b" />
        <circle cx="100" cy="40" r="16" fill="#334155" stroke="#475569" strokeWidth="3" />
        <circle cx="100" cy="92" r="28" fill="#334155" stroke="#475569" strokeWidth="3" />
        <circle cx="100" cy="92" r="9" fill="#475569" />
      </g>
    ),
    hotspots: [{ x: 50, y: 65, label: 'ดอกลำโพง', note: 'สั่นเพื่อให้เกิดเสียง (Output)' }],
  },
};

export const hasArt = (key?: string) => !!key && key in ART;
export const artHotspots = (key: string) => ART[key]?.hotspots ?? [];

export function HardwareArt({ art, className, title }: { art: string; className?: string; title: string }) {
  const a = ART[art];
  if (!a) return null;
  return (
    <svg viewBox="0 0 200 140" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {a.svg}
    </svg>
  );
}
