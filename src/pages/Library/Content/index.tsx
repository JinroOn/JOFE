import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['전체 콘텐츠', 'IT/개발', '경영/마케팅', '디자인', '인문/사회'];
const DIFFICULTIES = ['입문', '기초', '심화'];
const SORTS = ['최신순', '인기순', '평점순'];

interface Content {
  id: number;
  title: string;
  category: string;
  categoryColor: string;
  badge: string;
  badgeClass: string;
  instructor: string;
  weeks: number;
  difficulty: string;
}

const contents: Content[] = [
  { id: 1, title: '데이터 사이언스 입문: 실무 프로젝트 중심', category: 'IT/개발', categoryColor: 'bg-secondary/90', badge: 'AI Prediction 98%', badgeClass: 'bg-secondary-container/20 text-secondary', instructor: '김현수 교수', weeks: 12, difficulty: '입문' },
  { id: 2, title: 'AI 윤리와 사회: 기술의 진보와 인간의 공존', category: '인문/사회', categoryColor: 'bg-primary/90', badge: '베스트셀러', badgeClass: 'bg-surface-container-high text-on-surface-variant', instructor: '이지원 박사', weeks: 8, difficulty: '기초' },
  { id: 3, title: '디지털 마케팅 마스터클래스: 데이터로 읽는 시장', category: '경영/마케팅', categoryColor: 'bg-secondary/90', badge: '신규 강의', badgeClass: 'bg-surface-container-high text-on-surface-variant', instructor: '박서준 대표', weeks: 10, difficulty: '기초' },
  { id: 4, title: 'UI/UX 디자인 시스템 구축 가이드', category: '디자인', categoryColor: 'bg-secondary/90', badge: '인기 강의', badgeClass: 'bg-secondary-container/20 text-secondary', instructor: '최유진 실장', weeks: 6, difficulty: '입문' },
  { id: 5, title: '차세대 정보보안 및 블록체인 응용', category: 'IT/개발', categoryColor: 'bg-secondary/90', badge: 'AI Prediction 92%', badgeClass: 'bg-secondary-container/20 text-secondary', instructor: '정민우 소장', weeks: 14, difficulty: '심화' },
  { id: 6, title: '글로벌 비즈니스 커뮤니케이션 실무', category: '경영/마케팅', categoryColor: 'bg-primary/90', badge: '추천 강의', badgeClass: 'bg-surface-container-high text-on-surface-variant', instructor: 'Sarah J. 교사', weeks: 8, difficulty: '기초' },
];

const LibraryContentList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['전체 콘텐츠']);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sort, setSort] = useState('최신순');

  const toggleCategory = (cat: string) => {
    if (cat === '전체 콘텐츠') {
      setSelectedCategories(['전체 콘텐츠']);
      return;
    }
    const next = selectedCategories.filter((c) => c !== '전체 콘텐츠');
    setSelectedCategories(next.includes(cat) ? next.filter((c) => c !== cat) || ['전체 콘텐츠'] : [...next, cat]);
  };

  const filtered = contents.filter((c) => {
    const matchCategory = selectedCategories.includes('전체 콘텐츠') || selectedCategories.includes(c.category);
    const matchDifficulty = !selectedDifficulty || c.difficulty === selectedDifficulty;
    const matchSearch = !search || c.title.includes(search) || c.category.includes(search);
    return matchCategory && matchDifficulty && matchSearch;
  });

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <span className="inline-block px-4 py-1.5 bg-secondary-container/20 text-secondary text-sm font-bold rounded-full">
              Elevate Your Skills
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary">
              학습 콘텐츠
            </h1>
            <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed">
              빅데이터와 AI가 추천하는 최적의 커리어 로드맵.<br />
              당신의 꿈을 현실로 만들어줄 전문 교육 과정을 탐색하세요.
            </p>
            <div className="w-full max-w-2xl mt-8 relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-secondary transition-colors">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="관심 있는 강의나 키워드를 입력하세요"
                className="w-full pl-16 pr-36 py-5 bg-surface-container-lowest rounded-full border-none shadow-[0px_20px_40px_rgba(10,25,47,0.06)] focus:ring-2 focus:ring-secondary/20 transition-all outline-none text-on-surface placeholder:text-outline-variant"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-secondary text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-secondary/30 transition-all">
                검색하기
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-48 -left-24 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      </section>

      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-10">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">카테고리</h3>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary/20"
                    />
                    <span className="text-on-surface group-hover:text-secondary transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">난이도</h3>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedDifficulty === d ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary hover:text-white'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <p className="text-on-surface-variant text-sm">
                총 <span className="text-primary font-bold">{filtered.length}</span>개의 콘텐츠
              </p>
              <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${sort === s ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-2 transition-all duration-500"
                >
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary-container/80 to-secondary/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-5xl opacity-30 group-hover:opacity-50 transition-opacity">play_circle</span>
                    </div>
                    <div className={`absolute top-4 left-4 ${c.categoryColor} backdrop-blur px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider`}>
                      {c.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.badgeClass}`}>
                      {c.badge}
                    </span>
                    <h3 className="text-lg font-bold text-primary leading-snug group-hover:text-secondary transition-colors">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary-container/30 flex items-center justify-center text-[10px] font-bold text-secondary">
                          {c.instructor[0]}
                        </div>
                        <span>{c.instructor}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {c.weeks}주
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/library/content/${c.id}`)}
                      className="w-full py-3 rounded-xl border border-outline-variant/30 text-primary font-bold hover:bg-primary hover:text-white transition-all"
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex justify-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-secondary hover:text-white transition-all">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${p === 1 ? 'bg-secondary text-white' : 'bg-surface-container-low text-on-surface hover:bg-secondary hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-secondary hover:text-white transition-all">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LibraryContentList;
