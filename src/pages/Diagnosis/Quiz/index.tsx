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
import type { ExamQuestion } from '../../../types/diagnosis';

const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

// 문항별 응답 시간 측정용 (렌더 중이 아닌 이벤트·effect 안에서만 호출)
const nowMs = () => Date.now();

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
  const [advancing, setAdvancing] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(new Set());
  const [savedObjectiveAnswers, setSavedObjectiveAnswers] = useState<Record<number, string | null>>(
    {}
  );
  const [savedEssayAnswers, setSavedEssayAnswers] = useState<Record<number, string>>({});

  const questionStartedAtRef = useRef(0);
  const advancingRef = useRef(false);

  const current = questions[index];
  const total = questions.length;
  const isEssay = isEssayQuestion(current);
  const completedCount = completedIndexes.size;
  const currentCompleted = completedIndexes.has(index);

  const savedObjectiveAnswer = savedObjectiveAnswers[index] ?? null;
  const isObjectiveCompleted = currentCompleted && !isEssay;
  const objectiveAnswerChanged =
    isObjectiveCompleted && Boolean(selected) && selected !== savedObjectiveAnswer;

  const resetQuestionInput = (
    questionIndex: number,
    objectiveAnswers = savedObjectiveAnswers,
    essayAnswers = savedEssayAnswers
  ) => {
    setIndex(questionIndex);
    setSelected(objectiveAnswers[questionIndex] ?? null);
    setEssayAnswer(essayAnswers[questionIndex] ?? '');
    questionStartedAtRef.current = nowMs();
  };

  const findNextIncompleteIndex = (
    fromIndex: number,
    completed: Set<number> = completedIndexes
  ) => {
    if (questions.length === 0) return null;

    for (let offset = 1; offset <= questions.length; offset += 1) {
      const candidateIndex = (fromIndex + offset) % questions.length;

      if (!completed.has(candidateIndex)) {
        return candidateIndex;
      }
    }

    return null;
  };

  const finishDiagnosis = async () => {
    let competencyResult = null;

    try {
      if (sessionId) competencyResult = await scoreSession(sessionId);
    } catch (error) {
      console.error('점수 산출 실패:', error);
    }

    navigate('/diagnosis/loading', { state: { sessionId, competencyResult } });
  };

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

        const completed = new Set<number>();
        const objectiveAnswerMap: Record<number, string | null> = {};
        const essayAnswerMap: Record<number, string> = {};

        inProgress?.examAnswers?.forEach((answer) => {
          const questionIndex = qs.findIndex((question) => question.id === answer.examQuestionId);

          if (questionIndex >= 0 && answer.selectedAnswer) {
            completed.add(questionIndex);
            objectiveAnswerMap[questionIndex] = answer.selectedAnswer;
          }
        });

        inProgress?.essayAnswers?.forEach((answer) => {
          const questionIndex = answer.questionNo - 1;

          if (questionIndex >= 0 && questionIndex < qs.length && answer.answerText?.trim()) {
            completed.add(questionIndex);
            essayAnswerMap[questionIndex] = answer.answerText;
          }
        });

        let initialIndex = 0;

        if (completed.size > 0) {
          const firstIncompleteIndex = qs.findIndex((_, questionIndex) => {
            return !completed.has(questionIndex);
          });

          initialIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : qs.length - 1;
        } else if (sid && inProgress?.session?.currentStep && inProgress.session.currentStep > 2) {
          initialIndex = Math.min(inProgress.session.currentStep - 2, qs.length - 1);
        }

        setSessionId(sid);
        setQuestions(qs);
        setCompletedIndexes(completed);
        setSavedObjectiveAnswers(objectiveAnswerMap);
        setSavedEssayAnswers(essayAnswerMap);
        setIndex(initialIndex);
        setSelected(objectiveAnswerMap[initialIndex] ?? null);
        setEssayAnswer(essayAnswerMap[initialIndex] ?? '');
        questionStartedAtRef.current = nowMs();

        if (qs.length === 0) {
          setError('등록된 시험 문항이 없습니다.');
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
    let completedAfterSave = new Set(completedIndexes);
    let objectiveAnswersAfterSave = { ...savedObjectiveAnswers };
    let essayAnswersAfterSave = { ...savedEssayAnswers };
    let shouldMarkCompleted = false;

    try {
      if (sessionId && q) {
        const responseSec = essay ? 0 : Math.round((nowMs() - questionStartedAtRef.current) / 1000);

        if (essay) {
          const text = (answer ?? '').trim();

          if (text) {
            await createEssayAnswer({
              diagnosisSessionId: sessionId,
              questionNo: index + 1,
              answerText: text,
            });

            shouldMarkCompleted = true;
            essayAnswersAfterSave = {
              ...essayAnswersAfterSave,
              [index]: text,
            };

            setSavedEssayAnswers(essayAnswersAfterSave);
          }
        } else {
          await createExamAnswer({
            diagnosisSessionId: sessionId,
            examQuestionId: q.id,
            selectedAnswer: answer,
            correct: answer === q.correctAnswer,
            responseSec,
          });

          if (answer) {
            shouldMarkCompleted = true;
            objectiveAnswersAfterSave = {
              ...objectiveAnswersAfterSave,
              [index]: answer,
            };

            setSavedObjectiveAnswers(objectiveAnswersAfterSave);
          }
        }
      }

      if (shouldMarkCompleted) {
        completedAfterSave = new Set(completedIndexes);
        completedAfterSave.add(index);
        setCompletedIndexes(completedAfterSave);
      }
    } catch (error) {
      console.error('답변 저장 실패:', error);
    }

    if (completedAfterSave.size >= questions.length) {
      await finishDiagnosis();
      return;
    }

    const nextIncompleteIndex = findNextIncompleteIndex(index, completedAfterSave);
    const targetIndex = nextIncompleteIndex ?? index + 1;
    const targetQuestion = questions[targetIndex];

    if (sessionId && targetQuestion) {
      updateSession(sessionId, {
        currentStep: targetIndex + 2,
        status: 'in_progress',
      }).catch(() => {});
    }

    if (targetQuestion) {
      resetQuestionInput(targetIndex, objectiveAnswersAfterSave, essayAnswersAfterSave);
    }

    advancingRef.current = false;
    setAdvancing(false);
  };

  // 객관식은 보기를 고르는 즉시 저장 (다음 질문은 이동만)
  const selectOption = async (answer: string) => {
    const q = questions[index];
    if (!sessionId || !q || savingAnswer) return;

    const previous = selected;
    setSelected(answer);
    if (answer === savedObjectiveAnswers[index]) return;

    setSavingAnswer(true);
    try {
      await createExamAnswer({
        diagnosisSessionId: sessionId,
        examQuestionId: q.id,
        selectedAnswer: answer,
        correct: answer === q.correctAnswer,
        responseSec: Math.round((nowMs() - questionStartedAtRef.current) / 1000),
      });
      setSavedObjectiveAnswers((prev) => ({ ...prev, [index]: answer }));
      setCompletedIndexes((prev) => new Set(prev).add(index));
    } catch (error) {
      console.error('답변 저장 실패:', error);
      setSelected(previous);
    } finally {
      setSavingAnswer(false);
    }
  };

  const goToQuestion = (questionIndex: number) => {
    if (advancing) return;

    const targetQuestion = questions[questionIndex];
    if (!targetQuestion) return;

    resetQuestionInput(questionIndex);
  };

  const moveToNextIncompleteQuestion = async () => {
    if (completedIndexes.size >= questions.length) {
      await finishDiagnosis();
      return;
    }

    const nextIncompleteIndex = findNextIncompleteIndex(index);
    if (nextIncompleteIndex === null) return;

    const targetQuestion = questions[nextIncompleteIndex];
    if (!targetQuestion) return;

    if (sessionId) {
      updateSession(sessionId, {
        currentStep: nextIncompleteIndex + 2,
        status: 'in_progress',
      }).catch(() => {});
    }

    resetQuestionInput(nextIncompleteIndex);
  };

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

  const currentNo = index + 1;
  const progress = total > 0 ? Math.round((currentNo / total) * 100) : 0;
  const canFinishAfterCurrent = !currentCompleted && completedCount === total - 1;
  const canFinishNow = currentCompleted && completedCount === total && !objectiveAnswerChanged;

  const actionButtonLabel = canFinishNow || canFinishAfterCurrent ? '결과 보기' : '다음 질문';

  const actionButtonDisabled =
    advancing ||
    savingAnswer ||
    (!currentCompleted && (isEssay ? !essayAnswer.trim() : !selected)) ||
    (isObjectiveCompleted && objectiveAnswerChanged && !selected);

  const options = OPTION_IDS.map((id) => ({
    id,
    text: current[`option${id}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'],
  }));

  const handlePrev = () => {
    if (index > 0) {
      goToQuestion(index - 1);
      return;
    }
    setShowBackConfirm(true);
  };

  return (
    <>
      <div className="min-h-screen bg-surface flex flex-col">
        <div className="max-w-[1090px] w-full mx-auto px-4 sm:px-6 pt-6 pb-32 flex-1">
          <div className="mb-8 text-center">
            <span className="inline-block px-14 py-1.5 mb-3 rounded-full bg-secondary-container/10 text-xs font-bold text-secondary">
              공통 역량 진단
            </span>

            <h1 className="break-keep text-2xl sm:text-[30px] sm:leading-tight font-bold text-primary-container mb-2">
              {isEssay ? '질문을 읽고 답변을 작성해주세요' : '문제를 읽고 가장 적절한 답을 선택해주세요'}
            </h1>

            <p className="text-[13px] text-on-surface-variant">
              천천히 읽고 답해주세요. · {currentNo} / {total} 완료
            </p>
          </div>

          <div className="h-[5px] w-full bg-surface-container-high rounded-full overflow-hidden mb-7">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-3 items-start">
            <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-[30px] md:min-h-[468px]">
              <div className="flex items-start justify-between gap-4 mb-8">
                <span className="text-xs font-bold text-primary-container">
                  QUESTION {String(index + 1).padStart(2, '0')} / {total}
                </span>

                {savingAnswer ? (
                  <span className="text-[11px] font-bold text-on-surface-variant shrink-0">SAVING...</span>
                ) : (
                  currentCompleted && <span className="text-[11px] font-bold text-secondary shrink-0">AUTO SAVED ✓</span>
                )}
              </div>

              <h2 className="break-keep text-xl sm:text-[22px] font-bold text-primary-container leading-snug whitespace-pre-line mb-8">
                {current.questionText}
              </h2>

              {isEssay ? (
                <div className="space-y-3">
                  <textarea
                    value={essayAnswer}
                    onChange={(event) => {
                      if (currentCompleted) return;
                      setEssayAnswer(event.target.value);
                    }}
                    readOnly={currentCompleted}
                    disabled={advancing}
                    maxLength={10000}
                    placeholder="답변을 입력해주세요."
                    className={`w-full min-h-[220px] resize-none rounded-xl border border-outline-variant/40 bg-white p-4 text-sm leading-relaxed text-on-surface outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/10 ${
                      currentCompleted ? 'cursor-default' : ''
                    } disabled:opacity-60`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-on-surface-variant">
                    <span>서술형 답변은 AI 분석 및 진로 리포트 생성에 활용됩니다.</span>
                    <span>{essayAnswer.length}/10000</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-[18px] md:max-w-[690px]">
                  {options.map(({ id, text }) => {
                    const active = selected === id;

                    return (
                      <button
                        key={id}
                        onClick={() => void selectOption(id)}
                        disabled={advancing || savingAnswer}
                        className={`text-left min-h-[92px] px-4 py-3.5 rounded-xl border transition-all disabled:opacity-60 ${
                          active
                            ? 'border-2 border-secondary bg-secondary-container/10'
                            : 'border-outline-variant/40 hover:bg-surface-container-low'
                        }`}
                      >
                        <p className="text-[11px] font-bold text-primary-container mb-2">OPTION {id}</p>
                        <p className="text-xs text-primary-container leading-relaxed whitespace-pre-line">{text}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-3">
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 md:min-h-[210px]">
                <p className="text-[13px] font-bold text-primary-container mb-4">문항 진행 현황</p>

                <div className="grid grid-cols-10 gap-[5px]">
                  {questions.map((question, i) => {
                    const isDone = completedIndexes.has(i);
                    const isCurrent = i === index;

                    return (
                      <button
                        key={question.id ?? i}
                        type="button"
                        onClick={() => goToQuestion(i)}
                        disabled={advancing}
                        title={`${i + 1}번 문항으로 이동`}
                        className={`w-full aspect-square rounded text-[10px] font-bold flex items-center justify-center transition-all disabled:opacity-60 ${
                          isCurrent
                            ? 'border-2 border-primary-container bg-white text-primary-container'
                            : isDone
                            ? 'bg-secondary text-white hover:opacity-90'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/20 hover:text-secondary'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 text-center">
                <p className="text-xs font-bold text-on-surface-variant mb-3">공통 역량 진단</p>
                <p className="text-[30px] font-bold text-primary-container leading-none mb-3">
                  {currentNo} / {total}
                </p>
                <p className="text-xs text-on-surface-variant">약 {progress}% 완료</p>
              </div>

              <div className="bg-primary-container rounded-2xl p-5">
                <p className="text-xs font-bold text-secondary-container mb-2">TIP</p>
                <p className="text-xs leading-relaxed text-white">
                  한 문제만으로 결과가 결정되지 않습니다.
                  <br />
                  여러 문항을 종합해 해석합니다.
                </p>
              </div>
            </aside>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/40">
          <div className="max-w-[1250px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={advancing}
              className="text-[13px] font-bold text-on-surface-variant hover:text-primary-container transition-colors disabled:opacity-60 shrink-0"
            >
              ← {index > 0 ? '이전 문항' : '이전 단계'}
            </button>

            <p className="hidden sm:block text-[13px] font-bold text-on-surface-variant">
              3단계 / 5단계 · 공통 역량 · {index + 1} / {total}
            </p>

            <button
              onClick={() => {
                if (currentCompleted && !objectiveAnswerChanged) {
                  void moveToNextIncompleteQuestion();
                  return;
                }

                void advance(isEssay ? essayAnswer : selected);
              }}
              disabled={actionButtonDisabled}
              className="shrink-0 px-8 py-2.5 rounded-lg bg-secondary text-[13px] font-bold text-white hover:opacity-90 transition-opacity disabled:bg-on-primary-container disabled:opacity-100"
            >
              {actionButtonLabel} →
            </button>
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
