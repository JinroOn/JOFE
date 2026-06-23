export interface ConsultationSession {
  id: number;
  userId: number;
  diagnosisResultId: number | null;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

export interface ConsultationLog {
  id: number;
  consultationSessionId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ContextUsed {
  diagnosisResultId: number | null;
  usedLatestDiagnosisResult: boolean;
  historyMessageCount: number;
  topMajorNames: string[];
  weaknessFocus: string[];
}

export interface ConsultationMessageResponse {
  userLog: ConsultationLog;
  assistantLog: ConsultationLog;
  contextUsed: ContextUsed;
}
