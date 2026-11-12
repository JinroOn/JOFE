import { useState } from 'react';
import type { Major } from '../types';
import { getCategoryStyle } from '../types';

const DIFFICULTY_LABEL = { low: 'Easy', mid: 'Medium', high: 'Hard' } as const;
const DIFFICULTY_COLOR = {
  low: 'bg-surface-container-high text-on-surface-variant',
  mid: 'bg-secondary-container/20 text-on-secondary-container',
  high: 'bg-error-container/20 text-error',
} as const;

const MajorCard = ({
  major,
  onClick,
  bookmarked,
  onBookmark,
}: {
  major: Major;
  onClick: () => void;
  bookmarked: boolean;
  onBookmark: (id: number) => void;
}) => {
  const [bookmarking, setBookmarking] = useState(false);
  const { icon, iconBg, iconColor, categoryColor } = getCategoryStyle(major.category);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarked || bookmarking) return;
    setBookmarking(true);
    try {
      await onBookmark(major.id);
    } finally {
      setBookmarking(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[14px] p-6 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-2 transition-all duration-500 cursor-pointer border border-transparent hover:border-secondary-container/30 relative"
    >
      <button
        onClick={handleBookmark}
        disabled={bookmarked || bookmarking}
        className={`absolute top-4 right-4 transition-colors ${bookmarking ? 'opacity-60' : ''} ${bookmarked ? 'text-[#FFAB00]' : 'text-outline-variant hover:text-[#FFAB00]'}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}
        >
          {bookmarking ? 'hourglass_empty' : 'bookmark'}
        </span>
      </button>

      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center ${iconColor} mb-4`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div className="space-y-1 mb-3">
        <span className={`text-[10px] font-bold ${categoryColor} uppercase tracking-widest`}>
          {major.category ?? '기타'}
        </span>
        <h3 className="font-bold text-lg text-primary-container">{major.name}</h3>
      </div>

      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
        {major.description ?? ''}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-outline-variant/10 pt-4">
        <span className="text-[11px] text-outline font-medium">난이도</span>
        {major.difficulty ? (
          <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${DIFFICULTY_COLOR[major.difficulty]}`}>
            {DIFFICULTY_LABEL[major.difficulty]}
          </span>
        ) : (
          <span className="text-[11px] text-outline-variant">-</span>
        )}
      </div>
    </div>
  );
};

export default MajorCard;
