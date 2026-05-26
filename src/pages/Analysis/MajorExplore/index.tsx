import { useState } from 'react';

const RADAR_AXES = [
  '수리·논리', '문제해결', '정보기술', '구현력',
  '시스템이해', '데이터분석', '의사소통', '협업·윤리', '자기관리',
];

interface Career {
  icon: string;
  label: string;
}

interface Major {
  id: number;
  name: string;
  enName: string;
  category: string;
  categoryColor: string;
  iconBg: string;
  iconColor: string;
  description: string;
  fullDescription: string;
  matchRate: number;
  prospect: 'HIGH' | 'MEDIUM' | 'LOW';
  icon: string;
  scores: number[];
  careers: Career[];
}

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

const RadarChart = ({ scores }: { scores: number[] }) => {
  const n = 9;
  const cx = 120, cy = 120, r = 80;

  const getAngle = (i: number) => (-90 + i * (360 / n)) * (Math.PI / 180);

  const getPoint = (radius: number, i: number) => ({
    x: cx + radius * Math.cos(getAngle(i)),
    y: cy + radius * Math.sin(getAngle(i)),
  });

  const polyPoints = (radius: number) =>
    Array.from({ length: n }, (_, i) => getPoint(radius, i))
      .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

  const dataPoints = scores
    .map((s, i) => getPoint(r * s, i))
    .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const LABEL_R = 104;
  const labelCfg: { anchor: 'start' | 'middle' | 'end'; dy: number }[] = [
    { anchor: 'middle', dy: -6 },
    { anchor: 'start',  dy: -4 },
    { anchor: 'start',  dy:  4 },
    { anchor: 'start',  dy:  5 },
    { anchor: 'middle', dy: 13 },
    { anchor: 'end',    dy: 13 },
    { anchor: 'end',    dy:  5 },
    { anchor: 'end',    dy:  4 },
    { anchor: 'end',    dy: -4 },
  ];

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={polyPoints(r * s)}
          fill="none"
          stroke="#c5c6cd"
          strokeWidth={s === 1 ? 0.8 : 0.5}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const end = getPoint(r, i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="#c5c6cd"
            strokeWidth={0.5}
          />
        );
      })}
      <polygon
        points={dataPoints}
        fill="rgba(0,210,255,0.15)"
        stroke="#00D2FF"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {scores.map((s, i) => {
        const p = getPoint(r * s, i);
        return (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={2.5}
            fill="#00677f"
            stroke="white"
            strokeWidth={0.8}
          />
        );
      })}
      {RADAR_AXES.map((label, i) => {
        const p = getPoint(LABEL_R, i);
        const cfg = labelCfg[i];
        return (
          <text
            key={i}
            x={p.x}
            y={p.y + cfg.dy}
            textAnchor={cfg.anchor}
            fontSize={7.5}
            fontWeight="600"
            fill="#44474d"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

const DetailPanel = ({
  major,
  onClose,
  onAddToCompare,
  inCompare,
}: {
  major: Major;
  onClose: () => void;
  onAddToCompare: (m: Major) => void;
  inCompare: boolean;
}) => {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-primary-container/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-10 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">close</span>
        </button>

        <div className="relative w-full h-[180px] sm:h-[200px] shrink-0 bg-gradient-to-br from-primary-container to-secondary flex items-end px-6 sm:px-8 pb-6">
          <div>
            <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-md text-xs font-bold mb-2">
              {major.category}
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              {major.name}
              <span className="block text-lg font-normal opacity-70 mt-1">({major.enName})</span>
            </h2>
          </div>
        </div>

        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 space-y-6 sm:space-y-8 flex-1">
          <section>
            <h3 className="text-base font-bold text-primary-container mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-secondary-container rounded-full inline-block" />
              학과 소개
            </h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">{major.fullDescription}</p>
          </section>

          <section className="bg-surface-container-low rounded-2xl p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-5">
              Core Competency Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="aspect-square max-w-[280px] mx-auto sm:max-w-none sm:mx-0">
                <RadarChart scores={major.scores} />
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-container/20">
                  <div className="text-xs text-on-surface-variant mb-1">AI 적합도</div>
                  <div className="text-3xl font-extrabold text-secondary-container">{major.matchRate}%</div>
                  <div className="w-full bg-surface-container-high h-1.5 mt-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary-container rounded-full transition-all duration-700"
                      style={{ width: `${major.matchRate}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#FFAB00]/20">
                  <div className="text-xs text-on-surface-variant mb-1">미래 전망</div>
                  <div className="text-2xl font-extrabold text-[#FFAB00]">{major.prospect}</div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    {major.prospect === 'HIGH'
                      ? '지속적인 기술 혁신으로 인한 높은 인력 수요 예상'
                      : '꾸준한 수요가 유지되는 안정적인 분야'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-primary-container mb-4">졸업 후 진로 (Career Paths)</h3>
            <div className="grid grid-cols-2 gap-3">
              {major.careers.map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center p-4 bg-white border border-outline-variant/10 rounded-xl hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center mr-3 group-hover:bg-secondary-container/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">{icon}</span>
                  </div>
                  <span className="font-medium text-sm text-on-surface">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-outline-variant/20 flex gap-3 shrink-0">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`flex-1 py-3.5 px-5 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
              bookmarked
                ? 'border-[#FFAB00] text-[#FFAB00]'
                : 'border-primary-container text-primary-container hover:bg-primary-container/5'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            북마크
          </button>
          <button
            onClick={() => onAddToCompare(major)}
            disabled={inCompare}
            className={`flex-[1.5] py-3.5 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              inCompare
                ? 'bg-surface-container text-outline cursor-not-allowed'
                : 'bg-[#FFAB00] text-white shadow-lg shadow-[#FFAB00]/20 hover:opacity-90 active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {inCompare ? '담김' : '비교 바구니에 담기'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MajorCard = ({
  major,
  onClick,
}: {
  major: Major;
  onClick: () => void;
}) => {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[14px] p-6 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-2 transition-all duration-500 cursor-pointer border border-transparent hover:border-secondary-container/30 relative"
    >
      <button
        onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
        className={`absolute top-4 right-4 transition-colors ${bookmarked ? 'text-[#FFAB00]' : 'text-outline-variant hover:text-[#FFAB00]'}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
        >
          bookmark
        </span>
      </button>
      <div className={`w-12 h-12 ${major.iconBg} rounded-2xl flex items-center justify-center ${major.iconColor} mb-4`}>
        <span className="material-symbols-outlined">{major.icon}</span>
      </div>
      <div className="space-y-1 mb-3">
        <span className={`text-[10px] font-bold ${major.categoryColor} uppercase tracking-widest`}>
          {major.category}
        </span>
        <h3 className="font-bold text-lg text-primary-container">{major.name}</h3>
      </div>
      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{major.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-outline-variant/10 pt-4">
        <span className="text-[11px] text-outline font-medium">매칭률</span>
        <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${
          major.matchRate >= 90
            ? 'bg-secondary-container/20 text-on-secondary-container'
            : 'bg-surface-container-high text-on-surface-variant'
        }`}>
          {major.matchRate}%
        </span>
      </div>
    </div>
  );
};

const FilterContent = ({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="font-extrabold text-lg text-primary-container mb-3">전공 검색</h3>
      <div className="relative">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-surface-container-high border-none rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-secondary-container transition-all text-sm outline-none"
          placeholder="관심 있는 학과를 입력하세요"
        />
        <span className="material-symbols-outlined absolute right-4 top-3 text-outline">search</span>
      </div>
    </div>

    <div>
      <h4 className="font-bold text-xs text-on-surface-variant mb-3 uppercase tracking-widest">전공 계열</h4>
      <div className="space-y-2">
        {['공학계열', '자연과학계열', '인문사회계열', '의약계열'].map((cat) => (
          <label key={cat} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked={cat === '공학계열'}
              className="rounded text-secondary focus:ring-secondary border-outline-variant"
            />
            <span className="text-sm group-hover:text-secondary transition-colors">{cat}</span>
          </label>
        ))}
      </div>
    </div>

    <div>
      <h4 className="font-bold text-xs text-on-surface-variant mb-3 uppercase tracking-widest">학업 난이도</h4>
      <div className="flex flex-wrap gap-2">
        {['Easy', 'Medium', 'Hard'].map((level) => (
          <button
            key={level}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              level === 'Medium'
                ? 'bg-secondary-container/20 border-secondary text-secondary'
                : 'border-outline-variant hover:border-secondary text-on-surface-variant'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>

    <div>
      <h4 className="font-bold text-xs text-on-surface-variant mb-3 uppercase tracking-widest">진로 유형</h4>
      <select className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-secondary-container transition-all text-sm outline-none">
        <option>전체</option>
        <option>연구직</option>
        <option>전문직</option>
        <option>창업형</option>
        <option>기업실무형</option>
      </select>
    </div>
  </div>
);

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

        {/* 데스크탑 사이드바 */}
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

          {/* 모바일 필터 패널 */}
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
