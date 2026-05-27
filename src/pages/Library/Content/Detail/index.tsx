const relatedContents = [
  { title: '데이터 과학자를 위한 파이썬 라이브러리 기초', channel: 'AI Academy', views: '1.2만회', duration: '15:42' },
  { title: '현직 개발자가 알려주는 비전공자 커리어 로드맵', channel: 'JinroOn Insight', views: '3.5천회', duration: '22:10' },
  { title: '확률과 통계: 머신러닝의 핵심 언어 이해하기', channel: '수학의 정석 AI', views: '8.9천회', duration: '18:05' },
  { title: '딥러닝 입문자를 위한 선형대수학 완전 정복', channel: 'DeepStudy', views: '2.1만회', duration: '45:12' },
];

const curriculum = [
  { num: '01', title: '명제 논리와 추론 (Logic and Inference)', desc: '조건문과 진리표를 통한 AI 의사결정 나무의 기초 이해', active: true },
  { num: '02', title: '집합론과 데이터베이스 (Set Theory)', desc: '벤다이어그램을 활용한 데이터 쿼리 조합 원리 학습', active: false },
  { num: '03', title: '그래프 이론 기초 (Basic Graph Theory)', desc: '관계형 데이터 및 네트워크 분석을 위한 기초 지식', active: false },
];

const LibraryContentDetail = () => {
  return (
    <div className="pt-8 pb-20 px-4 sm:px-8 max-w-[1280px] mx-auto">
      <section className="mb-12">
        <div className="relative w-full aspect-video rounded-[14px] overflow-hidden shadow-[0px_20px_40px_rgba(10,25,47,0.1)] bg-black">
          <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
            <div className="w-full h-full bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center">
              <div className="relative w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-4 text-white/90">
              <span className="material-symbols-outlined">pause</span>
              <span className="material-symbols-outlined">volume_up</span>
              <span className="text-sm font-medium">12:45 / 45:00</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <span className="material-symbols-outlined">settings</span>
              <span className="material-symbols-outlined">fullscreen</span>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['#수학', '#기초', '#AI역량'].map((tag) => (
              <span key={tag} className="px-3 py-1 bg-secondary-container/20 text-secondary font-semibold text-xs rounded-full border border-secondary/20">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface mb-6 tracking-tight leading-tight">
            취약 역량 보완을 위한 이산수학 기초
          </h1>

          <div className="flex flex-wrap items-center gap-4 py-4 border-y border-outline-variant/15">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-white font-bold text-lg">김</div>
            <div>
              <p className="font-bold text-on-surface">김진로 교수</p>
              <p className="text-sm text-on-surface-variant">JinroOn AI 전임 멘토 • 데이터 사이언스 전문가</p>
            </div>
            <div className="sm:ml-auto flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-all text-sm font-semibold">
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
                저장하기
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-all text-sm font-semibold">
                <span className="material-symbols-outlined text-[20px]">share</span>
                공유하기
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-6 md:p-8 rounded-[14px] border-l-4 border-secondary">
          <div className="flex items-center gap-3 mb-4 text-secondary">
            <span className="material-symbols-outlined">psychology</span>
            <h3 className="font-bold text-lg">AI 맞춤 추천 가이드</h3>
          </div>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            최근 진행하신 <strong>AI 역량 진단</strong> 결과, 알고리즘 설계 및 데이터 구조 이해의 핵심이 되는{' '}
            <span className="text-secondary font-semibold">이산수학</span> 분야에서 보완이 필요한 것으로 분석되었습니다.
            이 강의는 복잡한 수식을 배제하고 AI 모델링에 직접적으로 활용되는 논리 연산과 집합론의 핵심 개념을 중점적으로 다룹니다.
          </p>
          <div className="bg-white p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">학습 기대 효과</span>
            <div className="flex gap-4">
              {['논리적 사고력 +24%', '알고리즘 이해도 +18%'].map((effect) => (
                <div key={effect} className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-xs font-medium">{effect}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">강의 커리큘럼</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map(({ num, title, desc, active }) => (
              <li key={num} className="flex items-start gap-4 p-4 hover:bg-surface-container-low rounded-xl transition-colors group">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {num}
                </span>
                <div>
                  <h4 className="font-bold group-hover:text-secondary transition-colors">{title}</h4>
                  <p className="text-sm text-on-surface-variant">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)]">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">description</span>
            관련 학습 자료
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: '이산수학 핵심 요약 노트.pdf', meta: 'PDF • 2.4MB' },
              { name: '연습문제 및 풀이 해설.zip', meta: 'ZIP • 15.8MB' },
            ].map(({ name, meta }) => (
              <a key={name} href="#" className="block p-3 border border-outline-variant/20 rounded-lg hover:border-secondary transition-colors">
                <p className="text-sm font-bold mb-1">{name}</p>
                <p className="text-xs text-on-surface-variant">{meta}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-20">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-2">이런 콘텐츠는 어떠세요?</h2>
          <p className="text-on-surface-variant">함께 학습하면 시너지가 발생하는 연관 강의입니다.</p>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-8 [&::-webkit-scrollbar]:hidden">
          {relatedContents.map(({ title, channel, views, duration }) => (
            <div key={title} className="min-w-[320px] group cursor-pointer">
              <div className="relative aspect-video rounded-[14px] overflow-hidden mb-4 shadow-sm bg-gradient-to-br from-primary-container/80 to-secondary/60 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-5xl opacity-40">play_circle</span>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">{duration}</div>
              </div>
              <h4 className="font-bold text-on-surface mb-1 line-clamp-2 group-hover:text-secondary transition-colors">{title}</h4>
              <p className="text-xs text-on-surface-variant">{channel} • 조회수 {views}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LibraryContentDetail;
