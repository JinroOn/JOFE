import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';
import {
  getInProgressSession,
  createSession,
  getQuestions,
  createExamAnswer,
  scoreSession,
} from '../../../api/diagnosis';
import type { CompetencyCategory, ExamQuestion } from '../../../types/diagnosis';

const CATEGORY_LABELS: Record<CompetencyCategory, { label: string; icon: string }> = {
  math_logic: { label: '수리·논리', icon: 'calculate' },
  problem_solving: { label: '문제 해결', icon: 'lightbulb' },
  info_tech: { label: '정보·기술', icon: 'memory' },
  implementation: { label: '구현', icon: 'code' },
  system_understanding: { label: '시스템 이해', icon: 'account_tree' },
  data_analysis: { label: '데이터 분석', icon: 'bar_chart' },
  communication: { label: '의사소통', icon: 'forum' },
  collaboration: { label: '협업', icon: 'groups' },
  self_management: { label: '자기관리', icon: 'self_improvement' },
};

const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

const DiagnosisQuiz = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  // 콜백에서 최신 값 참조용 ref
  const remainingRef = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const advancingRef = useRef(false);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // 현재 타이머가 적용된 문항 id (문항 변경 감지용)
  const [trackedId, setTrackedId] = useState<number | null>(null);

  const current = questions[index];
  const total = questions.length;

  // 마운트: 진행 중 세션 확보 + 문항 로드
  useEffect(() => {
    (async () => {
      try {
        const [inProgress, qs] = await Promise.all([getInProgressSession(), getQuestions()]);
        let sid = inProgress?.session?.id ?? null;
        if (!sid) {
          const created = await createSession({
            userId: user?.id,
            status: 'in_progress',
            currentStep: 2,
            startedAt: new Date().toISOString(),
            inputSnapshot: '{}',
          });
          sid = created.id;
        }
        setSessionId(sid);
        setQuestions(qs);
        if (qs.length === 0) setError('등록된 시험 문항이 없습니다.');
      } catch {
        setError('문항을 불러오지 못했습니다. 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 답변 제출 후 다음 문항으로 (또는 마지막이면 점수 산출 후 로딩 화면)
  const advance = async (answer: string | null) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);

    const q = questions[index];
    try {
      if (sessionId && q) {
        await createExamAnswer({
          diagnosisSessionId: sessionId,
          examQuestionId: q.id,
          selectedAnswer: answer ?? '',
          correct: answer === q.correctAnswer,
          responseSec: Math.max(0, q.timeLimitSec - remainingRef.current),
        });
      }
    } catch {
      /* 답변 저장 실패해도 진단은 계속 진행 */
    }

    if (index >= questions.length - 1) {
      try {
        if (sessionId) await scoreSession(sessionId);
      } catch {
        /* 점수 산출 실패해도 다음 화면으로 */
      }
      navigate('/diagnosis/loading');
      return;
    }

    setIndex((i) => i + 1);
    setSelected(null);
    advancingRef.current = false;
    setAdvancing(false);
  };

  // 문항이 바뀌면 타이머 초기화 (렌더 단계에서 보정 — React 권장 패턴)
  if (current && current.id !== trackedId) {
    setTrackedId(current.id);
    setRemaining(current.timeLimitSec);
  }

  // 1초마다 카운트다운
  useEffect(() => {
    if (!current) return;
    const timer = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // 제한시간 종료 시 현재 선택값으로 자동 제출
  useEffect(() => {
    if (current && trackedId === current.id && remaining === 0) {
      void advance(selectedRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">문항을 불러오는 중...</p>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-on-surface-variant text-sm">{error ?? '표시할 문항이 없습니다.'}</p>
        <button
          onClick={() => navigate('/diagnosis')}
          className="px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl"
        >
          진단으로 돌아가기
        </button>
      </div>
    );
  }

  const isLast = index === total - 1;
  const progress = Math.round((index / total) * 100);
  const timerOffset = 100 - (remaining / current.timeLimitSec) * 100;
  const categoryMeta = CATEGORY_LABELS[current.competencyCategory] ?? {
    label: current.competencyCategory,
    icon: 'quiz',
  };
  const options = OPTION_IDS.map((id) => ({
    id,
    text: current[`option${id}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'],
  }));

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-8 pt-8 pb-32 flex-1">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-secondary-container/30 text-secondary">
            <span className="material-symbols-outlined text-[18px]">{categoryMeta.icon}</span>
            {categoryMeta.label}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="text-xs font-bold tracking-widest text-on-surface-variant">
                  QUESTION {String(index + 1).padStart(2, '0')} / {total}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-secondary shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  AI LIVE ANALYZING
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-primary-container leading-snug mb-6">
                {current.questionText}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map(({ id, text }) => {
                  const active = selected === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      disabled={advancing}
                      className={`text-left p-4 rounded-xl border transition-all disabled:opacity-60 ${
                        active
                          ? 'border-secondary bg-secondary-container/10 shadow-[0_0_0_3px_rgba(0,210,255,0.12)]'
                          : 'border-outline-variant/40 hover:bg-surface-container-low'
                      }`}
                    >
                      <p className={`text-xs font-bold tracking-widest mb-1.5 ${active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        OPTION {id}
                      </p>
                      <p className="text-sm text-on-surface leading-relaxed">{text}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex items-center justify-between mt-4 px-2">
              <button
                onClick={() => advance(null)}
                disabled={advancing}
                className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">double_arrow</span>
                이 문제 건너뛰기
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_12px_rgba(10,25,47,0.04)] flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#e0e3e6" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="289"
                    strokeDashoffset={(289 * timerOffset) / 100}
                    className="text-secondary transition-all"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-extrabold text-primary-container leading-none">
                    {String(remaining).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] tracking-widest text-on-surface-variant mt-1">SECONDS</p>
                </div>
              </div>
              <p className="text-base font-bold text-primary-container mt-5">Time is running out!</p>
              <p className="text-xs text-on-surface-variant text-center mt-1">
                빠른 판단이 높은 점수로 이어집니다.
              </p>
            </div>

            <div className="bg-primary-container text-white rounded-2xl p-5 shadow-[0_8px_20px_rgba(13,28,50,0.12)]">
              <p className="text-xs font-bold tracking-widest text-secondary-container mb-2">
                MEMBER TIP
              </p>
              <p className="text-sm leading-relaxed text-white/90">
                시간 안에 가장 적절한 선택지를 고르세요. 정답 여부와 응답 속도가 역량 점수에 반영됩니다.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(10,25,47,0.04)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>전체 진행률</span>
              <span className="font-bold">{progress}% 완료</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-on-surface-variant">다음 단계</p>
              <p className="text-sm font-bold text-primary-container">AI 성향 매칭</p>
            </div>
            <button
              onClick={() => advance(selected)}
              disabled={advancing || !selected}
              className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isLast ? '결과 보기' : '다음 질문'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisQuiz;
