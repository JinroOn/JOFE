import { useState } from 'react';

const DOT_COORDS: [number, number][] = [
  [200, 40], [330, 120], [360, 200], [300, 320],
  [200, 360], [80, 300], [40, 200], [120, 80],
];

const AXIS_LABELS = [
  { label: 'Logic',      cls: 'top-[2%] left-1/2 -translate-x-1/2' },
  { label: 'Creative',   cls: 'top-[20%] right-0' },
  { label: 'Social',     cls: 'top-1/2 -translate-y-1/2 right-0' },
  { label: 'Leadership', cls: 'bottom-[10%] right-[8%]' },
  { label: 'Technical',  cls: 'bottom-[2%] left-1/2 -translate-x-1/2' },
  { label: 'Analysis',   cls: 'bottom-[10%] left-[8%]' },
  { label: 'Focus',      cls: 'top-1/2 -translate-y-1/2 left-0' },
  { label: 'Vision',     cls: 'top-[20%] left-0' },
];

const ShareSection = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mt-12 relative bg-[#0A192F] rounded-[14px] overflow-hidden dot-grid border border-white/5 shadow-[0px_20px_40px_rgba(10,25,47,0.3)]">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-on-tertiary-container/10 rounded-full blur-[100px]" />

      {/* 카드 헤더 */}
      <div className="relative z-10 flex justify-between items-center px-8 sm:px-12 pt-8 sm:pt-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary-container rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.4)] shrink-0">
            <span className="material-symbols-outlined text-primary-container text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
              explore
            </span>
          </div>
          <span className="text-xl font-headline font-extrabold text-white tracking-tighter">JinroOn</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 bg-secondary-container rounded-full animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-secondary-container uppercase tracking-widest whitespace-nowrap">
            Live Analysis Report
          </span>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-10 px-8 sm:px-12 py-8 sm:py-10">
        {/* 좌측 */}
        <div className="flex-1 flex flex-col justify-between gap-8 min-w-0">
          <div>
            <h2 className="text-3xl sm:text-4xl font-headline font-extrabold text-white leading-tight tracking-tight mb-6">
              홍길동님의<br />진로 역량 리포트
            </h2>
            <div className="glass-panel p-5 sm:p-6 rounded-[14px] border border-white/10 shadow-xl">
              <div className="text-on-primary-container text-[11px] font-bold uppercase tracking-widest mb-3 opacity-70">
                Top Recommended Major
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">컴퓨터공학</div>
                  <div className="text-secondary-container font-medium">Computer Science</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-secondary-container text-3xl sm:text-4xl font-black leading-none">
                    98<span className="text-lg sm:text-xl">%</span>
                  </div>
                  <div className="text-[10px] text-white/50 uppercase tracking-tighter">Suitability Score</div>
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container w-[98%] shadow-[0_0_10px_rgba(0,210,255,0.6)]" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-5 py-3.5 bg-[#FEE500] text-[#3C1E1E] rounded-[14px] font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
              <span className="material-symbols-outlined">chat</span>
              카카오톡 공유
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-3.5 glass-panel border border-white/10 text-white rounded-[14px] font-bold hover:border-white/30 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined">{copied ? 'check' : 'link'}</span>
              {copied ? '복사됨!' : '링크 복사'}
            </button>
          </div>
        </div>

        {/* 우측 — 레이더 차트 */}
        <div className="flex-1 relative flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
          <div className="absolute inset-0 bg-secondary-container/5 rounded-full blur-[80px]" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <svg className="w-full max-h-[320px] radar-glow" viewBox="0 0 400 400">
              {[180, 140, 100, 60].map((r) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1="72" y1="72" x2="328" y2="328" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1="72" y1="328" x2="328" y2="72" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <polygon
                points="200,40 330,120 360,200 300,320 200,360 80,300 40,200 120,80"
                fill="rgba(0,210,255,0.15)"
                stroke="#00D2FF"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {DOT_COORDS.map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="5" fill="#00D2FF" />
              ))}
            </svg>
            {AXIS_LABELS.map(({ label, cls }) => (
              <div key={label} className={`absolute text-white/60 text-[10px] sm:text-xs font-bold tracking-widest uppercase ${cls}`}>
                {label}
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 glass-panel rounded-full border border-secondary-container/30 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-secondary-container text-3xl sm:text-4xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  psychology
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 그라데이션 선 */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-secondary-container/50 to-transparent" />
    </section>
  );
};

export default ShareSection;
