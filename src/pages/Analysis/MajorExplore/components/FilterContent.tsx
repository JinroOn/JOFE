const FilterContent = ({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  setSelectedCategories,
  categories,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  categories: string[];
}) => {
  const toggleCategory = (cat: string) => {
    setSelectedCategories(
      selectedCategories.includes(cat)
        ? selectedCategories.filter((c) => c !== cat)
        : [...selectedCategories, cat],
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-extrabold text-lg text-primary-container mb-3">전공 검색</h3>
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high border-none rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-secondary-container transition-all text-sm outline-none"
            placeholder="관심 있는 학과를 입력하세요"
          />
          <span className="material-symbols-outlined absolute right-4 top-3 text-outline">search</span>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-xs text-on-surface-variant mb-3 uppercase tracking-widest">전공 계열</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded text-secondary focus:ring-secondary border-outline-variant"
              />
              <span className="text-sm group-hover:text-secondary transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterContent;
