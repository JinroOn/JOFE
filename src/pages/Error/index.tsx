import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type'); // 'ai-failure' | 'network' | null(둘 다 표시)
  const [bannerVisible, setBannerVisible] = useState(true);

  const showAiFailure = !type || type === 'ai-failure';
  const showNetwork = !type || type === 'network';

  return (
    <div className="pb-16 px-4 sm:px-8 pt-8 max-w-[1280px] mx-auto w-full">
      {/* 지연 안내 배너 */}
      {bannerVisible && (
        <div className="mb-8 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_10px_30px_rgba(10,25,47,0.04)] flex items-center justify-between border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500 shrink-0 animate-pulse">timer</span>
            <p className="text-on-surface-variant text-sm font-medium">
              현재 AI 분석 요청이 많아 결과 도출에 평소보다 시간이 더 소요되고 있습니다. (최대 1분)
            </p>
          </div>
          <button
            onClick={() => setBannerVisible(false)}
            className="text-on-surface-variant hover:text-on-surface ml-4 shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      )}

      <div className={`grid gap-8 ${showAiFailure && showNetwork ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
        {/* AI 분석 실패 */}
        {showAiFailure && (
          <section className="bg-surface-container-lowest rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center cloud-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-8xl">psychology_alt</span>
            </div>
            <div className="w-32 h-32 mb-8 relative flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-secondary-container/20 rounded-full blur-3xl" />
              <div className="relative z-10 w-full h-full bg-surface-container rounded-full flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-6xl text-secondary-container"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  smart_toy
                </span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 text-on-surface">
              AI 분석을 완료하지 못했습니다
            </h2>
            <p className="text-on-surface-variant mb-10 max-w-sm leading-relaxed text-sm sm:text-base">
              입력하신 정보 중 일부가 불분명하거나 시스템 일시 오류로 분석이 중단되었습니다. 다시 시도하시겠습니까?
            </p>
            <div className="flex flex-wrap justify-center gap-4 w-full">
              <button
                onClick={() => navigate('/diagnosis')}
                className="flex-1 min-w-[160px] py-4 bg-amber-500 text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95"
              >
                분석 다시 시도하기
              </button>
              <button
                onClick={() => navigate('/analysis/dashboard')}
                className="flex-1 min-w-[160px] py-4 bg-surface-container-high text-on-surface-variant font-medium rounded-xl hover:bg-surface-variant transition-all active:scale-95"
              >
                기본 결과 보기
              </button>
            </div>
          </section>
        )}

        {/* 네트워크 오류 503 */}
        {showNetwork && (
          <section className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col justify-center items-start shadow-[0px_30px_60px_rgba(10,25,47,0.2)] relative overflow-hidden">
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold tracking-widest uppercase mb-6 border border-blue-500/30">
                Error Code 503
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold font-headline mb-6 tracking-tighter leading-tight">
                잠시 숨을 고르는<br />중입니다.
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mb-12 max-w-md leading-relaxed">
                현재 서버 연결이 원활하지 않습니다. 대규모 업데이트 중이거나 일시적인 네트워크 장애일 수 있습니다.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">home</span>
                  메인 화면으로 돌아가기
                </button>
                <p className="text-slate-500 text-sm pl-2">문제가 지속될 경우 고객센터로 문의해주세요.</p>
              </div>
            </div>
            <div className="absolute top-10 right-10 flex flex-col items-end gap-1 opacity-20">
              <div className="w-12 h-1 bg-white rounded-full" />
              <div className="w-8 h-1 bg-white rounded-full" />
              <div className="w-10 h-1 bg-white rounded-full" />
            </div>
          </section>
        )}
      </div>

      {/* 시스템 상태 푸터 */}
      <div className="mt-12 p-6 sm:p-8 bg-surface-container-low rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-sm font-medium text-on-surface-variant">일부 서비스(AI 진단)가 지연되고 있습니다.</span>
        </div>
        <div className="flex gap-6">
          <button className="text-sm text-secondary font-semibold hover:underline">실시간 시스템 현황</button>
          <button className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">도움말 보기</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
