import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';
import {
  getInProgressSession,
  createSession,
  updateSession,
  deleteSession,
  createEssayAnswer,
} from '../../../api/diagnosis';
import type { DiagnosisSession } from '../../../types/diagnosis';

const GRADES = ['1학년', '2학년', '3학년'] as const;

const SUBJECTS = [
  { label: '수학', icon: 'calculate' },
  { label: '과학', icon: 'science' },
  { label: '국어', icon: 'menu_book' },
  { label: '사회', icon: 'public' },
  { label: '영어', icon: 'translate' },
  { label: '예술', icon: 'palette' },
  { label: '정보/코딩', icon: 'code' },
];

const COMPETENCIES = ['문제 해결 능력', '창의적 사고', '협업 및 소통'] as const;

const DiagnosisMajor = () => {
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('1학년');
  const [dreamJob, setDreamJob] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['과학']);
  const [studyHours, setStudyHours] = useState(4.5);
  const [learningStyle, setLearningStyle] = useState<'theory' | 'practice'>('theory');
  const [exploreSpectrum, setExploreSpectrum] = useState(50);
  const [scores, setScores] = useState<Record<string, number>>({
    '문제 해결 능력': 4,
    '창의적 사고': 3,
    '협업 및 소통': 5,
  });
  const [aspiration, setAspiration] = useState(
    '저는 인공지능 기술이 교육의 불평등을 해소하는 미래를 꿈꿉니다. 단순히 지식을 전달하는 것을 넘어, 개인별 맞춤형 커리큘럼을 제안하는 시스템을 설계하는 데이터 사이언티스트가 되고 싶습니다. 이를 위해 컴퓨터공학과 데이터 과학을 융합적으로 공부하고자 합니다.',
  );

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [snapshotBase, setSnapshotBase] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pageState, setPageState] = useState<'loading' | 'choice' | 'form'>('loading');
  const [foundSession, setFoundSession] = useState<DiagnosisSession | null>(null);

  const sessionIdRef = useRef<number | null>(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySnapshot = (snap: Record<string, unknown>) => {
    if (snap.grade) setGrade(snap.grade as typeof grade);
    if (snap.dreamJob != null) setDreamJob(snap.dreamJob as string);
    if (Array.isArray(snap.selectedSubjects)) setSelectedSubjects(snap.selectedSubjects as string[]);
    if (snap.studyHours != null) setStudyHours(snap.studyHours as number);
    if (snap.learningStyle) setLearningStyle(snap.learningStyle as 'theory' | 'practice');
    if (snap.exploreSpectrum != null) setExploreSpectrum(snap.exploreSpectrum as number);
    if (snap.scores) setScores(snap.scores as Record<string, number>);
    if (snap.aspiration != null) setAspiration(snap.aspiration as string);
  };

  // 마운트: 진행 중 세션 유무에 따라 선택 화면 or 폼으로 바로 진입
  useEffect(() => {
    const skipChoice = (location.state as { skipChoice?: boolean } | null)?.skipChoice;
    (async () => {
      try {
        const data = await getInProgressSession();
        if (data?.session) {
          const base = (() => { try { return JSON.parse(data.session.inputSnapshot || '{}'); } catch { return {}; } })();
          if (skipChoice) {
            setSessionId(data.session.id);
            setSnapshotBase(base);
            applySnapshot(base);
            setPageState('form');
          } else {
            setFoundSession(data.session);
            setPageState('choice');
          }
        } else {
          setPageState('form');
        }
      } catch {
        setPageState('form');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    if (!foundSession) return;
    setSessionId(foundSession.id);
    try {
      const base = JSON.parse(foundSession.inputSnapshot || '{}');
      setSnapshotBase(base);
      applySnapshot(base);
    } catch { /* 파싱 실패 무시 */ }
    setFoundSession(null);
    setPageState('form');
  };

  const handleNewDiagnosis = async () => {
    if (foundSession) {
      await deleteSession(foundSession.id).catch(() => {});
    }
    setFoundSession(null);
    setPageState('form');
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  // 현재 폼 입력값을 기존 스냅샷에 머지해 직렬화 (tendencyAnswers 등 유지)
  const buildSnapshot = () =>
    JSON.stringify({
      ...snapshotBase,
      grade,
      dreamJob,
      selectedSubjects,
      studyHours,
      learningStyle,
      exploreSpectrum,
      scores,
      aspiration,
    });

  // 세션 생성 또는 수정. 생성/수정된 세션 id 반환
  const persistSession = async (status: 'in_progress' | 'completed') => {
    const inputSnapshot = buildSnapshot();
    if (sessionId) {
      const updated = await updateSession(sessionId, { status, currentStep: 1, inputSnapshot });
      return updated.id;
    }
    const created = await createSession({
      userId: user?.id,
      status,
      currentStep: 1,
      startedAt: new Date().toISOString(),
      inputSnapshot,
    });
    setSessionId(created.id);
    return created.id;
  };

  // 폼 변경 시 2초 debounce 자동저장 (폼 화면일 때만)
  useEffect(() => {
    if (pageState !== 'form') return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const snapshot = buildSnapshot();
      const sid = sessionIdRef.current;
      try {
        setAutoSaveStatus('saving');
        if (sid) {
          await updateSession(sid, { status: 'in_progress', currentStep: 1, inputSnapshot: snapshot });
        } else {
          const created = await createSession({
            userId: user?.id,
            status: 'in_progress',
            currentStep: 1,
            startedAt: new Date().toISOString(),
            inputSnapshot: snapshot,
          });
          sessionIdRef.current = created.id;
          setSessionId(created.id);
        }
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState, grade, dreamJob, selectedSubjects, studyHours, learningStyle, exploreSpectrum, scores, aspiration]);

  // 이전에 저장된 스냅샷을 폼에 복원
  // 다음 단계로: 세션 저장 + 포부(서술형) 등록 후 퀴즈 단계로 이동
  const handleNext = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setError(null);
    setSubmitting(true);
    try {
      const id = await persistSession('in_progress');
      if (aspiration.trim()) {
        await createEssayAnswer({ diagnosisSessionId: id, questionNo: 1, answerText: aspiration });
      }
      navigate('/diagnosis/tendency');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (pageState === 'choice' && foundSession) {
    const savedAt = new Date(foundSession.updatedAt).toLocaleString('ko-KR', {
      month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-[600px]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-secondary-container/20 text-secondary mb-4">
              <span className="material-symbols-outlined text-[14px]">manage_search</span>
              진단 시작
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-container mb-2">
              진행 중인 진단이 있습니다
            </h1>
            <p className="text-sm text-on-surface-variant">마지막 저장: {savedAt}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleContinue}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border-2 border-secondary bg-secondary/5 hover:scale-[1.01] transition-all"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-secondary text-white">
                <span className="material-symbols-outlined text-[28px]">play_arrow</span>
              </div>
              <p className="text-base font-bold text-secondary mb-1">이어서 진단하기</p>
              <p className="text-sm text-on-surface-variant">이전에 입력한 내용을 불러와 계속합니다</p>
            </button>
            <button
              onClick={() => void handleNewDiagnosis()}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest hover:border-secondary/50 hover:bg-surface-container-low hover:scale-[1.01] transition-all"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-surface-container-high text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined text-[28px]">add</span>
              </div>
              <p className="text-base font-bold text-primary-container mb-1">새 진단 시작하기</p>
              <p className="text-sm text-on-surface-variant">기존 진단을 종료하고 처음부터 다시 시작합니다</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 pt-6 pb-28">
        <div className="mb-8">
          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-primary-container">
              전공 적성 정밀 진단
            </h1>
            <p className="text-on-surface-variant text-sm mt-2">
              AI가 당신의 답변을 분석하여 최적의 진로를 설계합니다.
            </p>
          </div>
        </div>

        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sm:p-8 mb-6 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary-container mb-6">
            <span className="material-symbols-outlined text-secondary">school</span>
            기본 정보 및 관심 분야
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">현재 학년</label>
              <div className="flex gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      grade === g
                        ? 'border-secondary bg-secondary-container/15 text-secondary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">희망 직업 (꿈)</label>
              <div className="relative">
                <input
                  type="text"
                  value={dreamJob}
                  onChange={(e) => setDreamJob(e.target.value)}
                  placeholder="예: AI 데이터 사이언티스트"
                  className="w-full pl-4 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  travel_explore
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              가장 좋아하는 과목 (다중 선택)
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(({ label, icon }) => {
                const active = selectedSubjects.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleSubject(label)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      active
                        ? 'border-secondary bg-secondary-container/15 text-secondary'
                        : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sm:p-8 mb-6 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary-container mb-6">
            <span className="material-symbols-outlined text-secondary">monitoring</span>
            학습 패턴 및 성향 분석
          </h2>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-on-surface-variant">일일 평균 자기주도 학습 시간</label>
              <span className="px-3 py-1 bg-secondary-container/20 text-secondary text-xs font-bold rounded-full">
                {studyHours}시간
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-xs text-outline mt-2">
              <span>0시간</span>
              <span>5시간</span>
              <span>10시간+</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-on-surface-variant mb-3">선호하는 학습 방식</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'theory', icon: 'menu_book', title: '이론 및 원리 중심', desc: '개념의 기초를 다지고 논리적인 인과관계를 파악하는 공부를 즐깁니다.' },
                { id: 'practice', icon: 'science', title: '실습 및 응용 중심', desc: '배운 내용을 직접 실험하거나 프로젝트를 통해 결과물을 만드는 것을 선호합니다.' },
              ].map(({ id, icon, title, desc }) => {
                const active = learningStyle === id;
                return (
                  <button
                    key={id}
                    onClick={() => setLearningStyle(id as typeof learningStyle)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      active
                        ? 'border-secondary bg-secondary-container/10'
                        : 'border-outline-variant/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`material-symbols-outlined text-[20px] ${active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {icon}
                      </span>
                      <span className={`text-sm font-bold ${active ? 'text-secondary' : 'text-primary-container'}`}>
                        {title}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-3">탐구 성향 스펙트럼</label>
            <input
              type="range"
              min={0}
              max={100}
              value={exploreSpectrum}
              onChange={(e) => setExploreSpectrum(Number(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-xs text-outline mt-2">
              <span>익숙함 선호</span>
              <span>새로운 도전 선호</span>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sm:p-8 mb-8 shadow-[0_4px_12px_rgba(10,25,47,0.04)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary-container mb-6">
            <span className="material-symbols-outlined text-secondary">workspace_premium</span>
            역량 자가 진단 및 포부
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-on-surface-variant mb-3">핵심 역량 점수 (5점 만점)</label>
            <div className="space-y-2.5">
              {COMPETENCIES.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low rounded-xl"
                >
                  <span className="text-sm font-medium text-on-surface-variant">{name}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = n <= scores[name];
                      return (
                        <button
                          key={n}
                          onClick={() => setScores((prev) => ({ ...prev, [name]: n }))}
                          aria-label={`${name} ${n}점`}
                          className="leading-none"
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] transition-colors ${
                              filled ? 'text-secondary' : 'text-outline-variant'
                            }`}
                            style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-on-surface-variant">
                향후 10년 뒤 나의 모습과 커리어 목표
              </label>
              <span className="text-xs text-outline">{aspiration.length} / 500자</span>
            </div>
            <textarea
              value={aspiration}
              onChange={(e) => setAspiration(e.target.value.slice(0, 500))}
              rows={5}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm leading-relaxed text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all resize-none"
            />
          </div>
        </section>

        {error && <p className="mb-3 text-sm text-error text-right">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(10,25,47,0.04)]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="w-24" />
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>1단계 <span className="font-bold text-primary-container">/ 3단계</span></span>
          </div>
          <div className="flex items-center gap-3">
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                저장 중...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                자동 저장됨
              </span>
            )}
            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-[0_8px_20px_rgba(13,28,50,0.18)] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? '처리 중...' : '다음 단계로'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisMajor;
