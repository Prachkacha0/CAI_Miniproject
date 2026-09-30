# Hardware Quest — PC Build Lab Overhaul

## Learning mission alignment (30 Sep 2026)

Mission 1–6 have been aligned to five hardware learning outcomes: hardware meaning (M1–M2), functional categories (M3), component names/functions (M4), visual identification (M5), and selecting hardware for a task (M6). Assessment and progress indicators use the same five outcomes. See [MISSION_DESIGN.md](./MISSION_DESIGN.md) for each mission's activity, evidence of learning, and feedback flow.

## Role and teacher access-code update (30 Sep 2026)

- Keep only Student and Teacher roles; remove Admin role and the Admin-controlled Teacher PIN panel.
- Teachers create a free-form text passphrase on first use and confirm it on later sign-ins. It accepts letters, numbers, and symbols without an 8-character maximum.
- Migrate any saved Admin session to Teacher and reuse its former access hash when there is no teacher hash, preserving existing classrooms.
- Limit teachers to managing classrooms they own.
- Access codes remain local browser protection, not server-grade authentication.

## Teacher registration update (30 Sep 2026)

- Add separate Teacher sign-in and Teacher registration modes on the role selection screen.
- Each teacher can register a unique account name and an individual free-form password (minimum 4 characters; no maximum length), then sign in with those credentials.
- Store teacher accounts alongside local game data and keep classroom management scoped to the matching teacher name.
- Existing single shared teacher/Admin access hashes are migrated to an account when the matching teacher session is still available.

อัปเดตเมื่อ: 29 กันยายน 2026

## ภาพรวม

เพิ่มโหมดเกมประกอบคอมแบบโต้ตอบ `PC BUILD LAB` เข้าใน Hardware Quest โดยยังคงระบบภารกิจการเรียนรู้เดิมไว้ ผู้เล่นสามารถเข้าโหมดใหม่จากหน้าหลัก หรือเปิดลิงก์ `#/builder` ได้โดยตรง

วงจรการเล่นหลัก:

1. รับโจทย์และงบจากลูกค้า
2. เลือกชิ้นส่วนจากคลังอะไหล่
3. ติดตั้งลงช่องภายในเคสตามหมวดหมู่
4. อ่านผลตรวจ Compatibility แบบเรียลไทม์
5. กด `POWER ON` เพื่อทำ POST
6. รับคะแนนและดาว พร้อมย้อนกลับไปปรับสเปกให้ดีขึ้น

## เนื้อหาใหม่

- โจทย์ลูกค้า 3 ระดับ
  - `Streamer Starter` — เกมและสตรีม 1080p ภายใต้งบ 33,000 บาท
  - `Creator Studio` — ตัดต่อ 4K, Multitasking และพื้นที่อย่างน้อย 2TB
  - `Arena Pro` — เฟรมเรตสูง ความร้อนต่ำ และกำลังไฟมีระยะสำรอง
- ชิ้นส่วนสมมติที่อิงข้อจำกัดจริง 24 รายการ
- หมวดติดตั้ง 8 หมวด: Case, Motherboard, CPU, RAM, GPU, Storage, PSU และ Cooling
- ปุ่ม `ชุดฝึกสอน` สำหรับโหลดสเปกตัวอย่างที่ผ่านทุกกฎ
- บันทึกคะแนนสูงสุดแยกตามโจทย์ด้วย Local Storage

## First-Person 3D Assembly

อัปเกรดโต๊ะประกอบจากแผง 2D เป็นฉาก WebGL 3D ด้วย Three.js และ React Three Fiber:

### Realism Pass — มือและอุปกรณ์

- เปลี่ยนมือเดิมเป็นมือแบบแยกข้อต่อ นิ้วแต่ละนิ้วมี MCP/PIP/DIP และค่อย ๆ งอตามสถานะ `relaxed`, `hold`, `press`, `open`
- ตอนหยิบอะไหล่นิ้วจะกำชิ้นงาน ตอนกดติดตั้งจะเปลี่ยนท่าจับ และคลายมือเมื่อวางเสร็จ
- เพิ่มเล็บ ข้อนิ้ว ฝ่ามือ ข้อมือ และวัสดุผิวที่ตอบสนองต่อแสง เพื่อให้มืออ่านรูปทรงได้ชัดขึ้น
- เพิ่มรายละเอียดโมเดล Motherboard, CPU, RAM, GPU, M.2 SSD, PSU, Cooler และ Case เช่น Socket, DIMM slot, PCIe, Capacitor, NAND, Heatpipe, Connector, กระจก และพัดลมหลายใบ
- ใช้วัสดุ PBR แยกโลหะ พลาสติก แผงวงจร ทองแดง กระจก และผิวเคลือบ พร้อม ACES Filmic Tone Mapping
- เพิ่ม Studio Lightformers, Hemisphere light, เงาความละเอียดสูง และ Contact Shadow เพื่อเพิ่มมิติของชิ้นส่วน
- พัดลม GPU, PSU, Cooler และ Case มีใบพัด/วงแหวนแยกชิ้น และหยุดนิ่งตามสภาพจริงระหว่างที่เครื่องยังไม่เปิด
- ปรับลำดับการติดตั้งไม่ให้มือชุดปกติซ้อนกับมือแอนิเมชัน และไม่ย่อขนาดมือไปพร้อมกับอะไหล่

### Easy Drag & Drop

- การ์ดอะไหล่ทุกใบลากจากคลังมาวางบนพื้นที่ประกอบได้โดยตรง
- พื้นที่ประกอบทั้งแผงเป็น Drop Zone ไม่ต้องเล็งช่องขนาดเล็ก และมีกรอบสีเขียวบอกสถานะก่อนปล่อย
- เมื่อปล่อย ระบบจะ Snap อะไหล่เข้าหมวดที่ถูกต้องและเล่นแอนิเมชันมือประกอบให้อัตโนมัติ
- ในฉาก 3D สามารถแตะพื้นที่ภายในเคสบริเวณใดก็ได้เพื่อติดตั้งชิ้นส่วนที่ถืออยู่
- เพิ่มปุ่ม `ติดตั้งอัตโนมัติ` ขนาดใหญ่เป็นทางเลือกสำหรับมือถือ จอสัมผัส คีย์บอร์ด และผู้เล่นที่ไม่สะดวกลาก
- การแตะเลือกแล้วแตะช่องแบบเดิมยังใช้งานได้ เพื่อไม่บังคับให้ใช้ Gesture เพียงอย่างเดียว

### Distinct Installation Motion

- เพิ่ม Motion Profile แยกครบ 8 หมวด โดยกำหนดระยะเวลา จุดพัก มุมเอียง จังหวะกด และระยะคลายมือเฉพาะอุปกรณ์
- CPU ลอยจัดแนวเหนือ Socket แล้วลดตรงอย่างช้า ๆ ก่อนกดล็อก
- RAM เข้าจากด้านบน เอียงเล็กน้อย และกดให้เกิดจังหวะ Snap
- GPU เข้าจากด้านข้างพร้อมมุม Nose-down ก่อนเลื่อนลง PCIe
- M.2 SSD เสียบด้วยมุมประมาณ 30 องศา แล้วกดนอนราบ
- PSU เลื่อนตามแนวรางด้านล่าง ส่วน Motherboard และ Cooler มีจังหวะกด/คืนตัวหลังแตะ Standoff หรือ CPU
- Case ลงจากด้านบนพร้อมระยะยุบเล็กน้อย ส่วนมือจะปรับระยะจับตามขนาดอุปกรณ์และถอยออกหลังปล่อย
- จุดเริ่มของแอนิเมชันคำนวณจากตำแหน่งกล้องจริง ลดอาการวัตถุกระโดดเมื่อเริ่มติดตั้ง

### Focused Builder UI

- PC Build Lab เข้าถึงได้จากหน้า Home และลิงก์ `#/builder` โดยตรง ขณะที่เส้นทางบทเรียนเดิมยังทำงานครบ
- หน้า Builder ใช้พื้นที่เล่นแบบกระชับ ส่วน Learning Center, Evidence และ AI Buddy อยู่ใน Navigation/Overlay ที่เปิดเมื่อจำเป็น
- ตัด Hero ขนาดใหญ่, Scenario Card 3 ใบ, Metrics 4 กล่อง, Build Sequence และ Diagnostics หลายรายการ
- รวมโจทย์ งบ กำลังไฟ และสถานะ Compatibility เป็น HUD สั้นด้านบนและแถบสถานะด้านล่าง
- ลด Layout จาก 3 คอลัมน์เหลือ 2 ส่วนหลัก: คลังอะไหล่และโต๊ะประกอบ
- เอาถาดอะไหล่ 3D ที่ซ้ำกับคลังด้านซ้ายออก ลดทั้งความรกและจำนวนโมเดลที่ต้องเรนเดอร์
- ใช้สวิตช์ 2D/3D แบบย่อ และโหมด 2D ยังคงทำงานเป็น Fallback เมื่อ WebGL ล้มเหลว

### Restored Legacy Features

- คืนหน้า Home, Pre/Post Test, Mission 01–06, Final Case, Learning Center, Hardware Lab, Evidence, Progress, Reflection และ Certificate เป็นเส้นทางเริ่มต้นเดิม
- คืน Navigation bar, Learning Center drawer, Evidence Board drawer และ AI Buddy ในหน้า Builder
- คืนสวิตช์ `3D / 2D` เพื่อให้ผู้เล่นเลือกโหมดช่วยเล่นได้เอง
- คืนข้อมูล Live Diagnostics และ Build Sequence ในแผงพับ `รายละเอียดระบบและลำดับประกอบ` เพื่อเก็บความสามารถเดิมโดยไม่เพิ่มความรกตลอดเวลา
- งานโมเดล 3D, แอนิเมชันเฉพาะอุปกรณ์, Drag & Drop และ HUD แบบกระชับยังคงอยู่ทั้งหมด

### Model Detail Pass 2

- แก้ใบพัดที่เคยซ้อนกันให้กระจายรอบแกนจริง พร้อมวงแหวน Grill สองชั้น
- เพิ่ม VRM heatsink, 24-pin connector, mounting holes และ standoff detail บนเมนบอร์ด
- เพิ่มรอยสลักและ Triangle marker บน CPU
- เพิ่มครีบ Heatsink ภายใน GPU และปรับความยาวโมเดลตามสเปกจริงของแต่ละการ์ด
- RAM ความจุ 64GB แสดง 4 แถว ต่างจากชุด 16/32GB
- เพิ่มโมเดล AIO แยกจาก Air Cooler พร้อม Radiator, พัดลมคู่, Pump block และท่อน้ำโค้ง
- เพิ่มช่องจ่ายไฟและ AC socket บน PSU พร้อมปรับตำแหน่ง CPU/RAM/Cooler ให้ตรงกับเมนบอร์ดมากขึ้น

- กล้องมุมมองช่างแบบบุคคลที่หนึ่ง ลากเมาส์หรือนิ้วเพื่อปรับมุมมองได้
- แสดงมือซ้ายและขวาแบบ Articulated 3D อยู่ด้านหน้ากล้อง
- อะไหล่ที่เลือกจะถูกยกขึ้นมาถือระหว่างมือ
- มีถาดอะไหล่ 3D ซึ่งสามารถแตะเพื่อหยิบชิ้นส่วนได้จากในฉาก
- จุดติดตั้งภายในเคสเป็นวัตถุ 3D พร้อม Raycast, Hover และป้ายกำกับ
- เมื่อติดตั้ง มือและอะไหล่จะเคลื่อนจากด้านหน้ากล้องเข้าสู่ตำแหน่งจริงในเคส
- สามารถลากมุมกล้อง ซูมเล็กน้อย ถอดอะไหล่ และติดตั้งใหม่ได้
- ลดการส่ายกล้องและย่อเวลาแอนิเมชันอัตโนมัติเมื่อระบบเปิด `prefers-reduced-motion`
- มีคำแนะนำการควบคุมและสถานะชิ้นส่วนที่กำลังถือซ้อนบน Canvas
- มีสวิตช์ `3D มือช่าง / 2D ช่วยเล่น`; โหมด 2D ยังรองรับคีย์บอร์ดและเป็น Fallback เมื่อ WebGL ใช้งานไม่ได้
- ฉาก 3D ถูก Lazy-load แยกจาก Bundle หลัก ผู้เล่นโหมดอื่นจึงไม่ต้องโหลด Three.js

## กฎ Compatibility

ตัวตรวจสอบเป็น Pure Function ใน `src/game/pcBuilder.ts` และส่งผลลัพธ์เป็น `block`, `warn` หรือ `good`

| กฎ | ผลเมื่อไม่ผ่าน |
|---|---|
| CPU Socket ต้องตรงกับเมนบอร์ด | Block |
| DDR4/DDR5 ต้องตรงกับเมนบอร์ด | Block |
| Form Factor ของเมนบอร์ดต้องใส่เคสได้ | Block |
| ความยาว GPU ต้องไม่เกินพื้นที่เคส | Block |
| ความสูงชุดระบายความร้อนต้องไม่เกินพื้นที่เคส | Block |
| Cooling Capacity ต้องรองรับ TDP ของ CPU | Block |
| PSU ต้องจ่ายไฟรวมได้เพียงพอ | Block |
| กำลังไฟสำรองต่ำกว่า 25% | Warning |
| ราคาเกินงบ | Warning |
| Gaming / Creator / Storage ต่ำกว่าเป้าหมาย | Warning |

## ระบบคะแนน

คะแนนเต็ม 100 แบ่งเป็น:

- ความเหมาะสมกับโจทย์ 45%
- การคุมงบ 25%
- ประสิทธิภาพการระบายความร้อน 15%
- ระยะสำรองของกำลังไฟ 15%
- หักคะแนนตามจำนวน Warning

แต่ละเป้าหมายถูกจำกัดสัดส่วนไว้ที่ 100% ก่อนนำมาเฉลี่ย เพื่อไม่ให้ค่าที่สูงมากด้านหนึ่งชดเชยข้อกำหนดอีกด้านที่ยังไม่ครบ

## งานออกแบบและ UX

- หน้าตา Workbench โทนกรมท่า พร้อมแสง Cyan/Green/Red แยกสถานะอย่างชัดเจน
- ใช้ Lucide SVG ทั้งระบบ ไม่มี Emoji เป็นไอคอนโครงสร้าง
- รองรับเมาส์ สัมผัส และคีย์บอร์ด
- ช่องติดตั้งมี Accessible Name และสถานะปิดใช้งาน
- ขนาดปุ่มหลักไม่น้อยกว่า 44px
- มี Focus Ring ที่มองเห็นได้
- มีข้อความกำกับสถานะ ไม่สื่อสารด้วยสีเพียงอย่างเดียว
- POST มี Loading Feedback และ Live Region สำหรับ Screen Reader
- รองรับ `prefers-reduced-motion` จากระบบ CSS เดิม
- Responsive: เดสก์ท็อปใช้สามคอลัมน์ ส่วนมือถือเรียง Brief → โต๊ะประกอบ → คลังชิ้นส่วน → Diagnostics

Design System ถูกบันทึกไว้ที่ `design-system/hardware-quest/MASTER.md`

## ไฟล์ที่เพิ่มหรือแก้ไข

- `src/game/pcBuilder.ts` — โมเดลข้อมูล, Catalog, Scenario, Compatibility และ Scoring
- `src/game/pcBuilder.test.ts` — ชุดทดสอบกฎหลัก
- `src/screens/PCBuilder.tsx` — หน้าจอเกมประกอบคอมและ POST sequence
- `src/components/BuilderScene3D.tsx` — ฉาก Workbench, มือ, โมเดลอะไหล่, กล้อง และแอนิเมชันติดตั้ง 3D
- `src/App.tsx` — Route และการแสดงหน้าจอ Builder
- `src/store.tsx` — Hash route `#/builder` และการล้าง Builder progress เมื่อ Reset
- `src/screens/Home.tsx` — Banner และเมนูเข้า PC Build Lab
- `src/components/Shell.tsx` — ปรับ Navigation บนหน้าจอเล็ก
- `src/quest.css` — Interaction style ของปุ่มใน Workbench
- `package.json` — เพิ่มคำสั่งทดสอบ

## การตรวจสอบ

คำสั่งที่ใช้:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

ผลที่คาดหวัง:

- TypeScript ไม่มี Error
- ชุดทดสอบทุกข้อผ่าน
- Production build สำเร็จ

มีการตรวจภาพจริงด้วย Microsoft Edge ที่ขนาด 1440×1000 และ 375×900 เพื่อดู Layout, การตัดข้อความ และลำดับเนื้อหา Responsive

ฉาก 3D ได้รับการตรวจด้วย Microsoft Edge WebGL/SwiftShader ที่ขนาด 1440×1500 เพื่อตรวจเคส มือผู้เล่น ถาดอะไหล่ และจุดติดตั้ง

## วิธีใช้งาน

```powershell
npm.cmd run dev
```

เปิด `http://localhost:5174/#/builder` สำหรับเซิร์ฟเวอร์ที่กำลังรันอยู่ในเครื่องนี้ หรือใช้พอร์ตที่ Vite แสดงใน Terminal

## ปรับโครงสร้างหน้าหลักและบัญชี (กันยายน 2026)

- ย้ายแผนที่ Mission 01–06 และ Final Case มาแสดงในหน้าหลักโดยตรง ผู้เล่นไม่ต้องเปิดหน้า Mission Map แยกอีกต่อไป
- ลบ route หน้าแผนที่เดิมออก และเปลี่ยนลิงก์เก่า `#/map` ให้กลับหน้าหลักโดยอัตโนมัติ
- เพิ่มหน้า `บัญชีของฉัน` สำหรับข้อมูลผู้เล่น โปรไฟล์ทักษะ Badge ความก้าวหน้า และสถานะเงื่อนไขใบประกาศ
- ย้ายจุดรับ/เปิดใบประกาศออกจากเมนูหลักมาไว้ในบัญชี โดยปุ่มจะเปิดเมื่อผ่าน Mission ทั้งหมด, Final Case, Post-Test และ Reflection
- เพิ่มทางเข้าบัญชีทั้งในการ์ดหน้าหลักและแถบนำทาง เพื่อให้เข้าถึงได้จากหน้าภารกิจ
- ปรับปุ่มออกจากภารกิจและปุ่มจบภารกิจให้กลับหน้าหลักซึ่งมีแผนที่รวมอยู่แล้ว

ไฟล์สำคัญที่แก้ไข: `src/screens/Home.tsx`, `src/screens/MissionMap.tsx`, `src/screens/Account.tsx`, `src/screens/Certificate.tsx`, `src/App.tsx`, `src/store.tsx`, `src/components/Shell.tsx` และ `src/missions/common.tsx`

## ระบบ Role และ Classroom Gate (กันยายน 2026)

- หน้า Login รองรับ 3 บทบาท: นักเรียน, ครูผู้สอน และผู้ดูแลระบบ
- ระบบมีเพียง 2 บทบาท: นักเรียนและครูผู้สอน ครูตั้งรหัสผ่านข้อความได้เองในครั้งแรกและใช้ยืนยันตัวตนครั้งถัดไป โดยไม่จำกัดเฉพาะตัวเลขหรือความยาว 8 ตัว (เก็บเป็นค่าแฮชในเบราว์เซอร์)
- นักเรียนเลือกเรียนแบบอิสระได้โดยไม่กรอกรหัสห้อง ซึ่งจะเปิดให้เลือกทุก Mission
- นักเรียนที่กรอกรหัสห้องต้องใช้รหัสที่มีอยู่จริง และระบบจะผูกกลุ่มเรียนตามห้องนั้นอัตโนมัติ
- ครูสร้างห้องเรียนและรหัสห้อง กำหนดว่าเปิดถึง Mission ใด เปิด/ปิด Final Case และพักการใช้งานห้องได้
- ผู้ดูแลระบบมองเห็นและควบคุมทุกห้อง ส่วนครูควบคุมได้เฉพาะห้องที่ตนเองสร้าง
- เพิ่ม Route Guard ป้องกันนักเรียนเข้าศูนย์ควบคุม และป้องกันครู/ผู้ดูแลเข้าหน้าเล่นเกมโดยตรง
- แยก session ผู้ล็อกอินต่อแท็บออกจากข้อมูลห้องเรียน เพื่อไม่ให้แท็บครูและนักเรียนเขียนทับบทบาทกัน
- เมื่อออกจากโปรไฟล์นักเรียน ระบบจะล้างความก้าวหน้าของผู้เล่นในเครื่องหลังการยืนยัน เพื่อป้องกันผู้ใช้คนถัดไปรับช่วงคะแนนหรือใบประกาศเดิม
- เพิ่มการซิงก์ข้อมูลห้องและการเปิดด่านระหว่างแท็บผ่าน Storage Event
- ข้อมูลเดิมได้รับการเติม role นักเรียนและโครงสร้างห้องเรียนโดยไม่ลบความก้าวหน้าเดิม
- เพิ่มชุดทดสอบรหัสห้อง บทบาท โหมดอิสระ สถานะเปิดด่าน ห้องที่พักใช้งาน และ Final Case

### ขอบเขตสำคัญ

เวอร์ชันนี้เป็น Classroom Control แบบ Local-first ข้อมูลซิงก์ได้ระหว่างแท็บในเบราว์เซอร์และโปรไฟล์เดียวกัน แต่ยังไม่สามารถซิงก์ครูกับนักเรียนที่ใช้คนละเครื่อง รหัสครูเป็นเพียงชั้นป้องกันในเครื่อง ไม่ใช่ระบบยืนยันตัวตนระดับเซิร์ฟเวอร์ การนำไปใช้หลายเครื่องจริงต้องเชื่อม Backend/Auth และฐานข้อมูลส่วนกลาง เช่น Supabase หรือ Firebase

ไฟล์ระบบหลัก: `src/game/classroom.ts`, `src/game/classroom.test.ts`, `src/screens/ClassroomControl.tsx`, `src/screens/Start.tsx`, `src/types.ts`, `src/store.tsx` และ `src/App.tsx`
