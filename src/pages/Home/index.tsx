
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
      title: '단계별 전공 진단',
      description: '단계별 질문을 통해 정밀하게 분석합니다.',
      iconStyle: 'bg-[#EAF5FF] text-[#087D9C]',
      path: diagnosisEntryPath,
    },
    {
      icon: 'insights',
      title: '9개 계열 성향 분석',
      description: '나의 학업 성향을 9가지 핵심 계열로 분류합니다.',
      iconStyle: 'bg-[#FFF4EA] text-[#FF762E]',
      path: '/diagnosis/tendency',
    },
    {
      icon: 'fitness_center',
      title: '공통 기초 역량 분석',
      description: '전공 학습에 필요한 기초 역량을 진단합니다.',
      iconStyle: 'bg-[#F0F3F8] text-[#172B46]',
      path: '/analysis/weak',
    },
    {
      icon: 'manage_accounts',
      title: '사용자별 맞춤 추가 진단',
      description: '부족한 데이터 보완을 위한 개인별 맞춤 질문을 제공합니다.',
      iconStyle: 'bg-[#EAF5FF] text-[#087D9C]',
      path: diagnosisEntryPath,
    },
    {
      icon: 'school',
      title: '세부 전공 추천',
      description: '계열을 넘어 나에게 딱 맞는 세부 전공을 제안합니다.',
      iconStyle: 'bg-[#FFF4EA] text-[#FF762E]',
      path: '/diagnosis/explore',
    },
    {
      icon: 'compare_arrows',
      title: '유사 전공 비교',
      description: '추천된 전공들 간의 차이점을 한눈에 비교합니다.',
      iconStyle: 'bg-[#F0F3F8] text-[#172B46]',
      path: '/analysis/compare',
    },
    {
      icon: 'trending_up',
      title: '강점·준비 요소 분석',
      description: '나의 강점과 해당 전공 진학을 위해 필요한 준비도를 분석합니다.',
      iconStyle: 'bg-[#EAF5FF] text-[#087D9C]',
      path: '/analysis/dashboard',
    },
    {
      icon: 'support_agent',
      title: 'AI 결과 상담',
      description: '분석 결과를 바탕으로 24시간 AI 전문가 상담이 가능합니다.',
      iconStyle: 'bg-[#FFF4EA] text-[#FF762E]',
      path: '/ai-chat',
    },
  ];

  const oldFeatures = [
    '정적인 문항 위주의 자기보고식 검사',
    '단순 흥미 위주의 결과 도출',
    '취업 시장 트렌드 반영 미흡',
  ];

  const newFeatures = [
    '단순 흥미검사만으로 전공을 추천하지 않음',
    '성향과 역량을 함께 확인',
    '필요한 사용자에게만 맞춤 추가 진단 제공',
    '계열 → 전공군 → 세부 전공 순으로 탐색',
    '추천 이유와 준비 요소를 함께 제공',
    '유사 전공 비교 가능',
  ];

  const processSteps = [
    {
      number: '01',
      title: '공통 진단',
      description: '성향과 기초 역량을 함께 확인합니다.',
      style: 'bg-[#E9EDF2] text-[#10213A]',
    },
    {
      number: '02',
      title: '필요한 영역 추가 확인',
      description:
        '후보가 가진 기초 역량 확인이 더 필요한 경우에만 맞춤 질문을 추가로 받습니다.',
      style: 'bg-[#00C8E8] text-[#0D1C32]',
    },
    {
      number: '03',
      title: '추천 근거 제공',
      description:
        '왜 이 전공이 추천되었는지 이유와 준비 요소를 함께 확인합니다.',
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
              수천 개의 학과 데이터와 실시간 취업 트렌드를 AI가 분석하여,
              <br className="hidden sm:block" />
              당신의 잠재력을 극대화할 최적의 학문적 경로를 제안합니다.
            </p>

            <div className="flex justify-center lg:justify-start">
              <button
                type="button"
                onClick={handleStartDiagnosis}
                className="px-8 py-4 bg-[#FFAB00] text-[#0D1C32] font-extrabold rounded-xl shadow-[0_8px_20px_rgba(255,171,0,0.15)] hover:bg-[#F5A000] hover:-translate-y-1 transition-all active:scale-95"
              >
                전공 진단 시작하기
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
                        실시간 전공 선호도 분석 중
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
              단순한 추천을 넘어, 실제 데이터 기반의 커리어 로드맵을 제공합니다.
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

      {/* 기존 검사와 비교 */}
      <section className="bg-[#F7FAFD] px-5 sm:px-8 py-20 lg:py-24">
        <div className="max-w-[1020px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[25px] sm:text-[29px] font-extrabold text-[#080808] mb-3">
              기존 적성검사와 무엇이 다른가요?
            </h2>

            <p className="text-sm text-[#68717D]">
              JinroOn의 AI는 더 깊고 입체적으로 당신의 미래를 예측합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden shadow-[0_12px_35px_rgba(15,35,60,0.08)]">
            <div className="bg-white px-7 py-9 sm:px-10 sm:py-10 lg:px-12">
              <h3 className="flex items-center gap-2 text-[#8B9BB1] font-bold text-[15px] mb-8">
                <span className="material-symbols-outlined text-[18px]">
                  history
                </span>
                기존 적성검사
              </h3>

              <ul className="space-y-6">
                {oldFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[13px] text-[#626B77]"
                  >
                    <span className="material-symbols-outlined text-[#EF4444] text-[19px] shrink-0">
                      close
                    </span>

                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0D1C32] px-7 py-9 sm:px-10 sm:py-10 lg:px-12">
              <h3 className="flex items-center gap-2 text-[#00D2F5] font-bold text-[15px] mb-8">
                <span className="material-symbols-outlined text-[19px]">
                  auto_awesome
                </span>
                JinroOn AI 진단
              </h3>

              <ul className="space-y-5">
                {newFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[13px] text-white"
                  >
                    <span
                      className="material-symbols-outlined text-[#00A6BE] text-[18px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>

                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
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
