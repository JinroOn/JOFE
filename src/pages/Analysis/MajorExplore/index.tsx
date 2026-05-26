import { useState } from 'react';
import type { Major } from './types';
import FilterContent from './components/FilterContent';
import MajorCard from './components/MajorCard';
import DetailPanel from './components/DetailPanel';

const MAJORS: Major[] = [
  {
    id: 1,
    name: '컴퓨터공학과',
    enName: 'Computer Science',
    category: '공학계열',
    categoryColor: 'text-secondary',
    iconBg: 'bg-secondary-container/10',
    iconColor: 'text-secondary',
    description: '디지털 시대의 핵심 인프라인 소프트웨어와 하드웨어를 설계하고 구현하는 능력을 배양합니다.',
    fullDescription: '컴퓨터공학은 현대 정보화 사회의 핵심인 하드웨어와 소프트웨어의 설계, 개발 및 운영을 연구하는 학문입니다. AI, 빅데이터, 클라우드 등 4차 산업혁명의 핵심 기술을 선도하며, 실질적인 문제 해결 능력을 갖춘 창의적인 엔지니어를 양성합니다.',
    matchRate: 98,
    prospect: 'HIGH',
    icon: 'code',
    scores: [0.92, 0.88, 0.78, 0.85, 0.75, 0.68, 0.65, 0.72, 0.80],
    careers: [
      { icon: 'terminal', label: 'SW Engineer' },
      { icon: 'analytics', label: 'Data Scientist' },
      { icon: 'security', label: 'Security Expert' },
      { icon: 'smart_toy', label: 'AI Researcher' },
    ],
  },
  {
    id: 2,
    name: '생명공학과',
    enName: 'Biotechnology',
    category: '자연과학계열',
    categoryColor: 'text-[#FFAB00]',
    iconBg: 'bg-[#FFAB00]/10',
    iconColor: 'text-[#FFAB00]',
    description: '생명체의 현상을 이해하고 이를 산업적으로 응용하여 인류의 삶의 질을 향상시키는 학문입니다.',
    fullDescription: '생명공학은 생물학과 공학의 접목으로 의약품, 식품, 환경 분야에서 혁신을 이끄는 학문입니다. 첨단 분자생물학 기법을 활용하여 질병 치료와 인류 복지 향상에 기여합니다.',
    matchRate: 82,
    prospect: 'MEDIUM',
    icon: 'biotech',
    scores: [0.70, 0.75, 0.85, 0.60, 0.80, 0.72, 0.78, 0.88, 0.65],
    careers: [
      { icon: 'biotech', label: '바이오 연구원' },
      { icon: 'local_hospital', label: '의약품 개발' },
      { icon: 'science', label: '생명과학자' },
      { icon: 'eco', label: '농생명공학' },
    ],
  },
  {
    id: 3,
    name: '경제학부',
    enName: 'Economics',
    category: '인문사회계열',
    categoryColor: 'text-secondary',
    iconBg: 'bg-secondary-container/10',
    iconColor: 'text-secondary',
    description: '희소한 자원을 효율적으로 배분하는 원리를 연구하며 사회 시스템의 메커니즘을 분석합니다.',
    fullDescription: '경제학은 희소한 자원의 효율적 배분 원리를 탐구하며, 거시·미시 경제 분석을 통해 사회 현상을 이해합니다. 수학적 모델링과 통계 분석 능력을 바탕으로 합리적 의사결정을 연구합니다.',
    matchRate: 94,
    prospect: 'HIGH',
    icon: 'account_balance',
    scores: [0.82, 0.80, 0.65, 0.55, 0.70, 0.75, 0.70, 0.78, 0.85],
    careers: [
      { icon: 'bar_chart', label: '경제 분석가' },
      { icon: 'account_balance', label: '금융 전문가' },
      { icon: 'description', label: '정책 연구원' },
      { icon: 'work', label: '경영 컨설턴트' },
    ],
  },
  {
    id: 4,
    name: '인공지능학과',
    enName: 'Artificial Intelligence',
    category: '공학계열',
    categoryColor: 'text-secondary',
    iconBg: 'bg-secondary-container/10',
    iconColor: 'text-secondary',
    description: '머신러닝, 딥러닝 기반의 AI 시스템을 설계하고 개발하는 전문 인력을 양성합니다.',
    fullDescription: '인공지능학과는 기계학습, 자연어처리, 컴퓨터비전 등 AI 핵심 기술을 연구합니다. 수학적 이론과 실습 프로젝트를 통해 현업에서 바로 활용 가능한 AI 전문가를 양성합니다.',
    matchRate: 91,
    prospect: 'HIGH',
    icon: 'psychology',
    scores: [0.95, 0.90, 0.82, 0.88, 0.78, 0.65, 0.70, 0.75, 0.72],
    careers: [
      { icon: 'smart_toy', label: 'AI 연구원' },
      { icon: 'memory', label: 'ML 엔지니어' },
      { icon: 'analytics', label: 'AI 분석가' },
      { icon: 'terminal', label: 'AI 개발자' },
    ],
  },
  {
    id: 5,
    name: '심리학과',
    enName: 'Psychology',
    category: '인문사회계열',
    categoryColor: 'text-secondary',
    iconBg: 'bg-secondary-container/10',
    iconColor: 'text-secondary',
    description: '인간의 마음과 행동을 과학적으로 탐구하며 다양한 심리 현상을 이해하는 학문입니다.',
    fullDescription: '심리학은 인간의 인지, 감정, 행동을 연구하여 개인과 사회의 심리적 현상을 이해하는 학문입니다. 임상, 상담, 산업 등 다양한 분야에서 폭넓게 적용됩니다.',
    matchRate: 76,
    prospect: 'MEDIUM',
    icon: 'favorite',
    scores: [0.68, 0.75, 0.72, 0.45, 0.60, 0.88, 0.80, 0.85, 0.78],
    careers: [
      { icon: 'support_agent', label: '심리 상담사' },
      { icon: 'draw', label: 'UX 연구원' },
      { icon: 'local_hospital', label: '임상심리사' },
      { icon: 'school', label: '교육 전문가' },
    ],
  },
  {
    id: 6,
    name: '기계공학과',
    enName: 'Mechanical Engineering',
    category: '공학계열',
    categoryColor: 'text-secondary',
    iconBg: 'bg-secondary-container/10',
    iconColor: 'text-secondary',
    description: '물리적 원리를 응용하여 기계 시스템과 제품을 설계·제작·분석하는 공학 분야입니다.',
    fullDescription: '기계공학은 역학, 열역학, 재료공학 등을 기반으로 자동차, 항공, 로봇 등 다양한 산업 기계 시스템을 연구합니다. 정밀한 설계 능력과 문제 해결력을 갖춘 엔지니어를 양성합니다.',
    matchRate: 79,
    prospect: 'HIGH',
    icon: 'settings',
    scores: [0.85, 0.82, 0.75, 0.88, 0.82, 0.65, 0.60, 0.78, 0.70],
    careers: [
      { icon: 'precision_manufacturing', label: '기계 설계자' },
      { icon: 'directions_car', label: '자동차 엔지니어' },
      { icon: 'flight', label: '항공 엔지니어' },
      { icon: 'smart_toy', label: '로봇 연구원' },
    ],
  },
];

const MajorExplore = () => {
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [compareList, setCompareList] = useState<Major[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const handleAddToCompare = (major: Major) => {
    if (compareList.find(m => m.id === major.id) || compareList.length >= 3) return;
    setCompareList(prev => [...prev, major]);
  };

  const handleRemoveFromCompare = (id: number) => {
    setCompareList(prev => prev.filter(m => m.id !== id));
  };

  const filteredMajors = MAJORS.filter(m =>
    m.name.includes(searchQuery) || m.category.includes(searchQuery)
  );

  return (
    <div className={`min-h-screen bg-surface ${compareList.length > 0 ? 'pb-36' : 'pb-16'}`}>
      <main className="max-w-[1280px] mx-auto pt-6 sm:pt-8 px-4 sm:px-8 flex flex-col md:flex-row gap-8">

        <aside className="hidden md:block w-72 flex-shrink-0">
          <FilterContent searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </aside>

        <section className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3">
            <div>
              <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-primary-container">
                Major Discovery
              </h2>
              <p className="text-on-surface-variant mt-1 text-sm">
                AI가 당신의 적성에 맞춘 {filteredMajors.length}개의 전공을 찾았습니다.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  filterOpen
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white text-on-surface border-outline-variant/20 shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                필터
              </button>
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-semibold text-on-surface border border-outline-variant/20">
                <span className="material-symbols-outlined text-sm">sort</span>
                <span className="hidden sm:inline">추천순</span>
              </button>
            </div>
          </div>

          {filterOpen && (
            <div className="md:hidden mb-6 p-5 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <FilterContent searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMajors.map((major) => (
              <MajorCard
                key={major.id}
                major={major}
                onClick={() => setSelectedMajor(major)}
              />
            ))}
          </div>
        </section>
      </main>

      {selectedMajor && (
        <DetailPanel
          major={selectedMajor}
          onClose={() => setSelectedMajor(null)}
          onAddToCompare={handleAddToCompare}
          inCompare={!!compareList.find(m => m.id === selectedMajor.id)}
        />
      )}

      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-40 px-4 sm:px-8 pb-4 sm:pb-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="bg-primary-container/90 backdrop-blur-2xl rounded-2xl flex items-center px-4 sm:px-8 py-4 sm:h-24 shadow-2xl border border-white/5 gap-4">
              <div className="flex-grow flex items-center gap-4 sm:gap-6 min-w-0">
                <div className="text-white shrink-0">
                  <div className="text-[10px] sm:text-xs font-bold opacity-60 uppercase tracking-tighter">비교 바구니</div>
                  <div className="text-base sm:text-lg font-bold">
                    <span className="text-secondary-container">{compareList.length}</span>
                    <span className="opacity-60">/3</span>
                  </div>
                </div>
                <div className="hidden sm:flex gap-3">
                  {Array.from({ length: 3 }, (_, i) => {
                    const m = compareList[i];
                    if (m) {
                      return (
                        <div
                          key={i}
                          className="w-32 h-14 bg-white/10 rounded-xl border border-white/20 flex items-center px-3 gap-2 relative group overflow-hidden"
                        >
                          <span className="text-[11px] text-white font-bold truncate">{m.name}</span>
                          <button
                            onClick={() => handleRemoveFromCompare(m.id)}
                            className="absolute -right-8 group-hover:right-2 transition-all p-1 bg-error rounded-full flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[12px] text-white">close</span>
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="w-32 h-14 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-white/30">add</span>
                      </div>
                    );
                  })}
                </div>
                <div className="sm:hidden flex gap-2 overflow-x-auto">
                  {compareList.map(m => (
                    <div
                      key={m.id}
                      className="shrink-0 flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20"
                    >
                      <span className="text-[11px] text-white font-bold max-w-[80px] truncate">{m.name}</span>
                      <button onClick={() => handleRemoveFromCompare(m.id)}>
                        <span className="material-symbols-outlined text-[14px] text-white/60">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button className="shrink-0 bg-[#FFAB00] text-primary-container font-bold px-4 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base">
                상세 비교
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MajorExplore;
