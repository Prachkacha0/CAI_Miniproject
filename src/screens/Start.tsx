import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, GraduationCap, KeyRound, Presentation, ShieldCheck, TriangleAlert } from 'lucide-react';
import { hashStaffPin, isStaff, normalizeClassroomCode } from '../game/classroom';
import type { UserRole } from '../types';
import { useStore } from '../store';
import { Btn, cx } from '../components/ui';
import { BuddyBot } from '../components/BuddyBot';

const ROLES: { id: UserRole; label: string; detail: string; Icon: typeof GraduationCap }[] = [
  { id: 'student', label: 'นักเรียน', detail: 'เรียนอิสระหรือเข้าห้องด้วยรหัส', Icon: GraduationCap },
  { id: 'teacher', label: 'ครูผู้สอน', detail: 'สร้างห้องและควบคุมการเปิดด่าน', Icon: Presentation },
  { id: 'admin', label: 'ผู้ดูแลระบบ', detail: 'ดูแลและควบคุมทุกห้องเรียน', Icon: ShieldCheck },
];

export function Start() {
  const { setPlayer, setInitialAdminPin, go, state } = useStore();
  const [role, setRole] = useState<UserRole>(state.player?.role ?? 'student');
  const [name, setName] = useState(state.player?.name ?? '');
  const [group, setGroup] = useState(state.player?.group ?? '');
  const [classroomCode, setClassroomCode] = useState(state.player?.classroomCode ?? '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const ok = name.trim().length >= 2;

  const begin = () => {
    if (!ok) return;
    const code = normalizeClassroomCode(classroomCode);
    if (isStaff(role)) {
      const expectedPinHash = role === 'admin' ? state.adminPinHash : state.teacherPinHash;
      if (!/^\d{4,8}$/.test(pin)) {
        setError(`${role === 'admin' ? 'Admin' : 'Teacher'} PIN ต้องเป็นตัวเลข 4–8 หลัก`);
        return;
      }
      if (!expectedPinHash) {
        if (role !== 'admin') {
          setError('ผู้ดูแลระบบยังไม่ได้กำหนด Teacher PIN');
          return;
        }
        if (pin !== confirmPin) {
          setError('Admin PIN และช่องยืนยันไม่ตรงกัน');
          return;
        }
        setInitialAdminPin(pin);
      } else if (hashStaffPin(pin) !== expectedPinHash) {
        setError(`${role === 'admin' ? 'Admin' : 'Teacher'} PIN ไม่ถูกต้อง`);
        return;
      }
    }
    if (role === 'student' && code && !state.classrooms[code]) {
      setError('ไม่พบรหัสห้องเรียนนี้ กรุณาตรวจสอบรหัสจากครูอีกครั้ง');
      return;
    }
    setError('');
    setPlayer(name.trim(), group.trim(), role, role === 'student' ? code : undefined);
    go(role === 'student' ? (state.preTest ? { name: 'home' } : { name: 'pretest' }) : { name: 'classroom' });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_#312e81,_#0f172a_70%)] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#6366f1_1px,transparent_1px),linear-gradient(90deg,#6366f1_1px,transparent_1px)] [background-size:40px_40px]" aria-hidden="true" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-sm font-bold text-rose-200 ring-1 ring-rose-400/40"><TriangleAlert className="h-4 w-4" aria-hidden="true" /> HARDWARE QUEST ACCESS</div>
        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">HARDWARE QUEST<span className="block bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">CLASSROOM LOGIN</span></h1>
        <p className="mt-2 text-indigo-100">เลือกบทบาทก่อนเข้าสู่ระบบเกมและห้องเรียน</p>

        <div className="mt-5 flex gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15"><BuddyBot className="h-12 w-12 shrink-0" mood="happy" /><p className="text-sm leading-relaxed text-indigo-50">นักเรียนสามารถเรียนแบบอิสระโดยไม่ใส่รหัสห้อง หรือเข้าห้องของครูเพื่อให้ครูเป็นผู้ควบคุมการเปิดด่าน</p></div>

        <form className="mt-5 space-y-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 sm:p-5" onSubmit={(event) => { event.preventDefault(); begin(); }}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-indigo-100">เข้าสู่ระบบในบทบาท</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLES.map((item) => <button key={item.id} type="button" disabled={!!state.player && item.id !== state.player.role} aria-pressed={role === item.id} onClick={() => { setRole(item.id); setError(''); setPin(''); setConfirmPin(''); }} className={cx('min-h-24 cursor-pointer rounded-2xl p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40', role === item.id ? 'bg-white text-indigo-950 shadow-lg' : 'bg-white/5 text-white ring-1 ring-white/15 hover:bg-white/10')}><item.Icon className={cx('h-6 w-6', role === item.id ? 'text-indigo-600' : 'text-cyan-300')} aria-hidden="true" /><b className="mt-2 block">{item.label}</b><span className={cx('text-xs', role === item.id ? 'text-slate-500' : 'text-indigo-200')}>{item.detail}</span></button>)}
            </div>
          </fieldset>

          <label className="block"><span className="mb-1 block text-sm font-semibold text-indigo-100">ชื่อ-นามสกุล</span><input value={name} onChange={(event) => setName(event.target.value)} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder={role === 'student' ? 'ชื่อสำหรับโปรไฟล์และใบประกาศ' : 'ชื่อครูหรือผู้ดูแล'} autoComplete="name" required /></label>

          {role === 'student' && <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-semibold text-indigo-100">กลุ่มเรียน (โหมดอิสระ)</span><input value={group} onChange={(event) => setGroup(event.target.value)} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="เช่น ปวช.1/2" /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold text-indigo-100">รหัสห้องเรียน (ไม่บังคับ)</span><input value={classroomCode} onChange={(event) => { setClassroomCode(normalizeClassroomCode(event.target.value)); setError(''); }} onBlur={() => { const code = normalizeClassroomCode(classroomCode); if (code && !state.classrooms[code]) setError('ยังไม่พบรหัสห้องเรียนนี้ในเครื่อง'); }} className="h-12 w-full rounded-2xl bg-white px-4 font-mono text-base uppercase text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="เช่น HQ-A1B2C" maxLength={12} /></label>
          </div>}

          {isStaff(role) && <div className="rounded-2xl bg-slate-950/30 p-3 ring-1 ring-white/10">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-200"><KeyRound className="h-4 w-4" /> {role === 'admin' ? (state.adminPinHash ? 'ยืนยัน Admin PIN' : 'ตั้ง Admin PIN ครั้งแรก') : (state.teacherPinHash ? 'ยืนยัน Teacher PIN' : 'รอผู้ดูแลตั้ง Teacher PIN')}</div>
            <div className={cx('grid gap-3', !state.adminPinHash && role === 'admin' && 'sm:grid-cols-2')}>
              <label><span className="mb-1 block text-sm text-indigo-100">{role === 'admin' ? 'Admin PIN' : 'Teacher PIN'}</span><input type="password" inputMode="numeric" autoComplete={(role === 'admin' ? state.adminPinHash : state.teacherPinHash) ? 'current-password' : 'new-password'} value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="ตัวเลข 4–8 หลัก" /></label>
              {!state.adminPinHash && role === 'admin' && <label><span className="mb-1 block text-sm text-indigo-100">ยืนยัน Admin PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" value={confirmPin} onChange={(event) => { setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="กรอก PIN ซ้ำ" /></label>}
            </div>
            <p className="mt-2 text-xs text-indigo-200">PIN ถูกเก็บเป็นค่าแฮชในเบราว์เซอร์ เป็นชั้นป้องกันสำหรับต้นแบบ Local-first และไม่ทดแทนระบบยืนยันตัวตนจากเซิร์ฟเวอร์</p>
          </div>}

          {error && <p role="alert" className="rounded-2xl bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/40">{error}</p>}
          <Btn type="submit" disabled={!ok} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-lg">{role === 'student' ? 'เข้าสู่เกม' : 'เปิดศูนย์ควบคุม'} <ArrowRight className="h-5 w-5" aria-hidden="true" /></Btn>
        </form>
        <p className="mt-4 text-center text-xs text-indigo-200/80">ระบบห้องเรียนรุ่นนี้ซิงก์ระหว่างแท็บในเบราว์เซอร์เดียวกัน การใช้งานข้ามเครื่องต้องเชื่อมต่อฐานข้อมูลส่วนกลาง</p>
      </motion.div>
    </div>
  );
}
