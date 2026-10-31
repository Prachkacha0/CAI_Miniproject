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
];

export function Start() {
  const { setPlayer, registerTeacher, go, state } = useStore();
  const [role, setRole] = useState<UserRole>(state.player?.role ?? 'student');
  const [name, setName] = useState(state.player?.name ?? '');
  const [group, setGroup] = useState(state.player?.group ?? '');
  const [classroomCode, setClassroomCode] = useState(state.player?.classroomCode ?? '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const ok = name.trim().length >= 2;

  const quickEnter = (testRole: UserRole) => {
    const testName = testRole === 'student' ? 'นักเรียนทดสอบ' : 'ครูทดสอบ';
    setPlayer(testName, testRole === 'student' ? 'กลุ่มทดสอบ' : '', testRole);
    go(testRole === 'student' ? (state.preTest ? { name: 'home' } : { name: 'pretest' }) : { name: 'classroom' });
  };

  const begin = () => {
    if (!ok) return;
    const code = normalizeClassroomCode(classroomCode);
    if (isStaff(role)) {
      if (pin.trim().length < 4) {
        setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
        return;
      }
      const accountKey = name.normalize('NFC').trim().toLocaleLowerCase();
      const account = state.teacherAccounts[accountKey];
      if (teacherMode === 'register') {
        if (account) {
          setError('ชื่อนี้มีบัญชีครูแล้ว กรุณาเข้าสู่ระบบแทน');
          return;
        }
        if (pin !== confirmPin) {
          setError('รหัสผ่านและช่องยืนยันไม่ตรงกัน');
          return;
        }
        if (!registerTeacher(name.trim(), pin)) {
          setError('สมัครบัญชีไม่สำเร็จ ชื่อนี้อาจถูกใช้แล้ว');
          return;
        }
      } else if (!account || hashStaffPin(pin) !== account.passwordHash) {
        setError('ไม่พบบัญชีครูหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลหรือสมัครบัญชีใหม่');
        return;
      }
    }
    if (role === 'student' && code && !state.classrooms[code]) {
      setError('ไม่พบรหัสห้องเรียนนี้ กรุณาตรวจสอบรหัสจากครูอีกครั้ง');
      return;
    }
    setError('');
    const teacherAccount = role === 'teacher' ? state.teacherAccounts[name.normalize('NFC').trim().toLocaleLowerCase()] : undefined;
    setPlayer(teacherAccount?.name ?? name.trim(), group.trim(), role, role === 'student' ? code : undefined);
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
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.map((item) => <button key={item.id} type="button" disabled={!!state.player && item.id !== state.player.role} aria-pressed={role === item.id} onClick={() => { setRole(item.id); setError(''); setPin(''); setConfirmPin(''); }} className={cx('min-h-24 cursor-pointer rounded-2xl p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40', role === item.id ? 'bg-white text-indigo-950 shadow-lg' : 'bg-white/5 text-white ring-1 ring-white/15 hover:bg-white/10')}><item.Icon className={cx('h-6 w-6', role === item.id ? 'text-indigo-600' : 'text-cyan-300')} aria-hidden="true" /><b className="mt-2 block">{item.label}</b><span className={cx('text-xs', role === item.id ? 'text-slate-500' : 'text-indigo-200')}>{item.detail}</span></button>)}
            </div>
          </fieldset>

          {role === 'teacher' && <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/25 p-1.5" role="group" aria-label="การใช้งานครู">
            <button type="button" aria-pressed={teacherMode === 'login'} onClick={() => { setTeacherMode('login'); setError(''); }} className={cx('min-h-11 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-cyan-300', teacherMode === 'login' ? 'bg-white text-indigo-950 shadow' : 'text-indigo-100 hover:bg-white/10')}>เข้าสู่ระบบ</button>
            <button type="button" aria-pressed={teacherMode === 'register'} onClick={() => { setTeacherMode('register'); setError(''); }} className={cx('min-h-11 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-cyan-300', teacherMode === 'register' ? 'bg-white text-indigo-950 shadow' : 'text-indigo-100 hover:bg-white/10')}>สมัครครู</button>
          </div>}

          <label className="block"><span className="mb-1 block text-sm font-semibold text-indigo-100">{role === 'teacher' ? 'ชื่อบัญชีครู' : 'ชื่อ-นามสกุล'}</span><input value={name} onChange={(event) => setName(event.target.value)} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder={role === 'student' ? 'ชื่อสำหรับโปรไฟล์และใบประกาศ' : 'ใช้ชื่อนี้เข้าสู่ระบบครั้งถัดไป'} autoComplete="name" required /></label>

          {role === 'student' && <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-semibold text-indigo-100">กลุ่มเรียน (โหมดอิสระ)</span><input value={group} onChange={(event) => setGroup(event.target.value)} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="เช่น ปวช.1/2" /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold text-indigo-100">รหัสห้องเรียน (ไม่บังคับ)</span><input value={classroomCode} onChange={(event) => { setClassroomCode(normalizeClassroomCode(event.target.value)); setError(''); }} onBlur={() => { const code = normalizeClassroomCode(classroomCode); if (code && !state.classrooms[code]) setError('ยังไม่พบรหัสห้องเรียนนี้ในเครื่อง'); }} className="h-12 w-full rounded-2xl bg-white px-4 font-mono text-base uppercase text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="เช่น HQ-A1B2C" maxLength={12} /></label>
          </div>}

          {isStaff(role) && <div className="rounded-2xl bg-slate-950/30 p-3 ring-1 ring-white/10">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-200"><KeyRound className="h-4 w-4" /> {teacherMode === 'register' ? 'สร้างรหัสผ่านบัญชีครู' : 'รหัสผ่านบัญชีครู'}</div>
            <div className={cx('grid gap-3', teacherMode === 'register' && 'sm:grid-cols-2')}>
              <label><span className="mb-1 block text-sm text-indigo-100">รหัสผ่าน</span><input type="password" autoComplete={teacherMode === 'register' ? 'new-password' : 'current-password'} value={pin} onChange={(event) => { setPin(event.target.value); setError(''); }} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="พิมพ์ได้อิสระ (อย่างน้อย 4 ตัว)" /></label>
              {teacherMode === 'register' && <label><span className="mb-1 block text-sm text-indigo-100">ยืนยันรหัสผ่าน</span><input type="password" autoComplete="new-password" value={confirmPin} onChange={(event) => { setConfirmPin(event.target.value); setError(''); }} className="h-12 w-full rounded-2xl bg-white px-4 text-base text-slate-900 outline-none ring-2 ring-transparent focus:ring-cyan-400" placeholder="พิมพ์รหัสเดิมอีกครั้ง" /></label>}
            </div>
            <p className="mt-2 text-xs text-indigo-200">บัญชีครูเก็บในเบราว์เซอร์นี้เท่านั้น ใช้ชื่อบัญชีและรหัสผ่านเดิมเมื่อกลับมาเข้าใช้</p>
          </div>}

          {error && <p role="alert" className="rounded-2xl bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/40">{error}</p>}
          <Btn type="submit" disabled={!ok} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-lg">{role === 'student' ? 'เข้าสู่เกม' : teacherMode === 'register' ? 'สมัครบัญชีครู' : 'เข้าสู่ศูนย์ควบคุม'} <ArrowRight className="h-5 w-5" aria-hidden="true" /></Btn>
        </form>
        {import.meta.env.DEV && <section className="mt-4 rounded-3xl border border-dashed border-cyan-300/40 bg-slate-950/25 p-4" aria-labelledby="quick-test-title">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100"><ShieldCheck className="h-4 w-4" aria-hidden="true" /><h2 id="quick-test-title">เข้าแบบรวดเร็วสำหรับทดสอบ</h2><span className="ml-auto rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Dev only</span></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Btn type="button" variant="secondary" onClick={() => quickEnter('student')} className="min-h-12 border-0 bg-cyan-50 text-indigo-950 hover:bg-white"><GraduationCap className="h-5 w-5 text-cyan-700" aria-hidden="true" /> ทดสอบในบทบาทนักเรียน</Btn>
            <Btn type="button" variant="secondary" onClick={() => quickEnter('teacher')} className="min-h-12 border-0 bg-violet-50 text-indigo-950 hover:bg-white"><Presentation className="h-5 w-5 text-violet-700" aria-hidden="true" /> ทดสอบในบทบาทครู</Btn>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-indigo-200">ทางลัดนี้ข้ามการกรอกข้อมูลและรหัสผ่าน แสดงเฉพาะตอนรันโหมดพัฒนา และไม่รวมอยู่ใน production build</p>
        </section>}
        <p className="mt-4 text-center text-xs text-indigo-200/80">ระบบห้องเรียนรุ่นนี้ซิงก์ระหว่างแท็บในเบราว์เซอร์เดียวกัน การใช้งานข้ามเครื่องต้องเชื่อมต่อฐานข้อมูลส่วนกลาง</p>
      </motion.div>
    </div>
  );
}
