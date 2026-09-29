import type { LOId, MissionId } from '../types';

export const OBJECTIVES: Record<LOId, { th: string; en: string; short: string }> = {
  1: { th: 'อธิบายความหมายของ Hardware', en: 'Hardware Meaning', short: 'ความหมาย' },
  2: { th: 'อธิบายความสำคัญของ Hardware', en: 'Hardware Importance', short: 'ความสำคัญ' },
  3: { th: 'จำแนกประเภทของ Hardware', en: 'Hardware Categories', short: 'ประเภท' },
  4: { th: 'อธิบายหน้าที่ของ Hardware', en: 'Hardware Functions', short: 'หน้าที่' },
  5: { th: 'ระบุ Hardware จากภาพหรืออุปกรณ์', en: 'Hardware Identification', short: 'การระบุ' },
  6: { th: 'เลือก Hardware ให้เหมาะกับงาน', en: 'Hardware Selection', short: 'การเลือก' },
};

export interface MissionMeta {
  id: MissionId;
  code: string;
  title: string;
  en: string;
  objective: string;
  lo: LOId;
  gameplay: string;
  skill: string;
  reward: string; // badge / evidence reward shown on map
  icon: string;
  accent: string; // tailwind gradient classes
}

export const MISSIONS: MissionMeta[] = [
  {
    id: 1, code: 'M-01', title: 'เปิดแฟ้มคดี Hardware', en: 'Open the Hardware Case File',
    objective: 'ค้นพบว่า Hardware คืออะไร', lo: 1, gameplay: 'Investigation',
    skill: 'สำรวจ · เก็บหลักฐาน · จัดกลุ่ม', reward: 'Hardware Evidence ×8', icon: 'folder', accent: 'from-sky-500 to-cyan-400',
  },
  {
    id: 2, code: 'M-02', title: 'ระบบนี้ขาดอะไร?', en: 'What Is the System Missing?',
    objective: 'เข้าใจความสำคัญของ Hardware', lo: 2, gameplay: 'System Diagnosis',
    skill: 'ทดลอง · สังเกตผลกระทบ', reward: 'Diagnostic Evidence', icon: 'power', accent: 'from-violet-500 to-fuchsia-400',
  },
  {
    id: 3, code: 'M-03', title: 'ตามรอยเส้นทางข้อมูล', en: 'Trace the Data Route',
    objective: 'จำแนกประเภท Hardware', lo: 3, gameplay: 'System Mapping',
    skill: 'จำแนก · เชื่อมโยงระบบ', reward: 'Category Evidence ×5', icon: 'route', accent: 'from-amber-500 to-orange-400',
  },
  {
    id: 4, code: 'M-04', title: 'ใครทำหน้าที่อะไร?', en: 'Who Does What?',
    objective: 'เข้าใจหน้าที่ของ Hardware', lo: 4, gameplay: 'Troubleshooting',
    skill: 'อ่านค่า Diagnostic · วิเคราะห์ · ทดสอบ', reward: 'Badge: Hardware Analyst', icon: 'wrench', accent: 'from-emerald-500 to-teal-400',
  },
  {
    id: 5, code: 'M-05', title: 'ตรวจจับอุปกรณ์ต้องสงสัย', en: 'Identify the Suspect Device',
    objective: 'ระบุ Hardware จากภาพหรืออุปกรณ์', lo: 5, gameplay: 'Visual Investigation',
    skill: 'สังเกต · Zoom · Inspect', reward: 'Physical Clue Evidence', icon: 'scan', accent: 'from-rose-500 to-pink-400',
  },
  {
    id: 6, code: 'M-06', title: 'รับงานจากลูกค้า', en: 'Client Job',
    objective: 'เลือก Hardware ให้เหมาะกับงาน', lo: 6, gameplay: 'Client Simulation',
    skill: 'วิเคราะห์ความต้องการ · ชั่งน้ำหนัก Trade-off', reward: 'Badge: Hardware Planner', icon: 'briefcase', accent: 'from-indigo-500 to-blue-400',
  },
];

export const MISSION = Object.fromEntries(MISSIONS.map((m) => [m.id, m])) as Record<MissionId, MissionMeta>;

export const BADGES = [
  { id: 'evidence-hunter', name: 'Evidence Hunter', th: 'นักล่าหลักฐาน', desc: 'เก็บหลักฐานได้ 25 ชิ้นขึ้นไป', icon: 'search' },
  { id: 'hardware-analyst', name: 'Hardware Analyst', th: 'นักวิเคราะห์ฮาร์ดแวร์', desc: 'ผ่าน Mission 04 โดยใช้คำใบ้ไม่เกิน 1 ครั้ง', icon: 'activity' },
  { id: 'system-fixer', name: 'System Fixer', th: 'ผู้กู้ระบบ', desc: 'ซ่อม Final Case สำเร็จ', icon: 'wrench' },
  { id: 'hardware-planner', name: 'Hardware Planner', th: 'นักวางแผนฮาร์ดแวร์', desc: 'จัดสเปกให้ลูกค้าได้เหมาะสมและอยู่ในงบทุกคน', icon: 'clipboard' },
  { id: 'system-technician', name: 'System Technician', th: 'ช่างเทคนิคระบบ', desc: 'ได้รับ Certificate of Completion', icon: 'award' },
] as const;
