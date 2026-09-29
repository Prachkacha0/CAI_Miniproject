export type PartCategory = 'case' | 'motherboard' | 'cpu' | 'ram' | 'gpu' | 'storage' | 'psu' | 'cooler';

export interface PcPart {
  id: string;
  category: PartCategory;
  name: string;
  series: string;
  price: number;
  color: string;
  description: string;
  socket?: 'AM5' | 'LGA1700';
  ramType?: 'DDR4' | 'DDR5';
  formFactor?: 'ATX' | 'mATX';
  supportedForms?: ('ATX' | 'mATX')[];
  capacityGb?: number;
  storageGb?: number;
  gpuScore?: number;
  workScore?: number;
  tdp?: number;
  wattage?: number;
  maxGpuLength?: number;
  length?: number;
  maxCoolerHeight?: number;
  height?: number;
  coolingCapacity?: number;
}

export type Build = Partial<Record<PartCategory, PcPart>>;
export type IssueSeverity = 'block' | 'warn' | 'good';

export interface BuildIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  detail: string;
  categories: PartCategory[];
}

export interface BuildScenario {
  id: string;
  title: string;
  client: string;
  role: string;
  brief: string;
  budget: number;
  minGaming: number;
  minWork: number;
  minStorage: number;
  accent: string;
  difficulty: 'มือใหม่' | 'ช่างฝึกหัด' | 'มือโปร';
}

export const CATEGORY_ORDER: PartCategory[] = ['case', 'motherboard', 'cpu', 'ram', 'gpu', 'storage', 'psu', 'cooler'];

export const CATEGORY_LABELS: Record<PartCategory, { th: string; en: string }> = {
  case: { th: 'เคส', en: 'Case' },
  motherboard: { th: 'เมนบอร์ด', en: 'Motherboard' },
  cpu: { th: 'ซีพียู', en: 'CPU' },
  ram: { th: 'แรม', en: 'Memory' },
  gpu: { th: 'การ์ดจอ', en: 'Graphics' },
  storage: { th: 'ที่เก็บข้อมูล', en: 'Storage' },
  psu: { th: 'พาวเวอร์ซัพพลาย', en: 'Power' },
  cooler: { th: 'ชุดระบายความร้อน', en: 'Cooling' },
};

export const SCENARIOS: BuildScenario[] = [
  {
    id: 'starter-stream', title: 'Streamer Starter', client: 'มินท์', role: 'สตรีมเมอร์มือใหม่',
    brief: 'อยากสตรีมเกม 1080p ให้ลื่น เก็บคลิปได้เยอะ และเหลืองบซื้อไมค์ใหม่', budget: 33000,
    minGaming: 70, minWork: 48, minStorage: 1000, accent: '#22d3ee', difficulty: 'มือใหม่',
  },
  {
    id: 'creator-studio', title: 'Creator Studio', client: 'ทีม PIXEL LAB', role: 'สตูดิโอตัดต่อ',
    brief: 'เครื่องทำงานหลายโปรแกรม ตัดต่อ 4K และต้องมีพื้นที่โปรเจกต์อย่างน้อย 2TB', budget: 51000,
    minGaming: 78, minWork: 86, minStorage: 2000, accent: '#a78bfa', difficulty: 'ช่างฝึกหัด',
  },
  {
    id: 'arena-pro', title: 'Arena Pro', client: 'ทีม NOVA', role: 'นักกีฬาอีสปอร์ต',
    brief: 'เน้นเฟรมเรตสูงสุด ความร้อนต้องเอาอยู่ และห้ามเสี่ยงไฟไม่พอระหว่างแข่ง', budget: 60000,
    minGaming: 105, minWork: 68, minStorage: 1000, accent: '#fb7185', difficulty: 'มือโปร',
  },
];

export const PARTS: PcPart[] = [
  { id: 'case-pulse', category: 'case', name: 'Pulse Mini', series: 'mATX AIR', price: 1700, color: '#38bdf8', description: 'เคสเล็ก ระบายอากาศดี', supportedForms: ['mATX'], maxGpuLength: 285, maxCoolerHeight: 155 },
  { id: 'case-forge', category: 'case', name: 'Forge Flow', series: 'ATX MESH', price: 2800, color: '#818cf8', description: 'เคสตะแกรงกว้าง ประกอบง่าย', supportedForms: ['ATX', 'mATX'], maxGpuLength: 355, maxCoolerHeight: 175 },
  { id: 'case-aurora', category: 'case', name: 'Aurora Glass', series: 'ATX PANORAMA', price: 4200, color: '#f472b6', description: 'กระจกพาโนรามาพร้อมแสง ARGB', supportedForms: ['ATX', 'mATX'], maxGpuLength: 380, maxCoolerHeight: 180 },

  { id: 'mb-breeze', category: 'motherboard', name: 'Breeze B650M', series: 'AM5 · DDR5 · mATX', price: 4500, color: '#22d3ee', description: 'บอร์ดคุ้มค่า อัปเกรดต่อได้', socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' },
  { id: 'mb-prime', category: 'motherboard', name: 'Prime B760', series: 'LGA1700 · DDR5 · ATX', price: 5700, color: '#a78bfa', description: 'ภาคจ่ายไฟพร้อมงานหนัก', socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX' },
  { id: 'mb-legacy', category: 'motherboard', name: 'Legacy B660M', series: 'LGA1700 · DDR4 · mATX', price: 3600, color: '#94a3b8', description: 'ประหยัดด้วยหน่วยความจำ DDR4', socket: 'LGA1700', ramType: 'DDR4', formFactor: 'mATX' },

  { id: 'cpu-r5', category: 'cpu', name: 'Ryzen 5 7600', series: '6C/12T · AM5', price: 6900, color: '#fb923c', description: 'เล่นเกมดีและกินไฟน้อย', socket: 'AM5', gpuScore: 78, workScore: 64, tdp: 65 },
  { id: 'cpu-i5', category: 'cpu', name: 'Core i5 13600K', series: '14C/20T · LGA1700', price: 9900, color: '#60a5fa', description: 'พลังหลายคอร์สำหรับครีเอเตอร์', socket: 'LGA1700', gpuScore: 88, workScore: 94, tdp: 125 },
  { id: 'cpu-r7', category: 'cpu', name: 'Ryzen 7 7800X3D', series: '8C/16T · AM5', price: 13900, color: '#f97316', description: 'เฟรมเรตสูงสำหรับการแข่งขัน', socket: 'AM5', gpuScore: 112, workScore: 82, tdp: 120 },

  { id: 'ram-ddr4-32', category: 'ram', name: 'Vector 32GB', series: 'DDR4 · 3200', price: 2100, color: '#34d399', description: 'ความจุคุ้มราคาสำหรับ DDR4', ramType: 'DDR4', capacityGb: 32, workScore: 12 },
  { id: 'ram-ddr5-16', category: 'ram', name: 'Nova 16GB', series: 'DDR5 · 5600', price: 1900, color: '#2dd4bf', description: 'ชุดเริ่มต้นความเร็วสูง', ramType: 'DDR5', capacityGb: 16, workScore: 8 },
  { id: 'ram-ddr5-32', category: 'ram', name: 'Nova 32GB', series: 'DDR5 · 6000', price: 3400, color: '#22c55e', description: 'สมดุลสำหรับเกมและงานสร้างสรรค์', ramType: 'DDR5', capacityGb: 32, workScore: 18 },
  { id: 'ram-ddr5-64', category: 'ram', name: 'Titan 64GB', series: 'DDR5 · 6000', price: 6400, color: '#84cc16', description: 'พร้อมโปรเจกต์ขนาดใหญ่', ramType: 'DDR5', capacityGb: 64, workScore: 30 },

  { id: 'gpu-spark', category: 'gpu', name: 'Spark RX 7600', series: '8GB · 260mm', price: 9500, color: '#f43f5e', description: 'ลื่นไหลที่ 1080p', gpuScore: 74, workScore: 12, wattage: 165, length: 260 },
  { id: 'gpu-ray', category: 'gpu', name: 'Ray RTX 4070', series: '12GB · 300mm', price: 19200, color: '#4ade80', description: 'แรงพร้อมงานเรนเดอร์และสตรีม', gpuScore: 108, workScore: 24, wattage: 200, length: 300 },
  { id: 'gpu-arc', category: 'gpu', name: 'Arcade RTX 4060', series: '8GB · 245mm', price: 11500, color: '#8b5cf6', description: 'ประหยัดไฟ ได้เทคโนโลยีเฟรมเสริม', gpuScore: 82, workScore: 18, wattage: 115, length: 245 },

  { id: 'ssd-1', category: 'storage', name: 'FlashCore 1TB', series: 'NVMe Gen4', price: 2200, color: '#facc15', description: 'โหลดเกมและวินโดวส์รวดเร็ว', storageGb: 1000, workScore: 4 },
  { id: 'ssd-2', category: 'storage', name: 'FlashCore 2TB', series: 'NVMe Gen4', price: 3900, color: '#f59e0b', description: 'พื้นที่กว้างสำหรับคลิปและโปรเจกต์', storageGb: 2000, workScore: 8 },
  { id: 'ssd-4', category: 'storage', name: 'Creator 4TB', series: 'NVMe Gen4 PRO', price: 7600, color: '#fb7185', description: 'ความจุสูงและเขียนไฟล์ต่อเนื่อง', storageGb: 4000, workScore: 14 },

  { id: 'psu-550', category: 'psu', name: 'Eco 550W', series: '80+ Bronze', price: 1800, color: '#64748b', description: 'ไฟนิ่งสำหรับเครื่องประหยัดพลังงาน', wattage: 550 },
  { id: 'psu-750', category: 'psu', name: 'Volt 750W', series: '80+ Gold', price: 3200, color: '#eab308', description: 'กำลังสำรองเหมาะกับการอัปเกรด', wattage: 750 },
  { id: 'psu-850', category: 'psu', name: 'Volt 850W', series: '80+ Gold Modular', price: 4300, color: '#f97316', description: 'ถอดสายได้ จัดสายสะอาด', wattage: 850 },

  { id: 'cool-air', category: 'cooler', name: 'AirFin 120', series: '150W · 150mm', price: 1200, color: '#38bdf8', description: 'ฮีตซิงก์ลมเงียบและคุ้มค่า', coolingCapacity: 150, height: 150 },
  { id: 'cool-tower', category: 'cooler', name: 'Frost Twin', series: '220W · 165mm', price: 2400, color: '#67e8f9', description: 'ฮีตซิงก์คู่สำหรับซีพียูแรง', coolingCapacity: 220, height: 165 },
  { id: 'cool-liquid', category: 'cooler', name: 'Glacier 240', series: '280W · AIO', price: 3900, color: '#c084fc', description: 'ชุดน้ำปิดพร้อมแสง ARGB', coolingCapacity: 280, height: 120 },
];

export function buildPrice(build: Build) {
  return Object.values(build).reduce((sum, part) => sum + (part?.price ?? 0), 0);
}

export function buildPower(build: Build) {
  return (build.cpu?.tdp ?? 0) + (build.gpu?.wattage ?? 0) + 110;
}

export function buildPerformance(build: Build) {
  const gaming = Math.round(((build.cpu?.gpuScore ?? 0) * 0.35) + ((build.gpu?.gpuScore ?? 0) * 0.65));
  const work = Math.round((build.cpu?.workScore ?? 0) + (build.ram?.workScore ?? 0) + (build.storage?.workScore ?? 0) + (build.gpu?.workScore ?? 0) * 0.25);
  return { gaming, work, storage: build.storage?.storageGb ?? 0 };
}

export function checkBuild(build: Build, scenario: BuildScenario): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const missing = CATEGORY_ORDER.filter((category) => !build[category]);
  if (missing.length) issues.push({ id: 'missing', severity: 'block', title: 'ยังติดตั้งไม่ครบ', detail: 'เหลือ ' + missing.length + ' ชิ้นส่วนก่อนเปิดเครื่อง', categories: missing });
  if (build.cpu && build.motherboard && build.cpu.socket !== build.motherboard.socket) issues.push({ id: 'socket', severity: 'block', title: 'Socket ไม่ตรงกัน', detail: build.cpu.socket + ' ใส่กับบอร์ด ' + build.motherboard.socket + ' ไม่ได้', categories: ['cpu', 'motherboard'] });
  if (build.ram && build.motherboard && build.ram.ramType !== build.motherboard.ramType) issues.push({ id: 'ram', severity: 'block', title: 'ชนิด RAM ไม่รองรับ', detail: 'เมนบอร์ดต้องใช้ ' + build.motherboard.ramType + ' แต่เลือก ' + build.ram.ramType, categories: ['ram', 'motherboard'] });
  if (build.case && build.motherboard && !build.case.supportedForms?.includes(build.motherboard.formFactor!)) issues.push({ id: 'case-board', severity: 'block', title: 'เมนบอร์ดใหญ่เกินเคส', detail: 'เคสนี้ไม่รองรับขนาด ' + build.motherboard.formFactor, categories: ['case', 'motherboard'] });
  if (build.case && build.gpu && (build.gpu.length ?? 0) > (build.case.maxGpuLength ?? 0)) issues.push({ id: 'gpu-length', severity: 'block', title: 'การ์ดจอยาวเกินไป', detail: String(build.gpu.length) + 'mm เกินพื้นที่เคส ' + String(build.case.maxGpuLength) + 'mm', categories: ['case', 'gpu'] });
  if (build.case && build.cooler && (build.cooler.height ?? 0) > (build.case.maxCoolerHeight ?? 0)) issues.push({ id: 'cooler-height', severity: 'block', title: 'ฮีตซิงก์สูงเกินเคส', detail: String(build.cooler.height) + 'mm เกินพื้นที่เคส ' + String(build.case.maxCoolerHeight) + 'mm', categories: ['case', 'cooler'] });
  if (build.cpu && build.cooler && (build.cooler.coolingCapacity ?? 0) < (build.cpu.tdp ?? 0)) issues.push({ id: 'cooling', severity: 'block', title: 'ระบายความร้อนไม่พอ', detail: 'ชุดระบายรองรับความร้อนไม่ถึงกำลังของ CPU', categories: ['cpu', 'cooler'] });
  const requiredPower = buildPower(build);
  if (build.psu && build.cpu && build.gpu && (build.psu.wattage ?? 0) < requiredPower) issues.push({ id: 'power-block', severity: 'block', title: 'กำลังไฟไม่พอ', detail: 'ต้องใช้ประมาณ ' + requiredPower + 'W แต่ PSU จ่าย ' + build.psu.wattage + 'W', categories: ['psu', 'cpu', 'gpu'] });
  else if (build.psu && build.cpu && build.gpu && (build.psu.wattage ?? 0) < requiredPower * 1.25) issues.push({ id: 'power-warn', severity: 'warn', title: 'กำลังไฟสำรองน้อย', detail: 'ควรเผื่อกำลังไฟอย่างน้อย 25% เพื่อความเสถียร', categories: ['psu'] });
  const price = buildPrice(build);
  if (price > scenario.budget) issues.push({ id: 'budget', severity: 'warn', title: 'เกินงบลูกค้า', detail: 'เกินงบ ' + (price - scenario.budget).toLocaleString('th-TH') + ' บาท', categories: [] });
  const perf = buildPerformance(build);
  if (!missing.length && perf.gaming < scenario.minGaming) issues.push({ id: 'gaming', severity: 'warn', title: 'พลังเกมยังไม่ถึงเป้า', detail: 'เป้าหมาย ' + scenario.minGaming + ' แต่เครื่องนี้ได้ ' + perf.gaming, categories: ['cpu', 'gpu'] });
  if (!missing.length && perf.work < scenario.minWork) issues.push({ id: 'work', severity: 'warn', title: 'พลังงานสร้างสรรค์ยังไม่ถึงเป้า', detail: 'เป้าหมาย ' + scenario.minWork + ' แต่เครื่องนี้ได้ ' + perf.work, categories: ['cpu', 'ram', 'storage'] });
  if (!missing.length && perf.storage < scenario.minStorage) issues.push({ id: 'storage', severity: 'warn', title: 'พื้นที่เก็บข้อมูลไม่พอ', detail: 'ลูกค้าต้องการอย่างน้อย ' + scenario.minStorage / 1000 + 'TB', categories: ['storage'] });
  if (!issues.some((issue) => issue.severity === 'block')) issues.push({ id: 'post', severity: 'good', title: 'พร้อมทำ POST', detail: 'ชิ้นส่วนหลักเข้ากันได้ กดเปิดเครื่องเพื่อทดสอบ', categories: [] });
  return issues;
}

export function scoreBuild(build: Build, scenario: BuildScenario) {
  const issues = checkBuild(build, scenario);
  const perf = buildPerformance(build);
  const price = buildPrice(build);
  const required = buildPower(build);
  const gamingFit = Math.min(1, perf.gaming / scenario.minGaming);
  const workFit = Math.min(1, perf.work / scenario.minWork);
  const storageFit = Math.min(1, perf.storage / scenario.minStorage);
  const fit = Math.round((gamingFit + workFit + storageFit) / 3 * 100);
  const budget = price <= scenario.budget ? Math.max(70, Math.round(100 - ((scenario.budget - price) / scenario.budget) * 35)) : Math.max(20, Math.round(100 - ((price - scenario.budget) / scenario.budget) * 180));
  const thermal = Math.min(100, Math.round(((build.cooler?.coolingCapacity ?? 0) / Math.max(1, build.cpu?.tdp ?? 1)) * 62));
  const power = Math.min(100, Math.round(((build.psu?.wattage ?? 0) / Math.max(1, required * 1.25)) * 100));
  const penalties = issues.filter((issue) => issue.severity === 'warn').length * 7;
  const total = Math.max(0, Math.min(100, Math.round(fit * 0.45 + budget * 0.25 + thermal * 0.15 + power * 0.15 - penalties)));
  return { total, fit, budget, thermal, power, stars: total >= 88 ? 3 : total >= 70 ? 2 : 1 };
}
