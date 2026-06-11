import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import ProfileEditModal from './components/ProfileEditModal';
import PasswordChangeModal from './components/PasswordChangeModal';
import { getFavorites, deleteFavorite, deleteMe } from '../../api/user';
import { getMajor } from '../../api/major';
import { getDiagnosisResults } from '../../api/results';
import type { Major } from '../../types/major';

interface FavoriteItem {
  id: number;
  majorId: number;
  createdAt: string;
  major: Major | null;
}

const MyPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [diagnosisCount, setDiagnosisCount] = useState<number | null>(null);
  const [lastDiagnosisDate, setLastDiagnosisDate] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(false);

  const displayName = user?.nickname ?? '';
  const displayEmail = user?.email ?? '';
  const initial = displayName[0] ?? '?';
  const avatarUrl = user?.profileImageUrl ?? null;

  useEffect(() => {
    const load = async () => {
      const [list, results] = await Promise.allSettled([getFavorites(), getDiagnosisResults()]);

      if (list.status === 'fulfilled') {
        const items = await Promise.all(
          list.value.map(async (f) => {
            try {
              const major = await getMajor(f.majorId);
              return { id: f.id, majorId: f.majorId, createdAt: f.createdAt, major };
            } catch {
              return { id: f.id, majorId: f.majorId, createdAt: f.createdAt, major: null };
            }
          })
        );
        setFavorites(items);
      }
      setFavoritesLoading(false);

      if (results.status === 'fulfilled' && results.value.length > 0) {
        setDiagnosisCount(results.value.length);
        const latest = results.value.reduce((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? a : b
        );
        setLastDiagnosisDate(
          new Date(latest.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
        );
      } else {
        setDiagnosisCount(0);
      }
    };
    load();
  }, []);

  const handleDeleteFavorite = async (favoriteId: number) => {
    setDeletingId(favoriteId);
    try {
      await deleteFavorite(favoriteId);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawError(false);
    try {
      await deleteMe();
      logout();
      navigate('/');
    } catch {
      setWithdrawError(true);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="pt-16 pb-24 px-4 sm:px-8 max-w-[1280px] mx-auto">
      {/* Profile Hero */}
      <section className="mb-16 flex flex-col md:flex-row items-center md:items-end gap-8">
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white bg-secondary-container flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-extrabold text-white">{initial}</span>
            )}
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
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-secondary text-3xl mb-4 block">analytics</span>
            <p className="text-sm font-medium text-on-surface-variant mb-1">누적 진단 횟수</p>
            <h3 className="text-3xl font-extrabold">
              {diagnosisCount ?? '-'}
              <span className="text-lg font-normal ml-1">회</span>
            </h3>
          </div>
          <div className="bg-white p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-on-tertiary-container text-3xl mb-4 block">star</span>
            <p className="text-sm font-medium text-on-surface-variant mb-1">관심 전공 수</p>
            <h3 className="text-3xl font-extrabold">
              {favoritesLoading ? '-' : favorites.length}
              <span className="text-lg font-normal ml-1">개</span>
            </h3>
          </div>
          <div className="bg-white p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-secondary text-3xl mb-4 block">event_available</span>
            <p className="text-sm font-medium text-on-surface-variant mb-1">마지막 진단일</p>
            <h3 className="text-xl font-bold mt-2">{lastDiagnosisDate ?? '-'}</h3>
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
              {displayName}님의 진단 결과를 바탕으로 맞춤형 전공을 추천해드립니다.
            </p>
          </div>
          <button
            onClick={() => navigate('/diagnosis')}
            className="mt-6 flex items-center gap-2 text-sm font-bold text-secondary-container group"
          >
            진단 시작하기
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Bookmarks */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-container">관심 전공 즐겨찾기</h2>
            </div>

            {favoritesLoading && (
              <div className="flex justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant">progress_activity</span>
              </div>
            )}

            {!favoritesLoading && favorites.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block text-outline">bookmark</span>
                <p className="font-medium">즐겨찾기한 전공이 없습니다.</p>
                <button
                  onClick={() => navigate('/diagnosis/explore')}
                  className="mt-4 text-sm font-bold text-secondary"
                >
                  전공 탐색하러 가기 →
                </button>
              </div>
            )}

            {!favoritesLoading && favorites.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.map(({ id, major }) => (
                  <div key={id} className="bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-secondary-container transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined">school</span>
                      </div>
                      <button
                        onClick={() => handleDeleteFavorite(id)}
                        disabled={deletingId === id}
                        className="p-1 rounded-lg hover:bg-error-container/20 transition-colors disabled:opacity-40"
                        title="즐겨찾기 삭제"
                      >
                        <span
                          className="material-symbols-outlined text-secondary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {deletingId === id ? 'hourglass_empty' : 'bookmark'}
                        </span>
                      </button>
                    </div>
                    <h5 className="font-bold text-lg mb-1">{major?.name ?? `전공 #${id}`}</h5>
                    <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
                      {major?.description ?? ''}
                    </p>
                    {major?.category && (
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {major.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Account Settings */}
        <aside>
          <div className="bg-surface-container-low rounded-3xl p-8 sticky top-20">
            <h3 className="text-xl font-bold text-primary-container mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">manage_accounts</span> 계정 설정
            </h3>
            <div className="space-y-3">
              {[
                { icon: 'person', label: '프로필 편집', onClick: () => setShowEditModal(true) },
                { icon: 'lock', label: '비밀번호 변경', onClick: () => setShowPasswordModal(true) },
              ].map(({ icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-50 transition-colors flex items-center justify-between group shadow-sm"
                >
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
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 p-4 text-error/60 text-sm font-medium rounded-xl hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-sm">person_remove</span>
                회원 탈퇴
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showEditModal && (
        <ProfileEditModal onClose={() => setShowEditModal(false)} />
      )}
      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-2xl">person_remove</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">회원 탈퇴</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?
            </p>
            {withdrawError && (
              <p className="text-sm text-error font-medium mb-4">탈퇴 처리 중 오류가 발생했습니다.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-lg border border-outline-variant/30 font-bold hover:bg-surface-container-low transition-all"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 py-3 rounded-lg bg-error text-white font-bold hover:bg-error/90 transition-all disabled:opacity-50"
              >
                {withdrawing ? '처리 중...' : '탈퇴'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
