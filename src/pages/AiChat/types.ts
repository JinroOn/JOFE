export interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  tags?: string[];
  steps?: { title: string; description: string }[];
}
