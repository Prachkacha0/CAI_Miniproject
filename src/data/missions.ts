import type { LOId, MissionId } from '../types';

export const OBJECTIVES: Record<LOId, { th: string; en: string; short: string }> = {
  1: { th: 'อธิบายความหมายและความสำคัญของฮาร์ดแวร์', en: 'Hardware Meaning', short: 'ความหมาย' },
  2: { th: 'จำแนกประเภทฮาร์ดแวร์ตามลักษณะการทำงาน', en: 'Hardware Categories', short: 'ประเภท' },
  3: { th: 'ระบุชื่อและอธิบายหน้าที่อุปกรณ์พื้นฐาน', en: 'Hardware Functions', short: 'หน้าที่' },
  4: { th: 'ระบุอุปกรณ์ฮาร์ดแวร์จากภาพหรือของจริง', en: 'Hardware Identification', short: 'การระบุ' },
  5: { th: 'เลือกฮาร์ดแวร์ให้เหมาะกับลักษณะงาน', en: 'Hardware Selection', short: 'การเลือก' },
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
    id: 1, code: 'M-01', title: 'นักสืบตามล่าหลักฐาน', en: 'Hardware Evidence Hunt',
    objective: 'สำรวจของรอบโต๊ะ แยกฮาร์ดแวร์ที่จับต้องได้ออกจากซอฟต์แวร์และข้อมูล แล้วอธิบายว่าคอมพิวเตอร์ต้องใช้อุปกรณ์จริงทำงานอย่างไร', lo: 1, gameplay: 'ค้นหา · ตรวจของ · คัดแยก',
    skill: 'สำรวจของในห้อง · เก็บหลักฐาน · ตัดสินใจจัดกลุ่ม', reward: 'แฟ้มคดี Hardware', icon: 'folder', accent: 'from-sky-500 to-cyan-400',
  },
  {
    id: 2, code: 'M-02', title: 'ระบบนี้ขาดอะไร?', en: 'What Is the System Missing?',
    objective: 'ทดลองถอดอุปกรณ์ทีละชิ้น สังเกตอาการที่เปลี่ยนไป แล้วจับคู่ปัญหากับหน้าที่ของฮาร์ดแวร์เพื่อสรุปว่าทำไมระบบจึงต้องมีอุปกรณ์แต่ละส่วน', lo: 1, gameplay: 'ทดลอง · สังเกต · กู้ระบบ',
    skill: 'ถอด/ใส่อุปกรณ์ · อ่านอาการ · ช่วยผู้ใช้แก้ปัญหา', reward: 'บันทึกผลการทดลอง', icon: 'power', accent: 'from-violet-500 to-fuchsia-400',
  },
  {
    id: 3, code: 'M-03', title: 'ตามรอยเส้นทางข้อมูล', en: 'Trace the Data Route',
    objective: 'ลากอุปกรณ์เข้ากลุ่ม Input, Processing, Storage, Output และ Communication จากนั้นเรียงเส้นทางข้อมูลให้ระบบกลับมาทำงาน', lo: 2, gameplay: 'จัดทีมอุปกรณ์ · ต่อสายข้อมูล',
    skill: 'จัดประเภท · ต่อเส้นทาง · ทดลองรันระบบ', reward: 'เส้นทางข้อมูลสมบูรณ์', icon: 'route', accent: 'from-amber-500 to-orange-400',
  },
  {
    id: 4, code: 'M-04', title: 'ใครทำหน้าที่อะไร?', en: 'Who Does What?',
    objective: 'อ่านอาการและค่าจากเครื่องจำลอง เลือกอุปกรณ์ที่เกี่ยวข้อง แล้วอธิบายหน้าที่ของ CPU, RAM, GPU และ Storage ก่อนตัดสินใจแก้ปัญหา', lo: 3, gameplay: 'ภารกิจศูนย์ซ่อมหลายเคส',
    skill: 'อ่านค่าระบบ · เลือกอะไหล่ · ทดสอบการซ่อม', reward: 'Badge: Hardware Analyst', icon: 'wrench', accent: 'from-emerald-500 to-teal-400',
  },
  {
    id: 5, code: 'M-05', title: 'แฟ้มลับนักสืบอะไหล่', en: 'Parts Detective: Clue Cards',
    objective: 'อ่านแฟ้มหลักฐานด้านรูปร่าง หน้าที่ และประเภท แล้วเลือกชิ้นส่วนที่ตรงที่สุด คำตอบผิดจะปลดล็อกเบาะแสเพิ่ม', lo: 4, gameplay: 'เกมสืบสวนจากการ์ดหลักฐาน',
    skill: 'เทียบลักษณะ · ใช้เหตุผล · บริหารจำนวนคำใบ้', reward: 'แฟ้มภาพจำอุปกรณ์', icon: 'scan', accent: 'from-rose-500 to-pink-400',
  },
  {
    id: 6, code: 'M-06', title: 'รับงานจากลูกค้า', en: 'Client Job',
    objective: 'รับโจทย์ลูกค้า อ่านลักษณะงานและงบ เลือกอุปกรณ์ที่จำเป็นให้พอดี แล้วชี้แจงเหตุผลและข้อแลกเปลี่ยน', lo: 5, gameplay: 'เวิร์กช็อปรับออเดอร์ประกอบ PC',
    skill: 'ประกอบสเปก · คุมงบ · อธิบายเหตุผลให้ลูกค้า', reward: 'Badge: Hardware Planner', icon: 'briefcase', accent: 'from-indigo-500 to-blue-400',
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
