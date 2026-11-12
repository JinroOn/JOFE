import { useEffect, useRef, useState, type ReactNode } from 'react';
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

const FIELDS = ['인문', '사회', '교육', '공학', '자연', '의약', '예체능', '아직 모르겠음'] as const;

const SUBJECTS = [
  { label: '수학', icon: 'calculate' },
  { label: '과학', icon: 'science' },
  { label: '국어', icon: 'menu_book' },
  { label: '사회', icon: 'public' },
  { label: '영어', icon: 'translate' },
  { label: '예술', icon: 'palette' },
  { label: '정보/코딩', icon: 'code' },
];

const CAREER_DECISIONS = ['전혀 정하지 못했다', '조금 고민 중이다', '어느 정도 정했다', '거의 정했다', '확고하게 정했다'] as const;

const COMPETENCIES = ['문제 해결 능력', '창의적 사고', '협업 및 소통'] as const;

const ACTIVITIES = ['발표', '토론', '실험·실습', '프로젝트', '동아리·봉사', '창작 활동'] as const;

const EXPERIENCES = ['관련 대회 참가', '동아리 활동', '인턴·체험 활동', '경험 없음'] as const;

const toggleItem = (list: string[], item: string) =>
  list.includes(item) ? list.filter((v) => v !== item) : [...list, item];

const Badge = ({ required }: { required?: boolean }) => (
  <span
    className={`px-2 py-0.5 rounded text-[10px] font-bold leading-none ${
      required ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant'
    }`}
  >
    {required ? '필수' : '선택'}
  </span>
);

const FieldLabel = ({ children, required }: { children: ReactNode; required?: boolean }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium text-primary-container">{children}</span>
    <Badge required={required} />
  </div>
);

const SectionTitle = ({ icon, children }: { icon: string; children: ReactNode }) => (
  <h2 className="flex items-center gap-2 text-xl font-medium text-primary-container">
    <span className="material-symbols-outlined text-secondary">{icon}</span>
    {children}
  </h2>
);

const chipClass = (active: boolean, shape: 'pill' | 'box' = 'pill') =>
  `border-2 px-[18px] py-[10px] text-xs font-medium transition-all ${shape === 'pill' ? 'rounded-full' : 'rounded-lg'} ${
    active
      ? 'border-secondary bg-secondary-container/10 text-secondary'
      : 'border-surface-container-high text-on-surface hover:bg-surface-container-low'
  }`;

const sectionClass = 'bg-surface-container-lowest rounded-brand p-6 sm:p-8 shadow-[0_1px_1px_rgba(0,0,0,0.05)]';

const thumbClass =
  'appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary-container [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_4px_10px_rgba(0,210,255,0.3)] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-secondary-container [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white';

const DiagnosisMajor = () => {
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('1학년');
  const [dreamJob, setDreamJob] = useState('');
  const [interestMajor, setInterestMajor] = useState('');
  const [interestFields, setInterestFields] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['과학']);
  const [burdenSubjects, setBurdenSubjects] = useState<string[]>([]);
  const [studyHours, setStudyHours] = useState(4.5);
  const [careerDecision, setCareerDecision] = useState<string | null>(null);
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
  const [preferredActivities, setPreferredActivities] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [snapshotBase, setSnapshotBase] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pageState, setPageState] = useState<'loading' | 'form'>('loading');
  const [foundSession, setFoundSession] = useState<DiagnosisSession | null>(null);

  const sessionIdRef = useRef<number | null>(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySnapshot = (snap: Record<string, unknown>) => {
    if (snap.grade) setGrade(snap.grade as typeof grade);
    if (snap.dreamJob != null) setDreamJob(snap.dreamJob as string);
    if (snap.interestMajor != null) setInterestMajor(snap.interestMajor as string);
    if (Array.isArray(snap.interestFields)) setInterestFields(snap.interestFields as string[]);
    if (Array.isArray(snap.selectedSubjects)) setSelectedSubjects(snap.selectedSubjects as string[]);
    if (Array.isArray(snap.burdenSubjects)) setBurdenSubjects(snap.burdenSubjects as string[]);
    if (snap.studyHours != null) setStudyHours(snap.studyHours as number);
    if (snap.careerDecision != null) setCareerDecision(snap.careerDecision as string);
    if (snap.learningStyle) setLearningStyle(snap.learningStyle as 'theory' | 'practice');
    if (snap.exploreSpectrum != null) setExploreSpectrum(snap.exploreSpectrum as number);
    if (snap.scores) setScores(snap.scores as Record<string, number>);
    if (snap.aspiration != null) setAspiration(snap.aspiration as string);
    if (Array.isArray(snap.preferredActivities)) setPreferredActivities(snap.preferredActivities as string[]);
    if (Array.isArray(snap.experiences)) setExperiences(snap.experiences as string[]);
  };

  // 마운트: 진행 중 세션이 있으면 상단에 이어하기 배너 표시
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
          } else {
            setFoundSession(data.session);
          }
        }
      } catch { /* 조회 실패 시 새 진단으로 진행 */ }
      setPageState('form');
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
  };

  // 배너가 떠 있는 상태에서 저장하면 기존 진단을 정리하고 새로 시작
  const confirmNewDiagnosis = async () => {
    if (!foundSession) return true;
    if (!window.confirm('이전에 중단된 진단은 삭제되고 새로 시작합니다. 계속할까요?')) return false;
    await deleteSession(foundSession.id).catch(() => {});
    setFoundSession(null);
    return true;
  };

  // 현재 폼 입력값을 기존 스냅샷에 머지해 직렬화 (tendencyAnswers 등 유지)
  const buildSnapshot = () =>
    JSON.stringify({
      ...snapshotBase,
      grade,
      dreamJob,
      interestMajor,
      interestFields,
      selectedSubjects,
      burdenSubjects,
      studyHours,
      careerDecision,
      learningStyle,
      exploreSpectrum,
      scores,
      aspiration,
      preferredActivities,
      experiences,
    });

  // 세션 생성 또는 수정. 생성/수정된 세션 id 반환
  const persistSession = async (status: 'in_progress' | 'completed') => {
    const inputSnapshot = buildSnapshot();
    const sid = sessionIdRef.current;
    if (sid) {
      const updated = await updateSession(sid, { status, currentStep: 1, inputSnapshot });
      return updated.id;
    }
    const created = await createSession({
      userId: user?.id,
      status,
      currentStep: 1,
      startedAt: new Date().toISOString(),
      inputSnapshot,
    });
    sessionIdRef.current = created.id;
    setSessionId(created.id);
    return created.id;
  };

  // 폼 변경 시 2초 debounce 자동저장 (이어하기 배너가 없을 때만)
  useEffect(() => {
    if (pageState !== 'form' || foundSession) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        await persistSession('in_progress');
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState, foundSession, grade, dreamJob, interestMajor, interestFields, selectedSubjects, burdenSubjects, studyHours, careerDecision, learningStyle, exploreSpectrum, scores, aspiration, preferredActivities, experiences]);

  const handleTempSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (!(await confirmNewDiagnosis())) return;
    setError(null);
    try {
      setAutoSaveStatus('saving');
      await persistSession('in_progress');
      setAutoSaveStatus('saved');
    } catch {
      setAutoSaveStatus('idle');
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  // 다음 단계로: 필수 항목 확인 → 세션 저장 + 포부(서술형) 등록 후 성향 진단으로 이동
  const handleNext = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setError(null);
    if (selectedSubjects.length === 0 || burdenSubjects.length === 0 || !careerDecision) {
      setError('필수 항목(좋아하는 과목, 부담을 느끼는 과목, 진로 결정 수준)을 선택해 주세요.');
      return;
    }
    if (!(await confirmNewDiagnosis())) return;
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

  const savedAt = foundSession
    ? new Date(foundSession.updatedAt).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : '';

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[896px] mx-auto px-4 sm:px-6 py-12 flex flex-col gap-10">
        {foundSession && (
          <div className="flex items-center justify-between gap-4 p-4 bg-primary-container rounded-brand shadow-[0_10px_15px_-3px_rgba(13,28,50,0.1),0_4px_6px_-4px_rgba(13,28,50,0.1)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-[34px] h-[34px] rounded-lg bg-secondary/40 text-secondary-container">
                <span className="material-symbols-outlined text-[20px]">history</span>
              </span>
              <div>
                <p className="text-sm font-medium text-white">이전에 중단된 진단이 있습니다.</p>
                <p className="text-xs text-on-primary-container">최근 저장: {savedAt}</p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="shrink-0 px-5 py-2 rounded-lg bg-secondary-container text-on-secondary-fixed text-sm font-medium hover:opacity-90 transition-opacity"
            >
              이어하기
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-[30px] sm:leading-9 font-medium tracking-[-0.75px] text-primary-container">
                전공 적성 정밀 진단
              </h1>
              <p className="text-sm font-medium text-on-surface-variant">
                AI가 당신의 답변을 분석하여 최적의 진로를 설계합니다.
              </p>
            </div>
            <p className="shrink-0 flex items-end gap-1">
              <span className="font-headline text-2xl font-black text-secondary">01</span>
              <span className="text-base font-bold text-on-surface-variant">/ 03</span>
            </p>
          </div>
          <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-secondary-container" />
          </div>
        </div>

        <div className="flex flex-col gap-8 pt-2">
          <section className={`${sectionClass} flex flex-col gap-6`}>
            <SectionTitle icon="school">기본 정보 및 관심 분야</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <FieldLabel required>현재 학년</FieldLabel>
                <div className="grid grid-cols-3 gap-3">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrade(g)}
                      className={`p-[14px] rounded-xl border-2 text-base font-medium text-on-surface transition-all ${
                        grade === g
                          ? 'border-secondary bg-secondary-container/10'
                          : 'border-surface-container-high hover:bg-surface-container-low'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <FieldLabel>희망 직업 (꿈)</FieldLabel>
                <div className="relative">
                  <input
                    type="text"
                    value={dreamJob}
                    onChange={(e) => setDreamJob(e.target.value)}
                    placeholder="예: AI 데이터 사이언티스트"
                    className="w-full pl-4 pr-11 pt-[14px] pb-[15px] bg-surface-container-high border-b-2 border-outline-variant rounded-t-lg text-base font-medium placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-[22px]">
                    person_pin_circle
                  </span>
                </div>
                <FieldLabel>관심 전공 (선택)</FieldLabel>
                <div className="relative">
                  <input
                    type="text"
                    value={interestMajor}
                    onChange={(e) => setInterestMajor(e.target.value)}
                    placeholder="예: 컴퓨터공학과, 경영학과"
                    className="w-full pl-4 pr-11 pt-[14px] pb-[15px] bg-surface-container-high border-b-2 border-outline-variant rounded-t-lg text-base font-medium placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant text-[22px]">
                    school
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <FieldLabel>관심 계열 (선택)</FieldLabel>
              <div className="flex flex-wrap gap-3">
                {FIELDS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setInterestFields((prev) => toggleItem(prev, f))}
                    className={chipClass(interestFields.includes(f))}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8 pt-4">
              <div className="flex flex-col gap-4">
                <FieldLabel required>가장 좋아하는 과목 (필수)</FieldLabel>
                <div className="flex flex-wrap gap-3">
                  {SUBJECTS.map(({ label, icon }) => {
                    const active = selectedSubjects.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => setSelectedSubjects((prev) => toggleItem(prev, label))}
                        className={`flex items-center gap-2 px-[22px] py-3 rounded-full border-2 text-sm font-medium transition-all ${
                          active
                            ? 'border-secondary bg-secondary-container/10 text-secondary'
                            : 'border-surface-container-high text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{icon}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <FieldLabel required>부담을 느끼는 과목 (필수)</FieldLabel>
                <div className="flex flex-wrap gap-3">
                  {SUBJECTS.map(({ label }) => {
                    const active = burdenSubjects.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => setBurdenSubjects((prev) => toggleItem(prev, label))}
                        className={`px-[22px] py-3 rounded-full border-2 text-sm font-medium transition-all ${
                          active
                            ? 'border-secondary bg-secondary-container/10 text-secondary'
                            : 'border-surface-container-high text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className={`${sectionClass} flex flex-col gap-8`}>
            <SectionTitle icon="monitoring">학습 패턴 및 성향 분석</SectionTitle>

            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <FieldLabel>일일 평균 자기주도 학습 시간</FieldLabel>
                  <span className="px-3 py-1 bg-secondary-container text-secondary text-xs font-bold rounded-full">
                    {studyHours}시간
                  </span>
                </div>
                <div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={studyHours}
                    onChange={(e) => setStudyHours(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg bg-surface-container-high ${thumbClass}`}
                  />
                  <div className="flex justify-between pt-2 text-[10px] font-bold tracking-[1px] text-on-surface-variant">
                    <span>0시간</span>
                    <span>5시간</span>
                    <span>10시간+</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 pt-1">
                <FieldLabel required>진로 결정 수준 (필수)</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CAREER_DECISIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setCareerDecision(d)}
                      className={`px-0.5 py-[14px] rounded-xl border-2 text-xs font-medium transition-all ${
                        careerDecision === d
                          ? 'border-secondary bg-secondary-container/10 text-secondary'
                          : 'border-surface-container-high text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5 pt-1">
                <FieldLabel required>선호하는 학습 방식</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'theory', icon: 'menu_book', title: '이론 및 원리 중심', desc: '개념의 기초를 다지고 논리적인 인과관계를 파악하는 공부를 즐깁니다.' },
                    { id: 'practice', icon: 'build', title: '실습 및 응용 중심', desc: '배운 내용을 직접 실험하거나 프로젝트를 통해 결과물을 만드는 것을 선호합니다.' },
                  ].map(({ id, icon, title, desc }) => {
                    const active = learningStyle === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setLearningStyle(id as typeof learningStyle)}
                        className={`flex flex-col gap-3 text-left p-[26px] rounded-xl border-2 transition-all ${
                          active
                            ? 'border-secondary bg-secondary-container/5'
                            : 'border-surface-container-high hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="flex items-center gap-4">
                          <span className="flex items-center justify-center w-[38px] h-[38px] rounded-lg bg-surface-container text-primary-container">
                            <span className="material-symbols-outlined text-[20px]">{icon}</span>
                          </span>
                          <span className="text-base font-medium text-primary-container">{title}</span>
                        </span>
                        <span className="text-xs leading-[19.5px] font-medium text-on-surface-variant">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-7 pt-1">
                <FieldLabel>탐구 성향 스펙트럼</FieldLabel>
                <div>
                  <div className="flex justify-between mb-2 text-[10px] font-medium text-secondary">
                    <span>익숙함 선호</span>
                    <span>새로운 도전 선호</span>
                  </div>
                  <div className="relative h-4">
                    <div className="absolute inset-0 rounded-full opacity-30 bg-gradient-to-r from-surface-container-high via-secondary-container to-secondary" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={exploreSpectrum}
                      onChange={(e) => setExploreSpectrum(Number(e.target.value))}
                      className={`relative w-full h-4 bg-transparent ${thumbClass}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={`${sectionClass} flex flex-col gap-8`}>
            <SectionTitle icon="workspace_premium">역량 자가 진단 및 포부</SectionTitle>

            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-7 pt-1">
                <FieldLabel>핵심 역량 점수 (5점 만점)</FieldLabel>
                <div className="flex flex-col gap-8">
                  {COMPETENCIES.map((name) => (
                    <div key={name} className="flex items-center gap-6">
                      <span className="w-24 text-xs font-medium text-on-surface-variant">{name}</span>
                      <div className="flex items-center gap-2">
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
                                className={`material-symbols-outlined text-[22px] transition-colors ${
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

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <FieldLabel>향후 10년 뒤 나의 모습과 커리어 목표</FieldLabel>
                  <span className="text-[10px] font-bold text-on-surface-variant">{aspiration.length} / 500자</span>
                </div>
                <textarea
                  value={aspiration}
                  onChange={(e) => setAspiration(e.target.value.slice(0, 500))}
                  rows={5}
                  className="w-full px-6 py-[23px] bg-surface-container-high rounded-xl text-sm leading-[22.75px] font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5 pt-1">
                  <FieldLabel>학교생활에서 선호하는 활동 (선택)</FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    {ACTIVITIES.map((a) => (
                      <button
                        key={a}
                        onClick={() => setPreferredActivities((prev) => toggleItem(prev, a))}
                        className={chipClass(preferredActivities.includes(a), 'box')}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-5 pt-1">
                  <FieldLabel>관련 활동 경험 (선택)</FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    {EXPERIENCES.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setExperiences((prev) => toggleItem(prev, ex))}
                        className={chipClass(experiences.includes(ex), 'box')}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-center text-xs font-medium text-on-surface-variant">✨ 더 알려주면 결과가 더 정확해져요</p>
              </div>
            </div>
          </section>

          {error && <p className="text-sm text-error text-right">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-base font-medium text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              이전 단계
            </button>
            <div className="flex items-center gap-4">
              {autoSaveStatus !== 'idle' && (
                <span className="text-xs text-on-surface-variant">
                  {autoSaveStatus === 'saving' ? '저장 중...' : '자동 저장됨'}
                </span>
              )}
              <button
                onClick={() => void handleTempSave()}
                disabled={autoSaveStatus === 'saving'}
                className="px-8 py-4 rounded-xl bg-surface-container text-base font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-60"
              >
                임시 저장
              </button>
              <button
                onClick={() => void handleNext()}
                disabled={submitting}
                className="flex items-center gap-2 px-8 sm:px-12 py-4 rounded-xl bg-secondary text-base font-medium text-white shadow-[0_10px_15px_-3px_rgba(0,103,127,0.2),0_4px_6px_-4px_rgba(0,103,127,0.2)] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? '처리 중...' : '다음 단계로'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisMajor;
