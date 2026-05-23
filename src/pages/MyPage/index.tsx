import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import ProfileEditModal from './components/ProfileEditModal';

const diagnosisHistory = [
  { month: 'APR', day: '15', title: 'IT/SW 융합 인재 역량 검사', tag: '정기검사', score: '적합도 92%', highlight: true, faded: false },
  { month: 'MAR', day: '22', title: '글로벌 비즈니스 적성 진단', tag: '모의검사', score: '적합도 76%', highlight: false, faded: false },
  { month: 'FEB', day: '10', title: '기초 직업 인성 검사', tag: '입문진단', score: '완료', highlight: false, faded: true },
];

const bookmarks = [
  { icon: 'data_object', name: '인공지능공학과', desc: '산업 현장의 문제 해결을 위한 실무 AI 기술 학습', rate: '89%', tag: '인기전공', tagColor: 'text-secondary font-bold' },
  { icon: 'psychology', name: '심리학과', desc: '인간의 마음과 행동을 과학적으로 분석하고 이해', rate: '74%', tag: '기초학문', tagColor: 'text-on-primary-container' },
];

const settingItems = [
  { icon: 'lock', label: '비밀번호 변경' },
  { icon: 'verified_user', label: '내 정보 공개 관리' },
];

const MyPage = () => {
  const { user } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);

  const displayName = user?.nickname ?? '김진로';
  const displayEmail = user?.email ?? 'jinro_kim@university.ac.kr';
  const initial = displayName[0];

  return (
    <div className="pt-16 pb-24 px-4 sm:px-8 max-w-[1280px] mx-auto">
      {/* Profile Hero */}
      <section className="mb-16 flex flex-col md:flex-row items-center md:items-end gap-8">
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white bg-secondary-container flex items-center justify-center">
            <span className="text-5xl font-extrabold text-white">{initial}</span>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container p-2.5 rounded-2xl shadow-lg hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
        </div>

        <div className="flex-grow text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-container mb-2 tracking-tight">
            {displayName} <span className="text-on-primary-container font-medium text-2xl">님</span>
          </h1>
          <p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-2">
            <span className="material-symbols-outlined text-base">mail</span>
            {displayEmail}
          </p>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="bg-white border border-outline-variant/30 text-on-surface px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          프로필 편집
        </button>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-secondary text-3xl mb-4 block">analytics</span>
            <p className="text-sm font-medium text-on-surface-variant mb-1">누적 진단 횟수</p>
            <h3 className="text-3xl font-extrabold">12<span className="text-lg font-normal ml-1">회</span></h3>
          </div>
          <div className="bg-white p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-on-tertiary-container text-3xl mb-4 block">star</span>
            <p className="text-sm font-medium text-on-surface-variant mb-1">관심 전공 수</p>
            <h3 className="text-3xl font-extrabold">8<span className="text-lg font-normal ml-1">개</span></h3>
          </div>
          <div className="bg-white p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-secondary text-3xl mb-4 block">event_available</span>
            <p className="text-sm font-medium text-on-surface-variant mb-1">마지막 진단일</p>
            <h3 className="text-xl font-bold mt-2">2024.04.15</h3>
          </div>
        </div>

        <div className="bg-primary-container text-white p-8 rounded-[14px] shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container opacity-10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <p className="text-xs font-bold text-on-primary-container tracking-widest uppercase">AI Insight</p>
            </div>
            <p className="text-lg font-medium leading-relaxed">
              {displayName}님은{' '}
              <span className="text-secondary-container font-bold underline underline-offset-4 text-xl italic">데이터 과학</span>{' '}
              분야에서 98%의 높은 적합도를 보이고 있습니다.
            </p>
          </div>
          <button className="mt-6 flex items-center gap-2 text-sm font-bold text-secondary-container group">
            추천 강의 보기
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Diagnosis History */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-container">이전 진단 기록</h2>
              <button className="text-sm font-bold text-secondary flex items-center gap-1">
                전체보기 <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            <div className="space-y-4">
              {diagnosisHistory.map(({ month, day, title, tag, score, highlight, faded }) => (
                <div key={title} className={`bg-white p-5 rounded-2xl hover:shadow-md transition-all flex items-center gap-6 ${faded ? 'opacity-70' : ''}`}>
                  <div className="text-center shrink-0 w-16">
                    <p className="text-xs text-on-surface-variant font-bold uppercase">{month}</p>
                    <p className="text-xl font-extrabold">{day}</p>
                  </div>
                  <div className="flex-grow">
                    <h5 className="font-bold text-on-surface mb-1">{title}</h5>
                    <div className="flex gap-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">{tag}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${highlight ? 'bg-secondary-container/20 text-secondary font-medium' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {score}
                      </span>
                    </div>
                  </div>
                  <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">download</button>
                </div>
              ))}
            </div>
          </section>

          {/* Bookmarks */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-container">관심 전공 즐겨찾기</h2>
              <button className="text-sm font-bold text-secondary flex items-center gap-1">
                편집 <span className="material-symbols-outlined text-sm">settings</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookmarks.map(({ icon, name, desc, rate, tag, tagColor }) => (
                <div key={name} className="bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-secondary-container transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                  </div>
                  <h5 className="font-bold text-lg mb-1">{name}</h5>
                  <p className="text-sm text-on-surface-variant mb-4">{desc}</p>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>취업률 {rate}</span>
                    <span className={tagColor}>{tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Account Settings */}
        <aside>
          <div className="bg-surface-container-low rounded-3xl p-8 sticky top-20">
            <h3 className="text-xl font-bold text-primary-container mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">manage_accounts</span> 계정 설정
            </h3>
            <div className="space-y-3">
              {settingItems.map(({ icon, label }) => (
                <button key={label} className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-50 transition-colors flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-on-surface-variant transition-colors">chevron_right</span>
                </button>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Danger Zone</p>
              <button className="w-full flex items-center gap-3 p-4 text-error/60 text-sm font-medium rounded-xl hover:text-error transition-colors">
                <span className="material-symbols-outlined text-sm">person_remove</span>
                회원 탈퇴
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showEditModal && <ProfileEditModal onClose={() => setShowEditModal(false)} />}
    </div>
  );
};

export default MyPage;
