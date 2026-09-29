import { useMemo, useState } from 'react';
import { Check, Clipboard, DoorOpen, GraduationCap, KeyRound, LockKeyhole, Plus, Power, ShieldCheck, Users } from 'lucide-react';
import { normalizeClassroomCode } from '../game/classroom';
import { useStore } from '../store';
import { Btn, Card, cx } from '../components/ui';
import { Shell } from '../components/Shell';

export function ClassroomControl() {
  const { state, createClassroom, updateClassroom, setTeacherPin, signOut } = useStore();
  const [name, setName] = useState('');
  const [preferredCode, setPreferredCode] = useState('');
  const [message, setMessage] = useState('');
  const [teacherPin, setTeacherPinValue] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const isAdmin = state.player?.role === 'admin';
  const rooms = useMemo(() => Object.values(state.classrooms).filter((room) => isAdmin || room.teacherName === state.player?.name).sort((a, b) => b.updatedAt - a.updatedAt), [isAdmin, state.classrooms, state.player?.name]);

  const addRoom = () => {
    const roomName = name.trim();
    const code = normalizeClassroomCode(preferredCode);
    if (roomName.length < 2) return setMessage('กรุณาตั้งชื่อห้องเรียนอย่างน้อย 2 ตัวอักษร');
    if (code && state.classrooms[code]) return setMessage('รหัสนี้ถูกใช้งานแล้ว กรุณาใช้รหัสอื่น');
    const createdCode = createClassroom(roomName, code);
    setName('');
    setPreferredCode('');
    setMessage(`สร้างห้อง ${createdCode} สำเร็จ`);
  };

  return (
    <Shell title="ศูนย์ควบคุมห้องเรียน" subtitle={`${isAdmin ? 'ผู้ดูแลระบบ' : 'ครูผู้สอน'} · ควบคุมการเปิดด่าน`} wide>
      <div className="space-y-5">
        <Card className="overflow-hidden bg-gradient-to-br from-indigo-700 to-violet-800 text-white ring-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">{isAdmin ? <ShieldCheck className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}</span><div><p className="text-xs font-bold tracking-[.16em] text-cyan-200">CLASSROOM CONTROL</p><h2 className="font-display text-2xl font-bold">สวัสดี {state.player?.name}</h2><p className="text-sm text-indigo-100">สร้างรหัสห้อง แล้วกำหนดว่านักเรียนในห้องเปิดได้ถึงด่านใด</p></div></div>
            <Btn onClick={signOut} className="bg-white text-indigo-700 shadow-none hover:bg-indigo-50"><DoorOpen className="h-4 w-4" /> เปลี่ยนผู้ใช้งาน</Btn>
          </div>
        </Card>

        {isAdmin && <Card className="border border-cyan-200 bg-cyan-50 shadow-none">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end"><div><div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-cyan-700" /><h2 className="font-display text-lg font-bold text-slate-900">กำหนด Teacher PIN</h2></div><p className="mt-1 text-xs text-slate-600">ใช้ PIN แยกจาก Admin เพื่อให้ครูเข้าควบคุมได้เฉพาะห้องของตนเอง</p></div><label><span className="mb-1 block text-sm font-semibold text-slate-700">Teacher PIN ใหม่</span><input type="password" inputMode="numeric" autoComplete="new-password" value={teacherPin} onChange={(event) => { setTeacherPinValue(event.target.value.replace(/\D/g, '').slice(0, 8)); setPinMessage(''); }} className="h-12 w-full rounded-2xl border border-cyan-200 bg-white px-4 text-base outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" placeholder="ตัวเลข 4–8 หลัก" /></label><Btn disabled={!/^\d{4,8}$/.test(teacherPin)} onClick={() => { setTeacherPin(teacherPin); setTeacherPinValue(''); setPinMessage('บันทึก Teacher PIN แล้ว'); }}><KeyRound className="h-4 w-4" /> บันทึก PIN</Btn></div>
          {pinMessage && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{pinMessage}</p>}
        </Card>}

        <Card>
          <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-indigo-600" /><h2 className="font-display text-lg font-bold text-slate-900">สร้างห้องเรียน</h2></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
            <label><span className="mb-1 block text-sm font-semibold text-slate-700">ชื่อห้อง / กลุ่มเรียน</span><input value={name} onChange={(event) => { setName(event.target.value); setMessage(''); }} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="เช่น ปวช.1/2" /></label>
            <label><span className="mb-1 block text-sm font-semibold text-slate-700">กำหนดรหัสเอง (ไม่บังคับ)</span><input value={preferredCode} onChange={(event) => { setPreferredCode(normalizeClassroomCode(event.target.value)); setMessage(''); }} className="h-12 w-full rounded-2xl border border-slate-200 px-4 font-mono text-base uppercase outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="ระบบสร้างให้อัตโนมัติ" maxLength={12} /></label>
            <Btn onClick={addRoom}><Plus className="h-4 w-4" /> สร้างห้อง</Btn>
          </div>
          {message && <p role="status" className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">{message}</p>}
        </Card>

        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-indigo-600">MANAGED CLASSROOMS</p><h2 className="font-display text-2xl font-bold text-slate-900">ห้องเรียนที่ควบคุม</h2></div><span className="text-sm font-semibold text-slate-500">{rooms.length} ห้อง</span></div>

        {rooms.length === 0 ? <Card className="text-center"><Users className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-2 font-bold text-slate-800">ยังไม่มีห้องเรียน</h3><p className="text-sm text-slate-500">นักเรียนที่ไม่ใส่รหัสห้องจะเล่นแบบอิสระและเปิดทุกด่านได้</p></Card> : <div className="grid gap-4 xl:grid-cols-2">{rooms.map((room) => <Card key={room.code} className={cx('ring-1', room.active ? 'ring-indigo-100' : 'bg-slate-50 ring-slate-200')}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-display text-xl font-bold text-slate-900">{room.name}</h3><span className={cx('rounded-full px-2 py-0.5 text-xs font-bold', room.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')}>{room.active ? 'เปิดใช้งาน' : 'พักห้อง'}</span></div><p className="text-xs text-slate-500">ผู้ดูแล: {room.teacherName} · นักเรียน {room.members.length} คน</p></div><button type="button" onClick={async () => { await navigator.clipboard?.writeText(room.code); setMessage(`คัดลอกรหัส ${room.code} แล้ว`); }} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-3 font-mono text-sm font-bold text-white"><Clipboard className="h-4 w-4" /> {room.code}</button></div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">เปิดด่านให้นักเรียนถึง</span><select value={room.unlockedThrough} onChange={(event) => updateClassroom(room.code, { unlockedThrough: Number(event.target.value) })} className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value={0}>ยังไม่เปิด Mission</option>{[1, 2, 3, 4, 5, 6].map((id) => <option key={id} value={id}>Mission 01 ถึง Mission {String(id).padStart(2, '0')}</option>)}</select></label>
            <div className="mt-3 grid grid-cols-6 gap-1.5" aria-label={`เปิดแล้ว ${room.unlockedThrough} จาก 6 ด่าน`}>{[1, 2, 3, 4, 5, 6].map((id) => <span key={id} className={cx('grid h-9 place-items-center rounded-lg text-xs font-bold', id <= room.unlockedThrough ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500')}>{id <= room.unlockedThrough ? <Check className="h-4 w-4" /> : <LockKeyhole className="h-3.5 w-3.5" />}</span>)}</div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" disabled={room.unlockedThrough < 6} onClick={() => updateClassroom(room.code, { finalUnlocked: !room.finalUnlocked })} className={cx('inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-40', room.finalUnlocked ? 'bg-rose-500 text-white' : 'bg-white text-rose-700 ring-1 ring-rose-200')}><LockKeyhole className="h-4 w-4" /> {room.finalUnlocked ? 'Final Case เปิดแล้ว' : 'เปิด Final Case'}</button><button type="button" onClick={() => updateClassroom(room.code, { active: !room.active })} className={cx('inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 font-bold transition', room.active ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white')}><Power className="h-4 w-4" /> {room.active ? 'พักการใช้งานห้อง' : 'เปิดใช้งานห้อง'}</button></div>
          {room.members.length > 0 && <div className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">สมาชิกในเบราว์เซอร์นี้</p><div className="flex flex-wrap gap-1.5">{room.members.map((member) => <span key={member} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{member}</span>)}</div></div>}
        </Card>)}</div>}

        <Card className="border border-amber-200 bg-amber-50 shadow-none"><p className="text-sm font-semibold text-amber-900">ขอบเขตระบบปัจจุบัน</p><p className="mt-1 text-xs leading-relaxed text-amber-800">การควบคุมนี้ทำงานและซิงก์ระหว่างแท็บในเบราว์เซอร์เดียวกันเท่านั้น หากต้องการให้ครูเปิดด่านจากคนละเครื่องกับนักเรียน ต้องเชื่อมต่อระบบบัญชีและฐานข้อมูลส่วนกลางก่อนนำไปใช้งานจริง</p></Card>
      </div>
    </Shell>
  );
}
