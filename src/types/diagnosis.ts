export type DiagnosisSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface DiagnosisSession {
  id: number;
  userId: number;
  status: DiagnosisSessionStatus;
  currentStep: number;
  inputSnapshot: string; // 폼 입력값 JSON 문자열
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAnswer {
  id: number;
  diagnosisSessionId: number;
  examQuestionId: number;
  selectedAnswer: string;
  correct: boolean;
  responseSec: number;
}

export interface EssayAnswer {
  id: number;
  diagnosisSessionId: number;
  questionNo: number;
  answerText: string;
}

export interface InProgressSession {
  session: DiagnosisSession;
  examAnswers: ExamAnswer[];
  essayAnswers: EssayAnswer[];
}

export interface SessionPayload {
  userId?: number;
  status?: DiagnosisSessionStatus;
  currentStep?: number;
  startedAt?: string;
  completedAt?: string;
  inputSnapshot?: string;
}
