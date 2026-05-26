interface SliderPanelProps {
  axes: string[];
  scores: number[];
  onChange: (i: number, val: number) => void;
}

const SliderPanel = ({ axes, scores, onChange }: SliderPanelProps) => (
  <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
    <h3 className="text-xl font-bold mb-6 sm:mb-8 flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary">tune</span>
      역량 변수 조절기
    </h3>
    <div className="space-y-5 sm:space-y-6">
      {axes.map((axis, i) => (
        <div key={axis} className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-on-surface-variant">{axis}</label>
            <span className="text-secondary font-black tabular-nums">{scores[i].toFixed(1)}점</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={scores[i]}
            onChange={(e) => onChange(i, Number(e.target.value))}
            className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-secondary"
          />
        </div>
      ))}
    </div>
  </section>
);

export default SliderPanel;
