import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { technicianProfile, useStore } from '../store';
import { Btn, Card, Feedback, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { BuddyBot } from '../components/BuddyBot';
import { useBuddyTopic } from '../components/Buddy';

const QUESTIONS = [
  { key: 'learned', q: 'What did I learn?', th: 'ฉันได้เรียนรู้อะไร', chips: ['ความหมายของ Hardware', '5 ประเภทของ Hardware', 'หน้าที่ของ CPU / RAM / GPU / Storage', 'การเลือกสเปกให้เหมาะกับงาน'] },
  { key: 'difficult', q: 'What was difficult?', th: 'อะไรที่ยาก', chips: ['แยก RAM กับ Storage', 'อ่านค่า Diagnostic', 'จัดสเปกให้อยู่ในงบ', 'ระบุอุปกรณ์จากภาพ'] },
  { key: 'solved', q: 'How did I solve it?', th: 'ฉันแก้ปัญหาอย่างไร', chips: ['ทบทวนใน Learning Center', 'ดูหลักฐานใน Evidence Board', 'ใช้ Hint / AI Buddy', 'ทดลองซ้ำหลายครั้ง'] },
  { key: 'apply', q: 'Where can I use this knowledge?', th: 'จะนำความรู้ไปใช้ที่ไหน', chips: ['ซ่อม/ดูแลคอมพิวเตอร์ที่บ้าน', 'ช่วยเพื่อนเลือกซื้อคอมพิวเตอร์', 'ฝึกงานร้านคอมพิวเตอร์', 'เรียนวิชาต่อไป'] },
] as const;

type Key = (typeof QUESTIONS)[number]['key'];

export function Reflection() {
  const { state, saveReflection, go } = useStore();
  const [ans, setAns] = useState<Record<Key, string>>({
    learned: state.reflection?.learned ?? '',
    difficult: state.reflection?.difficult ?? '',
    solved: state.reflection?.solved ?? '',
    apply: state.reflection?.apply ?? '',
  });
  const [showProfile, setShowProfile] = useState(!!state.reflection);

  useBuddyTopic(
    {
      scope: null,
      hint: 'ไม่มีคำตอบผิดใน Reflection — แตะตัวเลือกช่วยเริ่มต้น แล้วเติมคำของตัวเองได้',
      evidence: ['เปิด Evidence Board ดูว่าภารกิจไหนที่คุณใช้เวลานานที่สุด'],
      lesson: { text: 'การสะท้อนคิดช่วยให้จำได้นานขึ้นและรู้ว่าควรทบทวนอะไรต่อ' },
    },
    [],
  );

  const ready = QUESTIONS.every((q) => ans[q.key].trim().length >= 5);
  const profile = technicianProfile(state);

  const addChip = (k: Key, chip: string) =>
    setAns((a) => ({ ...a, [k]: a[k].includes(chip) ? a[k] : a[k].trim() ? `${a[k].trim()}, ${chip}` : chip }));

  return (
    <Shell title="Reflection · สะท้อนการเรียนรู้">
      <div className="mx-auto max-w-3xl space-y-4">
        {!showProfile ? (
          <>
            <div className="flex items-start gap-3 rounded-3xl bg-white/70 p-3 ring-1 ring-slate-100">
              <BuddyBot className="h-10 w-10 shrink-0" />
              <p className="text-sm text-slate-700">ตอบสั้น ๆ 4 ข้อ ใช้เวลาไม่ถึง 3 นาที แตะตัวเลือกเพื่อเริ่ม แล้วเขียนเพิ่มได้ตามต้องการ</p>
            </div>
            {QUESTIONS.map((q, i) => (
              <Card key={q.key}>
                <p className="font-display text-lg font-bold text-slate-900">{i + 1}. {q.q}</p>
                <p className="text-sm text-slate-500">{q.th}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {q.chips.map((c) => (
                    <button key={c} onClick={() => addChip(q.key, c)} className={cx('rounded-full px-3 py-1 text-sm ring-1', ans[q.key].includes(c) ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>
                      {c}
                    </button>
                  ))}
                </div>
                <textarea value={ans[q.key]} onChange={(e) => setAns((a) => ({ ...a, [q.key]: e.target.value }))} rows={2} aria-label={q.q} className="mt-3 w-full rounded-2xl bg-slate-50 p-3 outline-none ring-2 ring-slate-200 focus:ring-indigo-400" />
              </Card>
            ))}
            <div className="flex justify-end">
              <Btn variant="success" disabled={!ready} onClick={() => { saveReflection(ans); setShowProfile(true); }}>
                บันทึก Reflection <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Btn>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Feedback kind="complete" title="Reflection Completed">ขอบคุณที่สะท้อนการเรียนรู้ของตัวเอง 🙌</Feedback>
            <Card>
              <p className="text-xs font-bold tracking-[0.2em] text-indigo-500">TECHNICIAN PROFILE</p>
              <p className="font-display text-xl font-bold text-slate-900">{state.player?.name}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {profile.map((p) => (
                  <div key={p.key} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-baseline justify-between">
                      <p className="font-semibold text-slate-800">{p.key}</p>
                      <p className="font-display text-xl font-bold text-indigo-600 tabular-nums">{p.value}</p>
                    </div>
                    <p className="text-xs text-slate-500">{p.th}</p>
                    <div className="mt-2 flex gap-1" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={cx('h-2 flex-1 rounded-full', p.value >= (i + 1) * 20 - 10 ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-slate-200')} />
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-600">{p.value >= 80 ? 'จุดแข็งของคุณ' : p.value >= 60 ? 'กำลังพัฒนาได้ดี' : 'โอกาสในการพัฒนาต่อ'}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">โปรไฟล์นี้สะท้อนการเรียนรู้ของคุณเอง ไม่ใช่การจัดอันดับผู้เรียน</p>
            </Card>
            <div className="flex flex-wrap justify-end gap-3">
              <Btn variant="secondary" onClick={() => setShowProfile(false)}>แก้ไข Reflection</Btn>
              <Btn onClick={() => go({ name: 'certificate' })}>ไป Certificate <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>
            </div>
          </motion.div>
        )}
      </div>
    </Shell>
  );
}
