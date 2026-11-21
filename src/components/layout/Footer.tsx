const Footer = () => {
  return (
    <footer className="bg-[#0A192F] text-slate-300 py-20 px-8">
      {/* 연결할 페이지가 없는 링크와 받지 않은 인증 표시는 두지 않는다 */}
      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-6">JinroOn</h3>
        <p className="max-w-xl leading-relaxed opacity-80 break-keep">
          성향과 역량 문항에 답한 결과로 먼저 살펴볼 전공을 정리하고, AI가 그 결과를 쉽게 풀어 설명합니다.
        </p>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-16 pt-10 text-sm opacity-60">
        <p>© 2026 JinroOn. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
