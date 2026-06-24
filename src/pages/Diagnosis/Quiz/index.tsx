import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';
import {
  getInProgressSession,
  createSession,
  updateSession,
  getQuestions,
  createExamAnswer,
  createEssayAnswer,
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

const isEssayQuestion = (question?: ExamQuestion | null) => {
  if (!question) return false;

  const hasNoOptions =
    !question.optionA?.trim() &&
    !question.optionB?.trim() &&
    !question.optionC?.trim() &&
    !question.optionD?.trim();

  return question.questionType === 'essay' || hasNoOptions;
};

const DiagnosisQuiz = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const remainingRef = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const essayAnswerRef = useRef('');
  const advancingRef = useRef(false);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    essayAnswerRef.current = essayAnswer;
  }, [essayAnswer]);

  const [trackedId, setTrackedId] = useState<number | null>(null);

  const current = questions[index];
  const total = questions.length;
  const isEssay = isEssayQuestion(current);

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

        if (qs.length === 0) {
          setError('등록된 시험 문항이 없습니다.');
        } else if (sid && inProgress?.session?.currentStep && inProgress.session.currentStep > 2) {
          const resumeIdx = Math.min(inProgress.session.currentStep - 2, qs.length - 1);
          setIndex(resumeIdx);
        }
      } catch {
        setError('문항을 불러오지 못했습니다. 다시 시도해 주세요.');
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = async (answer: string | null) => {
    if (advancingRef.current) return;

    advancingRef.current = true;
    setAdvancing(true);

    const q = questions[index];
    const essay = isEssayQuestion(q);

    try {
      if (sessionId && q) {
        const responseSec = essay ? 0 : Math.max(0, q.timeLimitSec - remainingRef.current);

        if (essay) {
          const text = (answer ?? '').trim();

          if (text) {
            await createEssayAnswer({
              diagnosisSessionId: sessionId,
              questionNo: index + 1,
              answerText: text,
            });
          }
        } else {
          await createExamAnswer({
            diagnosisSessionId: sessionId,
            examQuestionId: q.id,
            selectedAnswer: answer,
            correct: answer === q.correctAnswer,
            responseSec,
          });
        }
      }
    } catch (error) {
      console.error('답변 저장 실패:', error);
    }

    if (index >= questions.length - 1) {
      let competencyResult = null;

      try {
        if (sessionId) competencyResult = await scoreSession(sessionId);
      } catch (error) {
        console.error('점수 산출 실패:', error);
      }

      navigate('/diagnosis/loading', { state: { sessionId, competencyResult } });
      return;
    }

    const nextIndex = index + 1;

    if (sessionId) {
      updateSession(sessionId, {
        currentStep: nextIndex + 2,
        status: 'in_progress',
      }).catch(() => {});
    }

    setIndex(nextIndex);
    setSelected(null);
    setEssayAnswer('');
    advancingRef.current = false;
    setAdvancing(false);
  };

  if (current && current.id !== trackedId) {
    setTrackedId(current.id);
    setRemaining(isEssayQuestion(current) ? 0 : current.timeLimitSec);
  }

  useEffect(() => {
    if (!current || isEssayQuestion(current)) return;

    const timer = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [current]);

  useEffect(() => {
    if (!current || isEssayQuestion(current)) return;

    if (trackedId === current.id && remaining === 0) {
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
  const timerOffset = current.timeLimitSec > 0 ? 100 - (remaining / current.timeLimitSec) * 100 : 0;

  const categoryMeta = CATEGORY_LABELS[current.competencyCategory] ?? {
    label: current.competencyCategory,
    icon: 'quiz',
  };

  const options = OPTION_IDS.map((id) => ({
    id,
    text: current[`option${id}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'],
  }));

  return (
    <>
      <div className="min-h-screen bg-surface flex flex-col">
        <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-8 pt-8 pb-32 flex-1">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-secondary-container/20 text-secondary mb-4">
              <span className="material-symbols-outlined text-[14px]">{categoryMeta.icon}</span>
              {categoryMeta.label}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-primary-container mb-2">
              {isEssay ? '답변을 작성해주세요' : '가장 적절한 답을 선택해주세요'}
            </h1>

            <p className="text-sm text-on-surface-variant">
              {isEssay ? '시간 제한 없이 충분히 작성하세요' : '시간 안에 신중하게 선택하세요'}{' '}
              &middot; {index + 1}/{total} 완료
            </p>
          </div>

          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
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

                {isEssay ? (
                  <div className="space-y-3">
                    <textarea
                      value={essayAnswer}
                      onChange={(event) => setEssayAnswer(event.target.value)}
                      disabled={advancing}
                      maxLength={10000}
                      placeholder="답변을 입력해주세요."
                      className="w-full min-h-[220px] resize-none rounded-xl border border-outline-variant/40 bg-white p-4 text-sm leading-relaxed text-on-surface outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-on-surface-variant">
                      <span>서술형 답변은 AI 분석 및 진로 리포트 생성에 활용됩니다.</span>
                      <span>{essayAnswer.length}/10000</span>
                    </div>
                  </div>
                ) : (
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
                          <p
                            className={`text-xs font-bold tracking-widest mb-1.5 ${
                              active ? 'text-secondary' : 'text-on-surface-variant'
                            }`}
                          >
                            OPTION {id}
                          </p>

                          <p className="text-sm text-on-surface leading-relaxed">{text}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="flex items-center justify-between mt-4 px-2">
                {!isEssay && (
                  <button
                    onClick={() => advance(null)}
                    disabled={advancing}
                    className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">double_arrow</span>이 문제
                    건너뛰기
                  </button>
                )}
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
                <p className="text-xs font-bold text-on-surface-variant mb-3">문항 진행 현황</p>

                <div className="grid grid-cols-10 gap-1">
                  {questions.map((_, i) => {
                    const isDone = i < index;
                    const isCurrent = i === index;

                    return (
                      <div
                        key={i}
                        className={`w-full aspect-square rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-primary-container text-white shadow-[0_2px_6px_rgba(13,28,50,0.2)]'
                            : isDone
                            ? 'bg-secondary text-white'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isEssay && (
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-[0_4px_12px_rgba(10,25,47,0.04)] flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="#e0e3e6"
                        strokeWidth="4"
                      />
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
                      <p className="text-[10px] tracking-widest text-on-surface-variant mt-1">
                        SECONDS
                      </p>
                    </div>
                  </div>

                  <p className="text-base font-bold text-primary-container mt-5">
                    Time is running out!
                  </p>
                  <p className="text-xs text-on-surface-variant text-center mt-1">
                    빠른 판단이 높은 점수로 이어집니다.
                  </p>
                </div>
              )}

              <div className="bg-primary-container text-white rounded-2xl p-5 shadow-[0_8px_20px_rgba(13,28,50,0.12)]">
                <p className="text-xs font-bold tracking-widest text-secondary-container mb-2">
                  MEMBER TIP
                </p>
                <p className="text-sm leading-relaxed text-white/90">
                  {isEssay
                    ? '최근 경험과 해결 과정을 구체적으로 작성하면 AI 분석에 더 도움이 됩니다.'
                    : '시간 안에 가장 적절한 선택지를 고르세요. 정답 여부와 응답 속도가 역량 점수에 반영됩니다.'}
                </p>
              </div>
            </aside>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(10,25,47,0.04)]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setShowBackConfirm(true)}
              disabled={advancing}
              className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-60 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">이전 단계</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              <span>
                3단계 <span className="font-bold text-primary-container">/ 3단계</span>
              </span>
              <span className="text-outline-variant">·</span>
              <span>
                문항 {index + 1}
                <span className="font-bold text-primary-container">/{total}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => advance(isEssay ? essayAnswer : selected)}
                disabled={advancing || (isEssay ? !essayAnswer.trim() : !selected)}
                className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isLast ? '결과 보기' : '다음 질문'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-yellow-600 text-2xl">warning</span>
            </div>

            <h3 className="text-lg font-bold text-on-surface mb-2">
              이전 단계로 돌아가시겠어요?
            </h3>

            <p className="text-sm text-on-surface-variant mb-6">
              지금까지 푼 역량 평가 문제가 모두 초기화됩니다. 계속하시겠습니까?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="flex-1 py-3 rounded-lg border border-outline-variant/30 font-bold hover:bg-surface-container-low transition-all"
              >
                취소
              </button>

              <button
                onClick={() => navigate('/diagnosis/tendency')}
                className="flex-1 py-3 rounded-lg bg-primary-container text-white font-bold hover:opacity-90 transition-all"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiagnosisQuiz;