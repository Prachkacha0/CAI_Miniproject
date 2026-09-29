import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { allMissionsDone, missionStatus, testPassed, useStore, type Route } from './store';
import { BuddyProvider } from './components/Buddy';
import { Btn, Card } from './components/ui';
import { Shell } from './components/Shell';
import { Start } from './screens/Start';
import { Assessment } from './screens/Assessment';
import { Home } from './screens/Home';
import { Account } from './screens/Account';
import { FinalCase } from './screens/FinalCase';
import { LearningCenter } from './screens/LearningCenter';
import { HardwareLab } from './screens/HardwareLab';
import { PCBuilder } from './screens/PCBuilder';
import { EvidenceBoard } from './screens/EvidenceBoard';
import { Progress } from './screens/Progress';
import { Reflection } from './screens/Reflection';
import { Certificate } from './screens/Certificate';
import { Mission1 } from './missions/Mission1';
import { Mission2 } from './missions/Mission2';
import { Mission3 } from './missions/Mission3';
import { Mission4 } from './missions/Mission4';
import { Mission5 } from './missions/Mission5';
import { Mission6 } from './missions/Mission6';

const MISSION_SCREENS = { 1: Mission1, 2: Mission2, 3: Mission3, 4: Mission4, 5: Mission5, 6: Mission6 };

function Locked({ title, reason, to }: { title: string; reason: string; to: Route }) {
  const { go } = useStore();
  return (
    <Shell title={title}>
      <Card className="mx-auto max-w-md text-center">
        <Lock className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
        <p className="mt-2 font-display text-lg font-bold">ยังไม่ปลดล็อก</p>
        <p className="mt-1 text-sm text-slate-600">{reason}</p>
        <Btn className="mt-4" onClick={() => go(to)}>ไปทำขั้นก่อนหน้า</Btn>
      </Card>
    </Shell>
  );
}

function Screen() {
  const { route, state } = useStore();
  if ((!state.player && route.name !== 'builder') || route.name === 'start') return <Start />;

  let node: ReactNode;
  switch (route.name) {
    case 'pretest':
      node = <Assessment kind="pre" />;
      break;
    case 'home':
      node = <Home />;
      break;
    case 'account':
      node = <Account />;
      break;
    case 'mission': {
      if (missionStatus(state, route.id) === 'locked') {
        node = <Locked title={`Mission ${String(route.id).padStart(2, '0')}`} reason={`ทำ Mission ${String(route.id - 1).padStart(2, '0')} ให้สำเร็จก่อน`} to={{ name: 'home' }} />;
      } else {
        const M = MISSION_SCREENS[route.id];
        node = <M />;
      }
      break;
    }
    case 'final':
      node = allMissionsDone(state) ? <FinalCase /> : <Locked title="Final Case" reason="ผ่าน Mission 01–06 ให้ครบก่อน" to={{ name: 'home' }} />;
      break;
    case 'learn':
      node = <LearningCenter hw={route.hw} />;
      break;
    case 'lab':
      node = <HardwareLab />;
      break;
    case 'builder':
      node = <PCBuilder />;
      break;
    case 'evidence':
      node = <EvidenceBoard />;
      break;
    case 'progress':
      node = <Progress />;
      break;
    case 'posttest':
      node = state.finalCase.completed ? <Assessment kind="post" /> : <Locked title="Post-Test" reason="Post-Test เปิดหลังจบ Final Case" to={{ name: 'home' }} />;
      break;
    case 'reflection':
      node = testPassed(state.postTestBest) ? <Reflection /> : <Locked title="Reflection" reason="Reflection เปิดหลังผ่าน Post-Test" to={state.finalCase.completed ? { name: 'posttest' } : { name: 'home' }} />;
      break;
    case 'certificate':
      node = <Certificate />;
      break;
    default:
      node = <Home />;
  }

  const key = route.name === 'mission' ? `mission-${route.id}` : route.name === 'learn' ? `learn-${route.hw ?? ''}` : route.name;
  return (
    <AnimatePresence mode="wait">
      <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        {node}
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <BuddyProvider>
      <Screen />
    </BuddyProvider>
  );
}
