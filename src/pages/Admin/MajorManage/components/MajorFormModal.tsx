import { useState } from 'react';
import type { Major, MajorRequest, MajorDifficulty } from '../../../../types/major';
import { createMajor, updateMajor } from '../../../../api/major';

const TABS = ['기본 정보', '역량 요구치', '성향 벡터'] as const;
type Tab = (typeof TABS)[number];

const REQ_FIELDS: { key: keyof MajorRequest; label: string }[] = [
  { key: 'reqMathLogic', label: '수리·논리' },
  { key: 'reqProblemSolving', label: '문제해결' },
  { key: 'reqInfoTech', label: '정보통신' },
  { key: 'reqImplementation', label: '구현력' },
  { key: 'reqSystemUnderstanding', label: '시스템이해' },
  { key: 'reqDataAnalysis', label: '데이터분석' },
  { key: 'reqCommunication', label: '의사소통' },
  { key: 'reqCollaboration', label: '협업' },
  { key: 'reqSelfManagement', label: '자기관리' },
];

const TEND_FIELDS: { key: keyof MajorRequest; label: string }[] = [
  { key: 'tendLogicalInquiry', label: '논리탐구' },
  { key: 'tendPracticalTech', label: '실용기술' },
  { key: 'tendArtCreative', label: '예술창의' },
  { key: 'tendSocialCooperation', label: '사회협력' },
  { key: 'tendLifeHealth', label: '생활건강' },
  { key: 'tendEducationGuide', label: '교육지도' },
  { key: 'tendTheoryAcademic', label: '이론학술' },
  { key: 'tendDataAnalytics', label: '데이터분석' },
  { key: 'tendSystemOperation', label: '시스템운영' },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-secondary transition-colors';
const labelClass = 'block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wide';

interface Props {
  major?: Major;
  onClose: () => void;
  onSave: (saved: Major) => void;
}

export default function MajorFormModal({ major, onClose, onSave }: Props) {
  const isEdit = !!major;

  const [tab, setTab] = useState<Tab>('기본 정보');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MajorRequest>({
    name: major?.name ?? '',
    category: major?.category ?? '',
    difficulty: major?.difficulty ?? 'mid',
    description: major?.description ?? '',
    careerPaths: major?.careerPaths ?? '',
    reqMathLogic: major?.reqMathLogic ?? 0,
    reqProblemSolving: major?.reqProblemSolving ?? 0,
    reqInfoTech: major?.reqInfoTech ?? 0,
    reqImplementation: major?.reqImplementation ?? 0,
    reqSystemUnderstanding: major?.reqSystemUnderstanding ?? 0,
    reqDataAnalysis: major?.reqDataAnalysis ?? 0,
    reqCommunication: major?.reqCommunication ?? 0,
    reqCollaboration: major?.reqCollaboration ?? 0,
    reqSelfManagement: major?.reqSelfManagement ?? 0,
    tendLogicalInquiry: major?.tendLogicalInquiry ?? 0,
    tendPracticalTech: major?.tendPracticalTech ?? 0,
    tendArtCreative: major?.tendArtCreative ?? 0,
    tendSocialCooperation: major?.tendSocialCooperation ?? 0,
    tendLifeHealth: major?.tendLifeHealth ?? 0,
    tendEducationGuide: major?.tendEducationGuide ?? 0,
    tendTheoryAcademic: major?.tendTheoryAcademic ?? 0,
    tendDataAnalytics: major?.tendDataAnalytics ?? 0,
    tendSystemOperation: major?.tendSystemOperation ?? 0,
    thrMathLogic: major?.thrMathLogic ?? 0,
    thrInfoTech: major?.thrInfoTech ?? 0,
  });

  const set = (key: keyof MajorRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name?.trim()) { setError('전공명을 입력해주세요.'); setTab('기본 정보'); return; }
    if (!form.category?.trim()) { setError('카테고리를 입력해주세요.'); setTab('기본 정보'); return; }
    setSaving(true);
    setError(null);
    try {
      const saved = isEdit
        ? await updateMajor(major.id, form)
        : await createMajor(form);
      onSave(saved);
    } catch {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 shrink-0">
          <h2 className="text-lg font-bold text-primary-container">
            {isEdit ? '전공 수정' : '전공 추가'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-outline-variant/20 shrink-0 px-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                tab === t
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 폼 본문 */}
        <div className="overflow-y-auto flex-1 px-6 py-6">

          {tab === '기본 정보' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>전공명 *</label>
                <input className={inputClass} value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="예: 컴퓨터공학부" />
              </div>
              <div>
                <label className={labelClass}>카테고리 *</label>
                <input className={inputClass} value={form.category ?? ''} onChange={(e) => set('category', e.target.value)} placeholder="예: 공학계열" />
              </div>
              <div>
                <label className={labelClass}>난이도</label>
                <select className={inputClass} value={form.difficulty ?? 'mid'} onChange={(e) => set('difficulty', e.target.value as MajorDifficulty)}>
                  <option value="low">Low</option>
                  <option value="mid">Mid</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>전공 설명</label>
                <textarea className={`${inputClass} resize-none`} rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="전공에 대한 간략한 설명" />
              </div>
              <div>
                <label className={labelClass}>진출 분야</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.careerPaths ?? ''} onChange={(e) => set('careerPaths', e.target.value)} placeholder="예: 소프트웨어 개발자, 데이터 사이언티스트" />
              </div>
            </div>
          )}

          {tab === '역량 요구치' && (
            <div className="space-y-5">
              <p className="text-xs text-on-surface-variant">해당 전공에 필요한 역량 수준 (0 ~ 100)</p>
              {REQ_FIELDS.map(({ key, label }) => (
                <ScoreField key={key} label={label} value={(form[key] as number) ?? 0} onChange={(v) => set(key, v)} />
              ))}
              <div className="pt-4 border-t border-outline-variant/20">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-4">과락 기준</p>
                <ScoreField label="수리·논리 과락 기준" value={form.thrMathLogic ?? 0} onChange={(v) => set('thrMathLogic', v)} />
                <div className="mt-4">
                  <ScoreField label="정보통신 과락 기준" value={form.thrInfoTech ?? 0} onChange={(v) => set('thrInfoTech', v)} />
                </div>
              </div>
            </div>
          )}

          {tab === '성향 벡터' && (
            <div className="space-y-5">
              <p className="text-xs text-on-surface-variant">해당 전공에 적합한 성향 수준 (0 ~ 100)</p>
              {TEND_FIELDS.map(({ key, label }) => (
                <ScoreField key={key} label={label} value={(form[key] as number) ?? 0} onChange={(v) => set(key, v)} />
              ))}
            </div>
          )}
        </div>

        {/* 하단 */}
        <div className="px-6 py-4 border-t border-outline-variant/20 shrink-0">
          {error && <p className="text-sm text-error font-medium mb-3">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-bold hover:bg-surface-container transition-colors">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary-container text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? '저장 중...' : isEdit ? '수정 완료' : '전공 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm font-semibold text-on-surface">{label}</label>
        <span className="text-sm font-bold text-secondary w-10 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-secondary"
      />
    </div>
  );
}
