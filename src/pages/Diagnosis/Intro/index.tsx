import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const STEPS = [
  { no: '01', title: '기본 정보', desc: '관심·학습환경' },
  { no: '02', title: '1차 공통 성향', desc: '활동·학습 성향' },
  { no: '03', title: '1차 공통 역량', desc: '기초 사고력' },
  { no: '04', title: '2차 심화 진단', desc: '필요 영역 심화 확인' },
  { no: '05', title: '결과 확인', desc: '추천·탐색 방향' },
];

const INFOS = [
  { label: '예상 문항', title: '약 66~86문항', desc: '추가 질문 여부에 따라 달라집니다.' },
  { label: '진행 방식', title: '사용자별 맞춤 진단', desc: '필요 영역만 2차로 추가 확인합니다.' },
  { label: '자동 저장', title: '이어하기 지원', desc: '중간에 나가도 저장됩니다.' },
];

const DiagnosisIntro = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 진단 중간 단계에서 '이전 단계'로 돌아온 경우 안내를 건너뛰고 기본 정보 입력으로 이동
  if ((location.state as { skipChoice?: boolean } | null)?.skipChoice) {
    return <Navigate to="/diagnosis/basic-info" state={{ skipChoice: true }} replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-10 pb-20">
        <div className="text-center mb-14">
          <span className="inline-block px-12 py-1.5 mb-6 rounded-full bg-secondary-container/10 text-xs font-bold text-secondary">
            전공 탐색 진단
          </span>
          <h1 className="break-keep text-2xl sm:text-[34px] sm:leading-[1.5] font-bold text-primary-container mb-6">
            나에게 맞는 전공 방향을
            <br />
            함께 탐색해볼까요?
          </h1>
          <p className="break-keep text-sm text-on-surface-variant">
            활동 성향과 기초 역량을 함께 확인하고, 필요한 경우에만 맞춤 질문을 추가합니다.
          </p>
        </div>

        <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {STEPS.map((step) => (
            <li
              key={step.no}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl px-4 py-5"
            >
              <p className="text-xs font-bold text-secondary mb-2">{step.no}</p>
              <p className="break-keep text-lg sm:text-[22px] font-bold text-primary mb-2">{step.title}</p>
              <p className="text-[11px] text-on-surface-variant">{step.desc}</p>
            </li>
          ))}
        </ol>

        <div className="max-w-[800px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8 mb-8">
            {INFOS.map((info) => (
              <div
                key={info.label}
                className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl px-4 py-5"
              >
                <p className="text-xs font-bold text-secondary mb-2">{info.label}</p>
                <p className="break-keep text-lg sm:text-[22px] font-bold text-primary-container mb-2">{info.title}</p>
                <p className="text-[11px] text-on-surface-variant">{info.desc}</p>
              </div>
            ))}
          </div>

          <p className="break-keep mb-7 px-5 py-4 rounded-xl bg-surface-container text-center text-sm sm:text-base text-on-surface-variant">
            이 진단은 특정 전공 선택이나 합격 가능성을 판단하는 검사가 아닙니다. 전공 탐색을 위한 참고 자료로 활용해주세요.
          </p>

          <div className="flex justify-end">
            <button
              onClick={() => navigate('/diagnosis/basic-info')}
              className="px-12 py-3.5 rounded-xl bg-secondary text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              진단 시작하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisIntro;
