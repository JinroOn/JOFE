interface Props {
  title: string;
  content: string;
  onClose: () => void;
}

const ConsentModal = ({ title, content, onClose }: Props) => (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-white w-full max-w-lg rounded-[14px] shadow-2xl flex flex-col max-h-[80vh]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
        <h3 className="text-base font-bold text-primary-container">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-5">
        <pre className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-sans">
          {content}
        </pre>
      </div>

      <div className="px-6 py-4 border-t border-outline-variant/15">
        <button
          onClick={onClose}
          className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:bg-primary-container/90 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  </div>
);

export default ConsentModal;
