# Claude CLI Handoff — Hardware Quest

Updated: 2026-10-31 (Asia/Bangkok)

## Workspace and repository

- Workspace: `D:\GAME_CAI`
- Repository: `https://github.com/Prachkacha0/CAI_Miniproject.git`
- Stack: React 19, TypeScript, Vite, Tailwind CSS 4, Three.js, React Three Fiber/Drei, Motion.
- The worktree contains substantial uncommitted user work. Preserve every unrelated change. Do not reset, checkout, clean, or rewrite files outside the requested scope.
- Current latest commit: `eb65ed8 Make hardware quest more interactive and classroom-ready`.

## Product intent

Hardware Quest is a Thai educational browser game about computer hardware. It supports student and teacher roles, classrooms controlled by teachers, mission progression, assessments, evidence, certificates, and 3D gameplay. The visual direction is a polished game interface with realistic hardware and first-person technician interactions. It must remain usable on desktop and mobile.

The five behavioral objectives are:

1. Explain the meaning of computer hardware correctly.
2. Classify hardware by Input, Processing, Storage, Output, and Communication.
3. Name and explain the function of basic hardware.
4. Identify hardware from images or real equipment.
5. Select suitable hardware for a specified task.

## Latest implemented feature

Mission 6, the customer order stage, is now connected to M-07 PC assembly:

1. Customer order order is shuffled per play.
2. The player selects an exact case, motherboard, CPU, RAM, GPU, storage, PSU, and cooler from the same catalog used by the builder.
3. Mission 6 rejects incompatible builds using `checkBuild`, checks budget and customer suitability, and records successful customer configurations.
4. At the end, one successful customer configuration is selected randomly and persisted as `GameState.assemblyOrder`.
5. Mission 6 completion routes directly to the PC builder.
6. The PC builder inventory contains only the exact parts from that customer order.
7. Guided assembly begins by removing four case screws.
8. After opening the case, components may be installed in any order.
9. SSD, GPU, and cooler require a fastening interaction.
10. The player must connect ATX 24-pin, CPU EPS, GPU PCIe when applicable, CPU fan or pump, front panel, and PSU AC cables before powering on.
11. A successful boot sets `builderCompleted`; progression then continues to the Final Case.
12. The 3D case displays its side panel and screw heads until it is opened.

AI Buddy now also has a real chat mode backed by Typhoon. The API key remains on the server through a Vercel Function at `api/ai-chat.ts`; local Vite development exposes the same endpoint. Configuration instructions are in `AI_BUDDY_SETUP.md`.

Primary files for this feature:

- `src/missions/Mission6.tsx`
- `src/screens/PCBuilder.tsx`
- `src/components/BuilderScene3D.tsx`
- `src/game/pcBuilder.ts`
- `src/store.tsx`
- `src/types.ts`
- `src/missions/common.tsx`
- `src/screens/MissionMap.tsx`

## Important existing systems

- Routing and access control: `src/App.tsx`, `src/store.tsx`.
- Teacher/student login and quick test login: `src/screens/Start.tsx`.
- Classroom rules: `src/game/classroom.ts` and `src/screens/ClassroomControl.tsx`.
- Mission metadata and learning objectives: `src/data/missions.ts` and `MISSION_DESIGN.md`.
- Shared 3D PC catalog and compatibility rules: `src/game/pcBuilder.ts`.
- Global styling and responsive rules: `src/quest.css`.
- UI shell/navigation: `src/components/Shell.tsx`.

## Current worktree state

Many files are modified or untracked from the ongoing redesign, including 3D mission components, responsive UI, mission logic, public model assets, and tests. Inspect `git status --short` before any proposal or edit. Treat all current changes as intentional user work.

## Verification already completed

The latest implementation passed:

- `npm.cmd run lint` — TypeScript check passed.
- `npm.cmd test` — 13/13 tests passed.
- `npm.cmd run build` — production build passed.

The build reports only Vite chunk-size warnings for bundles over 500 kB. This is not a build failure.

## Run commands

From `D:\GAME_CAI`:

```powershell
npm.cmd install
npm.cmd run dev -- --port 3001
```

The user previously requested port 3001. Note that `package.json` currently hardcodes port 5173 in the `dev` script, so the explicit `--port 3001` argument is required until that script is corrected.

Validation commands:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Recommended next review

Review the new Mission 6 to M-07 flow for bugs, regressions, mobile interaction, accessibility, persistence, and state migration. Pay special attention to:

- Replaying Mission 6 after an existing `assemblyOrder`.
- Old localStorage state without the new fields.
- Removing and reinstalling parts after cable connections.
- Guided assembly behavior in both 3D and 2D modes.
- Whether all compatible customer configurations can actually complete the assigned scenario.
- Responsive layout of the order banner, screw panel, fastening modal, and cable checklist.
- Route behavior after successful boot.
- The mismatch between the requested port 3001 and `package.json` port 5173.

## Collaboration constraint

For the first pass, provide an independent review and a prioritized plan only. Do not edit files unless the user explicitly asks Claude CLI to make edits. Verify every finding against the local source and existing tests.
