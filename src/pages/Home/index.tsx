
import { useNavigate } from 'react-router-dom';
import { diagnosisEntryPath } from '../../config/features';
import useAuthStore from '../../store/useAuthStore';

const Home = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const handleStartDiagnosis = () => {
    navigate(diagnosisEntryPath);
  };

  const handleStartFree = () => {
    if (isLoggedIn) {
      navigate(diagnosisEntryPath);
    } else {
      navigate('/auth/signup');
    }
  };

  const features = [
    {
      icon: 'fact_check',
      title: '전공 탐색 진단',
      description: '관심 있는 분야와 활동, 배우고 싶은 내용을 답하면 다음 질문이 정해집니다.',
      iconStyle: 'bg-[#EAF5FF] text-[#087D9C]',
      path: diagnosisEntryPath,
    },
    {
      icon: 'insights',
      title: '탐색 결과',
      description: '먼저 알아볼 전공과 그 전공에 연결된 내 응답을 확인합니다.',
      iconStyle: 'bg-[#FFF4EA] text-[#FF762E]',
      path: '/analysis/dashboard',
    },
    {
      icon: 'compare_arrows',
      title: '후보 전공 비교',
      description: '두 전공의 학습 주제와 활동을 나란히 살펴봅니다.',
      iconStyle: 'bg-[#F0F3F8] text-[#172B46]',
      path: '/analysis/dashboard?next=compare',
    },
    {
      icon: 'science',
      title: '탐색 활동',
      description: '관심 전공의 공부를 경험해 볼 수 있는 작은 활동을 해 봅니다.',
      iconStyle: 'bg-[#FFF4EA] text-[#FF762E]',
      path: '/analysis/dashboard?next=activities',
    },
    {
      icon: 'support_agent',
      title: 'AI 결과 상담',
      description: '내 결과나 전공 비교에서 생긴 질문을 AI에 물어봅니다.',
      iconStyle: 'bg-[#F0F3F8] text-[#172B46]',
      path: '/ai-chat',
    },
    {
      icon: 'event_note',
      title: '12주 탐색 계획',
      description: '선택한 전공을 더 알아보고 싶을 때 주차별 계획을 만듭니다.',
      iconStyle: 'bg-[#EAF5FF] text-[#087D9C]',
      path: '/analysis/dashboard?next=plan',
    },
  ];

  const processSteps = [
    {
      number: '01',
      title: '진단',
      description: '관심과 경험을 묻는 문항에 답합니다.',
      style: 'bg-[#E9EDF2] text-[#10213A]',
    },
    {
      number: '02',
      title: '결과 확인',
      description:
        '먼저 살펴볼 전공과 내 응답이 연결된 이유를 확인합니다.',
      style: 'bg-[#00C8E8] text-[#0D1C32]',
    },
    {
      number: '03',
      title: '후보 탐색',
      description:
        '후보를 비교하고 작은 활동을 해 본 뒤 필요하면 12주 계획을 만듭니다.',
      style: 'bg-[#0D1C32] text-white',
    },
  ];

  return (
    <main className="w-full overflow-hidden">
      {/* 메인 비주얼 */}
      <section className="relative bg-[#F7FAFD] px-5 sm:px-8 py-16 lg:py-20 overflow-hidden">
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#B5F4FA]/50 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1180px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 w-full text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DDF7FC] text-[#007B98] font-bold rounded-full mb-7">
              <span className="material-symbols-outlined text-[18px]">
                psychology
              </span>
              <span className="text-sm">
                AI 기반 맞춤형 진로 설계 시스템
              </span>
            </div>

            <h1 className="text-[38px] sm:text-5xl lg:text-[58px] font-extrabold text-[#050505] leading-[1.15] tracking-tight mb-7 font-headline">
              나의 가능성에 맞는
              <br />
              <span className="text-[#00677F]">
                전공을 찾아드려요
              </span>
            </h1>

            <p className="text-[15px] sm:text-base text-[#5B6470] leading-[1.9] mb-9 max-w-[540px] mx-auto lg:mx-0 font-body">
              관심 분야와 경험, 배우고 싶은 내용에 답하면 먼저 살펴볼 전공을 안내해요.
              <br className="hidden sm:block" />
              후보 전공을 비교하고 짧은 활동으로 관심을 구체화할 수 있어요.
            </p>

            <div className="flex justify-center lg:justify-start">
              <button
                type="button"
                onClick={handleStartDiagnosis}
                className="px-8 py-4 bg-[#FFAB00] text-[#0D1C32] font-extrabold rounded-xl shadow-[0_8px_20px_rgba(255,171,0,0.15)] hover:bg-[#F5A000] hover:-translate-y-1 transition-all active:scale-95"
              >
                전공 탐색 진단 시작하기
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-[570px] relative">
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#A5F1F8]/60 rounded-full blur-[90px]" />

            <div className="relative bg-white p-3 sm:p-4 rounded-[22px] shadow-[0_20px_45px_rgba(15,35,60,0.10)] border border-white">
              <div className="relative overflow-hidden rounded-[16px]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNC0Ol2ezLTqYgIHw1atlSxPw9_nJkOLjkTtQPGE1CD27Pd70Nn-DUkUUcSKxcD1ZTEuTI3iOpV8FGbT6h69r-DrVblDdSr4-RuATUTLUOh79wO49X2tr00TIXukLJUInKjtH0tv1VPA99IyXdTTtfMRZoWcJtF9K34rRqq2kaUAsDkQSSAIs5gYhO1ZHOLmMThf7iXDZ7Zn1lpmti3u1k5AOSP0Ni9HCPdzn1IRanacHzcabB42pXLmeAOwKyV57M-rYmv40WK8k"
                  alt="학생들이 전공을 탐색하는 모습"
                  className="w-full h-[260px] sm:h-[340px] lg:h-[365px] object-cover"
                />

                <div className="absolute bottom-4 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 p-4 sm:p-5 bg-white/85 backdrop-blur-md rounded-xl border border-white/70 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 shrink-0 bg-[#007B98] rounded-xl flex items-center justify-center text-white">
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        analytics
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#172033]">
                        추천 전공과 이유를 한눈에
                      </p>

                      <div className="w-full max-w-[180px] h-1.5 bg-[#BCEAF0] rounded-full mt-2 overflow-hidden">
                        <div className="w-3/4 h-full bg-[#007B98] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 스마트한 도구 */}
      <section
        id="features"
        className="bg-[#F0F3F7] px-5 sm:px-8 py-16 lg:py-20"
      >
        <div className="max-w-[1180px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[27px] sm:text-[30px] font-extrabold text-[#080808] mb-3 font-headline">
              당신을 위한 스마트한 도구
            </h2>

            <p className="text-sm sm:text-base text-[#68717D]">
              진단부터 결과 설명, 학습 계획까지 한곳에서 이어집니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((feature) => (
              <button
                key={feature.title}
                type="button"
                onClick={() => navigate(feature.path)}
                aria-label={`${feature.title} 페이지로 이동`}
                className="w-full min-h-[180px] text-left bg-white p-5 rounded-xl shadow-[0_8px_22px_rgba(15,35,60,0.06)] hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(15,35,60,0.10)] transition-all duration-300 group"
              >
                <div
                  className={`w-10 h-10 ${feature.iconStyle} rounded-xl flex items-center justify-center mb-4`}
                >
                  <span className="material-symbols-outlined text-[21px]">
                    {feature.icon}
                  </span>
                </div>

                <h3 className="text-[16px] font-extrabold text-[#111827] mb-2 group-hover:text-[#00677F] transition-colors">
                  {feature.title}
                </h3>

                <p className="text-[12px] text-[#737B86] leading-[1.7] break-keep">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 미래 설계 */}
      <section className="bg-white px-5 sm:px-8 py-20 lg:py-24">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[27px] sm:text-[31px] font-extrabold text-[#080808]">
              3단계로 시작하는 미래 설계
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="hidden md:block absolute top-[29px] left-[16.66%] right-[16.66%] h-px bg-[#E5EAF0]" />

            {processSteps.map((step) => (
              <div
                key={step.number}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div
                  className={`w-[58px] h-[58px] rounded-full ${step.style} flex items-center justify-center text-[19px] font-black border-[5px] border-white shadow-[0_4px_10px_rgba(15,35,60,0.13)] mb-5`}
                >
                  {step.number}
                </div>

                <h3 className="text-[17px] font-extrabold text-[#111827] mb-3">
                  {step.title}
                </h3>

                <p className="text-[13px] text-[#737B86] leading-[1.8] max-w-[300px] break-keep">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              type="button"
              onClick={handleStartFree}
              className="px-10 py-4 bg-[#FFAB00] text-[#0D1C32] font-extrabold text-[16px] rounded-full shadow-[0_8px_20px_rgba(255,171,0,0.18)] hover:bg-[#F5A000] hover:-translate-y-1 transition-all active:scale-95"
            >
              지금 무료로 시작하기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
