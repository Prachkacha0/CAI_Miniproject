import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAiChat } from '../server/typhoon.js';

export default function handler(request: IncomingMessage & { body?: unknown }, response: ServerResponse) {
  return handleAiChat(request, response);
}
