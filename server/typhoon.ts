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

  const apiKey = process.env.TYPHOON_API_KEY?.trim();
  if (!apiKey) {
    sendJson(response, 503, { error: 'AI Buddy ยังไม่ได้ตั้งค่า API key บนเซิร์ฟเวอร์' });
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
      sendJson(response, status, { error });
      return;
    }

    const reply = text(result.choices?.[0]?.message?.content, 4_000);
    if (!reply) {
      sendJson(response, 502, { error: 'AI Buddy ไม่ได้รับคำตอบ กรุณาลองถามใหม่' });
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
