import { useState } from 'react';
import type { Major } from '../types';

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

export default MajorCard;
