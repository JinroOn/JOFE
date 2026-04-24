const Footer = () => {
  return (
    <footer className="bg-[#0A192F] text-slate-300 py-20 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <h3 className="text-xl font-bold text-white mb-6">JinroOn</h3>
          <p className="leading-relaxed mb-8 opacity-80">
            AI 기술을 통해 모든 학생이 자신의 잠재력을 발견하고 가치 있는 미래를 설계할 수 있도록 돕습니다.
          </p>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white hover:bg-secondary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white hover:bg-secondary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white hover:bg-secondary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-4">
            <li><a className="hover:text-white transition-colors" href="#">About Us</a></li>
            <li><a className="hover:text-white transition-colors" href="#">University Partners</a></li>
            <li><a className="hover:text-white transition-colors" href="#">Career Opportunities</a></li>
            <li><a className="hover:text-white transition-colors" href="#">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Support</h4>
          <ul className="space-y-4">
            <li><a className="hover:text-white transition-colors" href="#">Help Center</a></li>
            <li><a className="hover:text-white transition-colors" href="#">Data Privacy</a></li>
            <li><a className="hover:text-white transition-colors" href="#">Terms of Service</a></li>
            <li><a className="hover:text-white transition-colors" href="#">Cookie Policy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Newsletter</h4>
          <p className="text-sm mb-4">매주 업데이트되는 대학 진로 정보를 받아보세요.</p>
          <div className="flex flex-col gap-2">
            <input 
              className="bg-slate-800 border-none rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-secondary transition-all" 
              placeholder="Email Address" 
              type="email"
            />
            <button className="bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-60">
        <p>© 2024 JinroOn AI. Empowering the next generation of scholars.</p>
        <div className="flex gap-8">
          <span>Made with AI for Students</span>
          <span>ISO 27001 Certified</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
