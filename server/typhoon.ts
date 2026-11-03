import type { IncomingMessage, ServerResponse } from 'node:http';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface LearningContext {
  screen?: string;
  scope?: string | number | null;
  hint?: string;
  evidence?: string[];
  lesson?: string;
}

interface TyphoonChoice {
  message?: { content?: string };
}

interface TyphoonResponse {
  choices?: TyphoonChoice[];
  error?: { message?: string };
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_CLIENT = 12;
const MAX_REQUESTS_PER_IP = 120;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

async function readBody(request: IncomingMessage & { body?: unknown }) {
  if (request.body !== undefined) {
    if (typeof request.body === 'string') return JSON.parse(request.body);
    return request.body;
  }

  const chunks: Buffer[] = [];
  let byteLength = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += buffer.length;
    if (byteLength > 20_000) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function clientId(request: IncomingMessage) {
  const forwarded = request.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim()
    || request.socket.remoteAddress
    || 'local';
}

function allowRequest(id: string, limit: number) {
  const now = Date.now();
  if (rateLimits.size > 2_000) {
    for (const [key, value] of rateLimits) if (value.resetAt <= now) rateLimits.delete(key);
  }
  const current = rateLimits.get(id);
  if (!current || current.resetAt <= now) {
    rateLimits.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function validOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin) return process.env.VERCEL !== '1';
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

function chatClientId(request: IncomingMessage) {
  const value = request.headers['x-hq-client'];
  const id = Array.isArray(value) ? value[0] : value;
  return id && /^[a-zA-Z0-9-]{8,64}$/.test(id) ? id : 'anonymous';
}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-10)
    .map((item): ChatMessage | null => {
      if (!item || typeof item !== 'object') return null;
      const role = (item as { role?: unknown }).role;
      const content = text((item as { content?: unknown }).content, 800);
      return (role === 'user' || role === 'assistant') && content ? { role, content } : null;
    })
    .filter((item): item is ChatMessage => item !== null);
}

function sanitizeContext(value: unknown): LearningContext {
  if (!value || typeof value !== 'object') return {};
  const context = value as Record<string, unknown>;
  return {
    screen: text(context.screen, 120),
    scope: typeof context.scope === 'number' || typeof context.scope === 'string' ? context.scope : null,
    hint: text(context.hint, 700),
    evidence: Array.isArray(context.evidence) ? context.evidence.slice(0, 6).map((item) => text(item, 400)).filter(Boolean) : [],
    lesson: text(context.lesson, 900),
  };
}

function systemPrompt(context: LearningContext) {
  return `คุณคือ "AI Buddy" ผู้ช่วยการเรียนรู้ในเกม Hardware Quest สำหรับนักเรียนไทย

หน้าที่ของคุณ:
- ตอบเป็นภาษาไทยที่ชัดเจน เป็นมิตร และกระชับ โดยใช้คำศัพท์อังกฤษของฮาร์ดแวร์ประกอบเมื่อมีประโยชน์
- ช่วยให้ผู้เรียนคิดเองผ่านคำถามนำ คำใบ้ทีละขั้น และคำอธิบายเหตุผล
- ห้ามเฉลยคำตอบโดยตรงของ Pre-Test, Post-Test หรือโจทย์ที่กำลังใช้วัดผล ให้ชี้แนวคิดหรือจุดสังเกตแทน
- หากเป็นคำถามความรู้ทั่วไปเรื่องฮาร์ดแวร์ สามารถอธิบายและยกตัวอย่างได้เต็มที่
- หากคำถามไม่เกี่ยวกับการเรียนคอมพิวเตอร์ ให้ชวนกลับมาที่บทเรียนอย่างสุภาพ
- ห้ามอ้างว่าคุณเห็นหน้าจอหรือการกระทำที่ไม่มีอยู่ในบริบทด้านล่าง
- ไม่ต้องเกริ่นซ้ำว่าเป็น AI และไม่ใช้ Markdown ที่ซับซ้อน

วัตถุประสงค์การเรียนรู้ของเกม:
1) ความหมายของฮาร์ดแวร์ 2) การจำแนก Input/Processing/Storage/Output/Communication
3) ชื่อและหน้าที่อุปกรณ์ 4) การจำแนกจากภาพหรือของจริง 5) การเลือกอุปกรณ์ให้เหมาะกับงาน

บริบทปัจจุบันจากเกม:
${JSON.stringify(context, null, 2)}`;
}

function offlineReply(messages: ChatMessage[], context: LearningContext) {
  const question = messages.at(-1)?.content.toLowerCase() ?? '';
  const topics: Array<[RegExp, string]> = [
    [/\bram\b|แรม/, 'RAM เป็นหน่วยความจำชั่วคราวที่เก็บข้อมูลของโปรแกรมที่กำลังใช้งาน ช่วยให้ CPU เรียกข้อมูลได้เร็ว แต่ข้อมูลจะหายเมื่อปิดเครื่อง'],
    [/\bssd\b|storage|ที่เก็บข้อมูล|ฮาร์ดดิสก์/, 'SSD เป็นอุปกรณ์เก็บข้อมูลถาวรสำหรับระบบปฏิบัติการ โปรแกรม และไฟล์ จุดเด่นคืออ่านเขียนเร็วกว่า HDD และข้อมูลยังอยู่หลังปิดเครื่อง'],
    [/\bcpu\b|ซีพียู|หน่วยประมวลผล/, 'CPU คือหน่วยประมวลผลหลัก ทำหน้าที่คำนวณและควบคุมคำสั่งต่าง ๆ เปรียบเสมือนสมองของคอมพิวเตอร์'],
    [/\bgpu\b|การ์ดจอ|กราฟิก/, 'GPU ประมวลผลภาพ วิดีโอ และงานคำนวณแบบขนาน เหมาะกับเกม งาน 3D ตัดต่อวิดีโอ และงาน AI บางประเภท'],
    [/motherboard|mainboard|เมนบอร์ด/, 'เมนบอร์ดเป็นแผงวงจรหลักที่เชื่อม CPU, RAM, Storage, GPU และอุปกรณ์อื่นให้สื่อสารและรับพลังงานร่วมกัน'],
    [/\bpsu\b|power supply|พาวเวอร์ซัพพลาย|จ่ายไฟ/, 'PSU แปลงไฟบ้านเป็นไฟที่อุปกรณ์คอมพิวเตอร์ใช้ และต้องมีกำลังวัตต์เพียงพอพร้อมเผื่อกำลังสำหรับความเสถียร'],
    [/cool|ระบายความร้อน|พัดลม|ชุดน้ำ/, 'ระบบ Cooling นำความร้อนออกจาก CPU และภายในเคส ควรติดตั้งฮีตซิงก์หรือหม้อน้ำให้แน่น ต่อสาย CPU_FAN หรือสายปั๊ม และจัดทิศทางลมให้เหมาะสม'],
    [/input|นำเข้า|คีย์บอร์ด|เมาส์/, 'Input คืออุปกรณ์ที่รับข้อมูลหรือคำสั่งจากผู้ใช้เข้าสู่คอมพิวเตอร์ เช่น คีย์บอร์ด เมาส์ ไมโครโฟน และสแกนเนอร์'],
    [/output|ส่งออก|จอภาพ|ลำโพง/, 'Output คืออุปกรณ์ที่แสดงผลจากคอมพิวเตอร์ให้ผู้ใช้รับรู้ เช่น จอภาพ ลำโพง และเครื่องพิมพ์'],
    [/processing|ประมวลผล/, 'Processing คือขั้นตอนที่อุปกรณ์อย่าง CPU และ GPU นำข้อมูลมาคำนวณตามคำสั่ง แล้วส่งผลไปเก็บหรือแสดงผล'],
    [/communication|สื่อสาร|เราเตอร์|router|network/, 'Communication คืออุปกรณ์ที่รับส่งข้อมูลระหว่างเครื่องหรือเครือข่าย เช่น Network Card, Router และ Modem'],
    [/น็อต|สกรู|ประกอบ|ติดตั้ง|เสียบสาย/, 'เริ่มจากปิดไฟและเปิดฝาเคส จากนั้นจัดวางอุปกรณ์ให้ตรงสล็อต ยึด SSD การ์ดจอ และชุดระบายความร้อนให้แน่น แล้วต่อสาย ATX 24-pin, CPU EPS, PCIe, CPU_FAN และ Front Panel ให้ครบก่อนเปิดเครื่อง'],
    [/hardware|ฮาร์ดแวร์/, 'Hardware คือส่วนประกอบทางกายภาพของคอมพิวเตอร์ที่มองเห็นและจับต้องได้ เช่น CPU, RAM, เมนบอร์ด จอภาพ และคีย์บอร์ด'],
  ];
  const matched = topics.find(([pattern]) => pattern.test(question));
  if (matched) return matched[1] + ' ลองบอกฉันได้ว่าต้องการตัวอย่างหรือคำใบ้เพิ่มเติมตรงส่วนไหน';
  if (context.hint) return `ลองเริ่มจากคำใบ้นี้: ${context.hint} จากนั้นสังเกตหน้าที่ จุดเชื่อมต่อ และตำแหน่งของอุปกรณ์ แล้วบอกฉันว่าคุณคิดว่าคำตอบควรเป็นอะไร`;
  if (context.lesson) return `แนวคิดสำคัญของหน้านี้คือ: ${context.lesson} ลองถามชื่ออุปกรณ์หรือขั้นตอนที่สงสัยได้เลย`;
  return 'ลองระบุชื่ออุปกรณ์หรือขั้นตอนที่สงสัย เช่น CPU, RAM, SSD, การ์ดจอ การเสียบสาย หรือการระบายความร้อน แล้วฉันจะช่วยอธิบายหรือให้คำใบ้ทีละขั้น';
}

function sendOffline(response: ServerResponse, messages: ChatMessage[], context: LearningContext) {
  sendJson(response, 200, { reply: offlineReply(messages, context), model: 'hardware-quest-offline-guide', fallback: true });
}

export async function handleAiChat(request: IncomingMessage & { body?: unknown }, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { error: 'รองรับเฉพาะการส่งคำถามแบบ POST' });
    return;
  }

  if (!validOrigin(request)) {
    sendJson(response, 403, { error: 'คำขอนี้ไม่ได้มาจาก Hardware Quest' });
    return;
  }

  const ip = clientId(request);
  const client = chatClientId(request);
  if (!allowRequest(`ip:${ip}`, MAX_REQUESTS_PER_IP) || !allowRequest(`client:${ip}:${client}`, MAX_REQUESTS_PER_CLIENT)) {
    sendJson(response, 429, { error: 'ถามถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' });
    return;
  }

  try {
    const body = await readBody(request) as { messages?: unknown; context?: unknown };
    const messages = sanitizeMessages(body.messages);
    const context = sanitizeContext(body.context);
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      sendJson(response, 400, { error: 'กรุณาพิมพ์คำถามก่อนส่ง' });
      return;
    }

    const apiKey = process.env.TYPHOON_API_KEY?.trim();
    if (!apiKey) {
      sendOffline(response, messages, context);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    let upstream: Response;
    let rawResult = '';
    try {
      upstream = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.TYPHOON_MODEL?.trim() || 'typhoon-v2.5-30b-a3b-instruct',
          messages: [{ role: 'system', content: systemPrompt(context) }, ...messages],
          max_tokens: 500,
          temperature: 0.35,
          stream: false,
        }),
        signal: controller.signal,
      });
      rawResult = await upstream.text();
    } finally {
      clearTimeout(timeout);
    }

    let result: TyphoonResponse = {};
    try { result = JSON.parse(rawResult) as TyphoonResponse; } catch { /* Upstream can return an HTML gateway error. */ }
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status === 401 || upstream.status === 403 ? 503 : 502;
      const error = status === 429
        ? 'โควตา AI ถูกใช้งานถี่เกินไป กรุณาลองใหม่อีกครั้ง'
        : status === 503
          ? 'AI Buddy เชื่อมต่อไม่ได้ กรุณาตรวจสอบ Typhoon API key'
          : 'Typhoon ตอบกลับผิดพลาด กรุณาลองใหม่';
      console.error('Typhoon API error', upstream.status, result.error?.message ?? 'non-json response');
      if (status === 429) sendJson(response, status, { error });
      else sendOffline(response, messages, context);
      return;
    }

    const reply = text(result.choices?.[0]?.message?.content, 4_000);
    if (!reply) {
      sendOffline(response, messages, context);
      return;
    }
    sendJson(response, 200, { reply, model: process.env.TYPHOON_MODEL?.trim() || 'typhoon-v2.5-30b-a3b-instruct' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PAYLOAD_TOO_LARGE') sendJson(response, 413, { error: 'ข้อความยาวเกินไป กรุณาย่อคำถาม' });
    else if (error instanceof SyntaxError) sendJson(response, 400, { error: 'รูปแบบคำขอไม่ถูกต้อง' });
    else if (message === 'This operation was aborted' || (error instanceof Error && error.name === 'AbortError')) sendJson(response, 504, { error: 'AI ใช้เวลาตอบนานเกินไป กรุณาลองใหม่' });
    else {
      console.error('AI Buddy server error', error);
      sendJson(response, 500, { error: 'AI Buddy ขัดข้องชั่วคราว กรุณาลองใหม่' });
    }
  }
}
