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

export default FilterContent;
