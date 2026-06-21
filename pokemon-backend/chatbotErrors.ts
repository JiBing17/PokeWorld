export type ChatbotErrorCode =
  | 'AGENT_OFFLINE'
  | 'AGENT_BUSY'
  | 'AGENT_RATE_LIMITED'
  | 'AGENT_UNAVAILABLE'
  | 'AGENT_ERROR';

export function chatbotError(
  code: ChatbotErrorCode,
  message: string,
): { error: string; code: ChatbotErrorCode } {
  return { error: message, code };
}
