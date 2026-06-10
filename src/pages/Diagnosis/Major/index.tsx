import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';
import {
  getInProgressSession,
  createSession,
  updateSession,
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
  const user = useAuthStore((s) => s.user);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [resumeSession, setResumeSession] = useState<DiagnosisSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 진행 중인 진단 세션이 있으면 이어하기 배너 노출
  useEffect(() => {
    getInProgressSession().then((data) => {
      if (data?.session) setResumeSession(data.session);
    });
  }, []);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  // 현재 폼 입력값을 스냅샷 JSON 으로 직렬화
  const buildSnapshot = () =>
    JSON.stringify({
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

  // 이전에 저장된 스냅샷을 폼에 복원
  const handleResume = () => {
    if (!resumeSession) return;
    try {
      const snap = JSON.parse(resumeSession.inputSnapshot || '{}');
      if (snap.grade) setGrade(snap.grade);
      if (snap.dreamJob != null) setDreamJob(snap.dreamJob);
      if (Array.isArray(snap.selectedSubjects)) setSelectedSubjects(snap.selectedSubjects);
      if (snap.studyHours != null) setStudyHours(snap.studyHours);
      if (snap.learningStyle) setLearningStyle(snap.learningStyle);
      if (snap.exploreSpectrum != null) setExploreSpectrum(snap.exploreSpectrum);
      if (snap.scores) setScores(snap.scores);
      if (snap.aspiration != null) setAspiration(snap.aspiration);
    } catch {
      /* 스냅샷 파싱 실패 시 무시 */
    }
    setSessionId(resumeSession.id);
    setResumeSession(null);
  };

  // 임시 저장
  const handleTempSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await persistSession('in_progress');
    } catch {
      setError('임시 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 다음 단계로: 세션 저장 + 포부(서술형) 등록 후 퀴즈 단계로 이동
  const handleNext = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const id = await persistSession('in_progress');
      if (aspiration.trim()) {
        await createEssayAnswer({ diagnosisSessionId: id, questionNo: 1, answerText: aspiration });
      }
      navigate('/diagnosis/quiz');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  };

  const savedAtLabel = resumeSession
    ? new Date(resumeSession.updatedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 pt-6 pb-16">
        {resumeSession && (
          <div className="flex items-center justify-between gap-4 bg-primary-container text-white rounded-2xl px-5 py-3.5 mb-8 shadow-[0_8px_20px_rgba(13,28,50,0.12)]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-secondary-container shrink-0">history</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">이전에 중단된 진단이 있습니다.</p>
                <p className="text-xs text-white/60 mt-0.5">최근 저장: {savedAtLabel}</p>
              </div>
            </div>
            <button
              onClick={handleResume}
              className="shrink-0 px-4 py-1.5 bg-secondary-container text-on-secondary-fixed text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              이어하기
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-primary-container">
                전공 적성 정밀 진단
              </h1>
              <p className="text-on-surface-variant text-sm mt-2">
                AI가 당신의 답변을 분석하여 최적의 진로를 설계합니다.
              </p>
            </div>
            <p className="text-2xl font-extrabold text-primary-container shrink-0">
              01<span className="text-base font-bold text-on-surface-variant">/ 03</span>
            </p>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-secondary rounded-full" />
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            이전 단계
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTempSave}
              disabled={saving || submitting}
              className="px-5 py-2.5 text-sm font-bold text-on-surface-variant border border-outline-variant/40 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-colors disabled:opacity-60"
            >
              {saving ? '저장 중...' : '임시 저장'}
            </button>
            <button
              onClick={handleNext}
              disabled={submitting || saving}
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
