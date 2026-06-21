import axios, { isAxiosError } from 'axios';
import { BASE_URL } from './constants';

export const AGENT_NAME = 'Bob';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatbotErrorCode =
  | 'AGENT_OFFLINE'
  | 'AGENT_BUSY'
  | 'AGENT_RATE_LIMITED'
  | 'AGENT_UNAVAILABLE'
  | 'AGENT_ERROR';

export class ChatbotError extends Error {
  code: ChatbotErrorCode;

  constructor(code: ChatbotErrorCode, message: string) {
    super(message);
    this.name = 'ChatbotError';
    this.code = code;
  }
}

function toUserMessage(code: ChatbotErrorCode, fallback: string): string {
  switch (code) {
    case 'AGENT_BUSY':
      return `${AGENT_NAME} is taking a quick rest — lots of trainers chatting at once! Wait a few seconds and try again.`;
    case 'AGENT_RATE_LIMITED':
      return `${AGENT_NAME} needs a breather — please wait a minute before sending another message.`;
    case 'AGENT_OFFLINE':
      return `${AGENT_NAME} isn't available right now. Try the quick prompts below, or visit the Contact page for help.`;
    case 'AGENT_UNAVAILABLE':
      return `Can't reach ${AGENT_NAME} — make sure you're online and the site backend is running, then try again.`;
    case 'AGENT_ERROR':
    default:
      return fallback || `${AGENT_NAME} ran into a hiccup. Please try again.`;
  }
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  try {
    const response = await axios.post<{ reply: string }>(`${BASE_URL}/chatbot`, {
      message,
      history,
    });
    return response.data.reply;
  } catch (error) {
    if (isAxiosError(error)) {
      const data = error.response?.data as
        | { error?: string; code?: ChatbotErrorCode }
        | undefined;
      const code = data?.code ?? 'AGENT_ERROR';
      const serverMessage = data?.error;

      if (serverMessage) {
        throw new ChatbotError(code, serverMessage);
      }

      if (!error.response) {
        throw new ChatbotError(
          'AGENT_UNAVAILABLE',
          toUserMessage('AGENT_UNAVAILABLE', ''),
        );
      }
    }

    throw new ChatbotError(
      'AGENT_ERROR',
      toUserMessage('AGENT_ERROR', 'Something went wrong. Please try again.'),
    );
  }
}
