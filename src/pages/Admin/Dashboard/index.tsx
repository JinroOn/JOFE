import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getUsers } from '../../../api/user';
import { getMajors } from '../../../api/major';
import type { UserResponse } from '../../../types/auth';

interface StatCardProps {
  label: string;
  value: string;
  badge: string;
  icon: string;
  footer: ReactNode;
}

const AVATAR_COLORS = [
  'bg-primary-fixed',
  'bg-secondary-fixed',
  'bg-tertiary-fixed',
  'bg-secondary-container',
];

const StatCard = ({ label, value, badge, icon, footer }: StatCardProps) => (
  <div className="bg-surface-container-lowest cloud-shadow rounded-2xl p-5 sm:p-8 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <span className="material-symbols-outlined text-7xl sm:text-8xl">{icon}</span>
    </div>
    <p className="text-on-primary-container text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3">{label}</p>
    <div className="flex items-end gap-2">
      <span className="text-4xl sm:text-5xl font-extrabold font-headline text-primary">{value}</span>
      <span className="text-secondary font-bold text-sm mb-1">{badge}</span>
    </div>
    {footer}
  </div>
);

const formatLastLogin = (lastLoginAt: string | null) => {
  if (!lastLoginAt) return '—';
  const diff = Date.now() - new Date(lastLoginAt).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
};

const getRoleBadge = (role: UserResponse['role']) =>
  role === 'admin'
    ? { label: '관리자', cls: 'bg-orange-100 text-orange-700' }
    : { label: '일반', cls: 'bg-blue-100 text-blue-700' };

const getStatusBadge = (status: string) => {
  if (status === 'active') return { label: '활성', cls: 'bg-green-100 text-green-700' };
  if (status === 'inactive') return { label: '비활성', cls: 'bg-surface-container-high text-on-surface-variant' };
  return { label: status, cls: 'bg-surface-container-high text-on-surface-variant' };
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [majorCount, setMajorCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUsers().catch(() => [] as UserResponse[]),
      getMajors().catch(() => []),
    ]).then(([userList, majorList]) => {
      setUsers(userList);
      setMajorCount(majorList.length);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      {/* 헤더 */}
      <div className="mb-8 sm:mb-12 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary font-headline tracking-tight mb-2">
            Admin Dashboard
          </h2>
          <p className="text-on-primary-container text-base sm:text-xl max-w-2xl">
            진로온 AI 핵심 성과 데이터 및 실시간 분석 현황입니다.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-secondary-container/10 px-4 py-2 rounded-full border border-secondary-container/20 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
          <span className="text-secondary text-xs sm:text-sm font-bold">AI Prediction Active</span>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-14">
        <StatCard
          label="전체 전공 수"
          value={majorCount !== null ? String(majorCount) : '—'}
          badge=""
          icon="school"
          footer={
            <div className="mt-4 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-3/4" />
            </div>
          }
        />
        <StatCard
          label="전체 사용자"
          value={users.length > 0 ? users.length.toLocaleString() : '—'}
          badge=""
          icon="group"
          footer={
            <div className="mt-4 flex gap-1.5">
              <div className="h-2 w-full bg-surface-container-high rounded-full" />
              <div className="h-2 w-full bg-surface-container-high rounded-full" />
              <div className="h-2 w-full bg-secondary-container rounded-full" />
            </div>
          }
        />
      </div>

      {/* 사용자 목록 테이블 */}
      <div className="bg-surface-container-lowest cloud-shadow rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-surface-container-high">
          <h3 className="text-xl sm:text-2xl font-bold font-headline text-primary">사용자 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-surface-container-low text-on-primary-container text-xs sm:text-sm uppercase tracking-wide">
                <th className="px-5 sm:px-8 py-4 font-semibold">사용자</th>
                <th className="px-5 sm:px-8 py-4 font-semibold">역할</th>
                <th className="hidden sm:table-cell px-5 sm:px-8 py-4 font-semibold">상태</th>
                <th className="px-5 sm:px-8 py-4 font-semibold">마지막 로그인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 sm:px-8 py-8 text-center text-sm text-on-surface-variant">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 sm:px-8 py-8 text-center text-sm text-on-surface-variant">
                    사용자가 없습니다.
                  </td>
                </tr>
              )}
              {users.map((user, i) => {
                const initials = (user.nickname ?? user.email).slice(0, 2).toUpperCase();
                const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const role = getRoleBadge(user.role);
                const status = getStatusBadge(user.status);
                return (
                  <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{user.nickname ?? '—'}</p>
                          <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${role.cls}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-5 sm:px-8 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 sm:px-8 py-4 text-on-primary-container text-sm whitespace-nowrap">
                      {formatLastLogin(user.lastLoginAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
