import {
  Activity, AppWindow, Award, Bluetooth, BookOpen, Bot, Briefcase, CardSim, CircuitBoard, ClipboardCheck, Cloud, Cpu, Disc3,
  File, FolderSearch, Gpu, HardDrive, HardDriveUpload, Keyboard, Layers, MemoryStick, Microchip, Monitor, Mouse, Power,
  Printer, Route, Router, Save, ScanSearch, Search, Server, Speaker, Usb, Wrench, Zap, type LucideIcon,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  keyboard: Keyboard, mouse: Mouse, cpu: Cpu, circuit: CircuitBoard, gpu: Gpu, memory: MemoryStick, chip: Microchip, zap: Zap,
  harddrive: HardDrive, save: Save, usb: Usb, card: CardSim, harddriveup: HardDriveUpload, disc: Disc3, cloud: Cloud,
  monitor: Monitor, printer: Printer, speaker: Speaker, server: Server, router: Router, bluetooth: Bluetooth,
  browser: AppWindow, file: File, os: Layers, folder: FolderSearch, power: Power, route: Route, wrench: Wrench,
  scan: ScanSearch, briefcase: Briefcase, search: Search, activity: Activity, clipboard: ClipboardCheck, award: Award,
  book: BookOpen, bot: Bot,
};

export function Ico({ name, className }: { name: string; className?: string }) {
  const I = ICONS[name] ?? Microchip;
  return <I className={className} aria-hidden="true" />;
}
