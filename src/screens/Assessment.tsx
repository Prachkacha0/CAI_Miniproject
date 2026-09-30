import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, ClipboardList } from 'lucide-react';
import { gradeTest, testPassed, useStore } from '../store';
import { PASS_RATIO, POST_TEST, PRE_TEST } from '../data/assessment';
import { OBJECTIVES } from '../data/missions';
import type { LOId, TestResult } from '../types';
import { Bar, Btn, Card, Feedback, cx } from '../components/ui';
import { Shell } from '../components/Shell';
import { useBuddyTopic } from '../components/Buddy';

const LOS: LOId[] = [1, 2, 3, 4, 5];

export function Assessment({ kind }: { kind: 'pre' | 'post' }) {
  const { state, savePreTest, savePostTest, go } = useStore();
  const questions = kind === 'pre' ? PRE_TEST : POST_TEST;
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [i, setI] = useState(0);
  // The pre-test is a one-time baseline: revisiting it shows the saved result instead of a retake.
  const [result, setResult] = useState<TestResult | null>(kind === 'pre' ? state.preTest : null);

  useBuddyTopic(
    {
      scope: null,
      hint: kind === 'pre' ? 'Pre-Test ไม่มีผลต่อการเล่น ตอบตามที่เข้าใจตอนนี้ได้เลย ไม่ต้องกังวล' : 'ลองนึกถึงสิ่งที่เจอใน Mission — อุปกรณ์ชิ้นนั้นทำให้ระบบเป็นอย่างไร?',
      evidence: ['ระหว่างทำแบบทดสอบ AI Buddy จะไม่ชี้หลักฐานเฉพาะข้อ เพื่อให้ผลสะท้อนความเข้าใจจริงของคุณ'],
      lesson: { text: 'ทบทวน 6 เป้าหมาย: ความหมาย · ความสำคัญ · ประเภท · หน้าที่ · การระบุ · การเลือก Hardware' },
    },
    [kind],
  );

  const q = questions[i];
  const answered = answers.filter((a) => a >= 0).length;

  const submit = () => {
    const r = gradeTest(questions, answers);
    if (kind === 'pre') savePreTest(r);
    else savePostTest(r);
    setResult(r);
  };

  if (result) return <Result kind={kind} result={result} pre={state.preTest} onRetry={() => { setAnswers(questions.map(() => -1)); setI(0); setResult(null); }} go={go} />;

  return (
    <Shell title={kind === 'pre' ? 'Pre-Test · สำรวจความรู้ก่อนเริ่มภารกิจ' : 'Post-Test · ประเมินหลังจบภารกิจ'} subtitle={`${questions.length} ข้อ · ครอบคลุม 6 Learning Objectives`}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">
            ข้อ <b className="tabular-nums text-slate-900">{i + 1}</b> / {questions.length}
          </span>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">LO{q.lo} · {OBJECTIVES[q.lo].en}</span>
        </div>
        <Bar value={(answered / questions.length) * 100} label="จำนวนข้อที่ตอบแล้ว" />
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
            <Card className="mt-5">
              <p className="font-display text-lg font-bold leading-snug text-slate-900 sm:text-xl">{q.q}</p>
              <div className="mt-4 grid gap-2.5" role="radiogroup" aria-label={q.q}>
                {q.choices.map((c, ci) => {
                  const sel = answers[i] === ci;
                  return (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setAnswers((a) => a.map((x, xi) => (xi === i ? ci : x)))}
                      className={cx(
                        'flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-left ring-2 transition',
                        sel ? 'bg-indigo-50 ring-indigo-500' : 'bg-slate-50 ring-transparent hover:ring-slate-200',
                      )}
                    >
                      <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold', sel ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200')}>
                        {'กขคง'[ci]}
                      </span>
                      <span className="text-slate-800">{c}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Btn variant="secondary" onClick={() => setI((x) => x - 1)} disabled={i === 0}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> ก่อนหน้า
          </Btn>
          {i < questions.length - 1 ? (
            <Btn onClick={() => setI((x) => x + 1)} disabled={answers[i] < 0}>
              ถัดไป <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Btn>
          ) : (
            <Btn variant="success" onClick={submit} disabled={answered < questions.length}>
              ส่งคำตอบ <CircleCheck className="h-4 w-4" aria-hidden="true" />
            </Btn>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-1.5" aria-label="ข้ามไปยังข้อ">
          {questions.map((_, qi) => (
            <button
              key={qi}
              onClick={() => setI(qi)}
              aria-label={`ข้อ ${qi + 1}${answers[qi] >= 0 ? ' ตอบแล้ว' : ''}`}
              className={cx('h-8 w-8 rounded-full text-xs font-bold tabular-nums', qi === i ? 'bg-indigo-600 text-white' : answers[qi] >= 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-white text-slate-500 ring-1 ring-slate-200')}
            >
              {qi + 1}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Result({ kind, result, pre, onRetry, go }: { kind: 'pre' | 'post'; result: TestResult; pre: TestResult | null; onRetry: () => void; go: ReturnType<typeof useStore>['go'] }) {
  const pct = Math.round((result.score / result.total) * 100);
  const passed = testPassed(result);
  const questions = kind === 'pre' ? PRE_TEST : POST_TEST;
  const wrong = useMemo(() => questions.map((q, i) => ({ q, a: result.answers[i] })).filter((x) => x.a !== x.q.answer), [questions, result]);

  return (
    <Shell title={kind === 'pre' ? 'ผล Pre-Test · Knowledge Baseline' : 'ผล Post-Test'}>
      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-indigo-500" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-500">คะแนนของคุณ</p>
          <p className="font-display text-5xl font-extrabold text-slate-900 tabular-nums">
            {result.score}
            <span className="text-2xl text-slate-400">/{result.total}</span>
          </p>
          {kind === 'pre' ? (
            <p className="mx-auto mt-3 max-w-md text-slate-600">
              นี่คือ <b>จุดเริ่มต้น</b> ของคุณ ไม่ใช่ตัวตัดสิน 🙂 ทุกภารกิจเปิดให้เล่นได้ตามลำดับ และเราจะเทียบผลอีกครั้งหลังจบภารกิจ
            </p>
          ) : passed ? (
            <Feedback kind="complete" title="ผ่าน Post-Test แล้ว!" className="mt-4 text-left">
              ได้ {pct}% (เกณฑ์ผ่าน {Math.round(PASS_RATIO * 100)}%) ไปทำ Reflection ต่อเพื่อปลดล็อก Certificate
            </Feedback>
          ) : (
            <Feedback kind="investigate" title="ยังไม่ถึงเกณฑ์ — ลองทบทวนแล้วทำใหม่ได้" className="mt-4 text-left">
              ได้ {pct}% (เกณฑ์ผ่าน {Math.round(PASS_RATIO * 100)}%) ดูหัวข้อที่ควรทบทวนด้านล่าง แล้วแวะ Learning Center หรือเล่น Mission ซ้ำได้
            </Feedback>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-slate-900">{kind === 'pre' ? 'Knowledge Baseline ราย Objective' : 'เทียบก่อนเรียน – หลังเรียน'}</h2>
          <div className="mt-4 space-y-3">
            {LOS.map((lo) => {
              const r = result.byLO[lo];
              const p = pre?.byLO[lo];
              return (
                <div key={lo}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">LO{lo} {OBJECTIVES[lo].th}</span>
                    <span className="tabular-nums text-slate-500">
                      {kind === 'post' && p ? `${p.correct}/${p.total} → ` : ''}
                      <b className="text-slate-900">{r.correct}/{r.total}</b>
                    </span>
                  </div>
                  {kind === 'post' && p && <Bar value={(p.correct / p.total) * 100} color="bg-slate-300" className="mb-1 h-1.5" label={`ก่อนเรียน LO${lo}`} />}
                  <Bar value={(r.correct / r.total) * 100} label={`LO${lo}`} />
                </div>
              );
            })}
          </div>
          {kind === 'post' && pre && (
            <p className="mt-4 text-sm text-slate-500">
              แถบสีเทา = Pre-Test ({pre.score}/{pre.total}) · แถบสี = Post-Test ({result.score}/{result.total}) — ข้อมูลของคุณเท่านั้น
            </p>
          )}
        </Card>

        {kind === 'post' && wrong.length > 0 && (
          <Card>
            <h2 className="font-display text-lg font-bold text-slate-900">ข้อที่ควรทบทวน</h2>
            <ul className="mt-3 space-y-3">
              {wrong.map(({ q }) => (
                <li key={q.q} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">{q.q}</p>
                    <p className="mt-1 text-slate-600">💡 {q.why}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          {kind === 'pre' && <Btn onClick={() => go({ name: 'home' })}>เริ่มภารกิจ · Continue <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>}
          {kind === 'post' && !passed && (
            <>
              <Btn variant="secondary" onClick={() => go({ name: 'learn' })}>ไป Learning Center</Btn>
              <Btn onClick={onRetry}>ทำใหม่อีกครั้ง</Btn>
            </>
          )}
          {kind === 'post' && passed && <Btn onClick={() => go({ name: 'reflection' })}>ไป Reflection <ArrowRight className="h-4 w-4" aria-hidden="true" /></Btn>}
        </div>
      </div>
    </Shell>
  );
}
