const Home = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container/20 text-secondary font-bold rounded-full mb-8">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              <span className="text-sm">AI 기반 맞춤형 진로 설계 시스템</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-primary leading-tight tracking-tight mb-8 font-headline">
              나의 가능성에 맞는<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary-container">전공을 찾아드려요</span>
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed mb-10 max-w-2xl font-body">
              수천 개의 학과 데이터와 실시간 취업 트렌드를 AI가 분석하여,<br />
              당신의 잠재력을 극대화할 최적의 학문적 경로를 제안합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="px-10 py-5 bg-[#FFAB00] text-primary-container text-lg font-extrabold rounded-brand cloud-shadow hover:-translate-y-1 transition-all active:scale-95">
                전공 진단 시작하기
              </button>
              <button className="px-10 py-5 border border-outline-variant/30 text-primary font-bold text-lg rounded-brand hover:bg-white transition-all">
                서비스 둘러보기
              </button>
            </div>
            {/* Live Stats */}
            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8">
              <div>
                <p className="text-2xl font-black text-primary">248,102</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Today Visitors</p>
              </div>
              <div className="w-px h-8 bg-outline-variant/30"></div>
              <div>
                <p className="text-2xl font-black text-primary">98.2%</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">AI Confidence</p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary-container/30 rounded-full blur-[100px]"></div>
            <div className="relative bg-white p-6 rounded-[24px] cloud-shadow border border-white/40 overflow-hidden group">
              <img 
                alt="Students exploring majors" 
                className="rounded-[18px] w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNC0Ol2ezLTqYgIHw1atlSxPw9_nJkOLjkTtQPGE1CD27Pd70Nn-DUkUUcSKxcD1ZTEuTI3iOpV8FGbT6h69r-DrVblDdSr4-RuATUTLUOh79wO49X2tr00TIXukLJUInKjtH0tv1VPA99IyXdTTtfMRZoWcJtF9K34rRqq2kaUAsDkQSSAIs5gYhO1ZHOLmMThf7iXDZ7Zn1lpmti3u1k5AOSP0Ni9HCPdzn1IRanacHzcabB42pXLmeAOwKyV57M-rYmv40WK8k"
              />
              <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/80 backdrop-blur-md rounded-brand border border-white/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary rounded-xl text-white">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">실시간 전공 선호도 분석 중</p>
                    <div className="w-48 h-1.5 bg-secondary-container/30 rounded-full mt-2 overflow-hidden">
                      <div className="w-3/4 h-full bg-secondary"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-primary mb-4 font-headline tracking-tight">당신을 위한 스마트한 도구</h2>
            <p className="text-on-surface-variant text-lg">단순한 추천을 넘어, 실제 데이터 기반의 커리어 로드맵을 제공합니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-10 rounded-brand cloud-shadow hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-50 text-secondary rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">전공 진단</h3>
              <p className="text-on-surface-variant leading-relaxed">
                나의 흥미, 성격, 성적 데이터를 결합하여 가장 어울리는 상위 5개 전공을 매칭합니다.
              </p>
              <div className="mt-8 flex items-center gap-2 text-secondary font-bold group cursor-pointer">
                <span>진단하기</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-brand cloud-shadow hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl">insights</span>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">역량 분석</h3>
              <p className="text-on-surface-variant leading-relaxed">
                선택한 전공에서 성공하기 위해 필요한 핵심 역량과 나의 현재 준비도를 비교 분석합니다.
              </p>
              <div className="mt-8 flex items-center gap-2 text-orange-500 font-bold group cursor-pointer">
                <span>분석하기</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-brand cloud-shadow hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-slate-100 text-primary-container rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl">forum</span>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">AI 상담</h3>
              <p className="text-on-surface-variant leading-relaxed">
                24시간 언제든 전공에 대한 궁금증을 AI 멘토와 상담하고 구체적인 진로 방향을 설정하세요.
              </p>
              <div className="mt-8 flex items-center gap-2 text-primary-container font-bold group cursor-pointer">
                <span>상담하기</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-primary mb-4">기존 적성검사와 무엇이 다른가요?</h2>
            <p className="text-on-surface-variant">JinroOn의 AI는 더 깊고 입체적으로 당신의 미래를 예측합니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/20 rounded-brand overflow-hidden cloud-shadow">
            <div className="bg-white p-12">
              <h4 className="text-slate-400 font-bold mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">history</span> 기존 적성검사
              </h4>
              <ul className="space-y-6">
                <li className="flex items-start gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-error mt-0.5">close</span>
                  <span>정적인 문항 위주의 자기보고식 검사</span>
                </li>
                <li className="flex items-start gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-error mt-0.5">close</span>
                  <span>단순 흥미 위주의 결과 도출</span>
                </li>
                <li className="flex items-start gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-error mt-0.5">close</span>
                  <span>취업 시장 트렌드 반영 미흡</span>
                </li>
              </ul>
            </div>
            <div className="bg-primary-container p-12">
              <h4 className="text-secondary-container font-bold mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">auto_awesome</span> JinroOn AI 진단
              </h4>
              <ul className="space-y-6">
                <li className="flex items-start gap-3 text-white">
                  <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>다면적 빅데이터 분석 기반의 정밀 매칭</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>실제 대학 커리큘럼 및 이수 과목 분석</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>10만 개 이상의 실무자 커리어 경로 학습</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-extrabold text-primary mb-4 font-headline">3단계로 시작하는 미래 설계</h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary-container font-black text-2xl mb-8 border-8 border-white shadow-lg">01</div>
              <h4 className="text-xl font-bold mb-4">데이터 입력</h4>
              <p className="text-on-surface-variant leading-relaxed px-4">나의 관심 분야, 학교 생활기록부, 성향 테스트를 진행합니다.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-primary-container font-black text-2xl mb-8 border-8 border-white shadow-lg">02</div>
              <h4 className="text-xl font-bold mb-4">AI 엔진 분석</h4>
              <p className="text-on-surface-variant leading-relaxed px-4">JinroOn AI가 5만 건 이상의 선배들 데이터를 바탕으로 전공 적합도를 계산합니다.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-white font-black text-2xl mb-8 border-8 border-white shadow-lg">03</div>
              <h4 className="text-xl font-bold mb-4">리포트 수령</h4>
              <p className="text-on-surface-variant leading-relaxed px-4">전공 추천 사유와 권장 이수 과목이 담긴 12페이지 심층 리포트를 확인하세요.</p>
            </div>
          </div>
          <div className="mt-20 text-center">
            <button className="px-12 py-5 bg-[#FFAB00] text-primary-container font-extrabold rounded-full text-xl cloud-shadow hover:scale-105 transition-transform">
              지금 무료로 시작하기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
