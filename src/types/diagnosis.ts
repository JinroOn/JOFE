export type DiagnosisSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface DiagnosisSession {
  id: number;
  userId: number;
  status: DiagnosisSessionStatus;
  currentStep: number;
  inputSnapshot: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAnswer {
  id: number;
  diagnosisSessionId: number;
  examQuestionId: number;
  selectedAnswer: string | null;
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

export type CompetencyCategory =
  | 'math_logic'
  | 'problem_solving'
  | 'info_tech'
  | 'implementation'
  | 'system_understanding'
  | 'data_analysis'
  | 'communication'
  | 'collaboration'
  | 'self_management';

export type QuestionType = 'objective' | 'situation' | 'preference' | 'essay';

export interface ExamQuestion {
  id: number;
  competencyCategory: CompetencyCategory;
  questionType?: QuestionType;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  timeLimitSec: number;
  difficulty: number;
}

export interface ExamAnswerPayload {
  diagnosisSessionId: number;
  examQuestionId: number;
  selectedAnswer: string | null;
  correct: boolean;
  responseSec: number;
}

export interface CompetencyResult {
  id: number;
  diagnosisSessionId: number;
  mathLogic: number;
  problemSolving: number;
  infoTech: number;
  implementation: number;
  systemUnderstanding: number;
  dataAnalysis: number;
  communication: number;
  collaboration: number;
  selfManagement: number;
}