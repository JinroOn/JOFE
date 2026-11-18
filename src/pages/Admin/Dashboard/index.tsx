import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getUsers } from '../../../api/user';
import { getMajors } from '../../../api/major';
import type { UserResponse } from '../../../types/auth';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  footer: ReactNode;
}

const AVATAR_COLORS = [
  'bg-primary-fixed',
  'bg-secondary-fixed',
  'bg-tertiary-fixed',
  'bg-secondary-container',
];

const StatCard = ({
  label,
  value,
  icon,
  footer,
}: StatCardProps) => (
  <div className="bg-surface-container-lowest cloud-shadow rounded-2xl p-5 sm:p-8 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <span className="material-symbols-outlined text-7xl sm:text-8xl">
        {icon}
      </span>
    </div>

    <p className="relative text-on-primary-container text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3">
      {label}
    </p>

    <div className="relative flex items-end gap-2">
      <span className="text-4xl sm:text-5xl font-extrabold font-headline text-primary">
        {value}
      </span>
    </div>

    <div className="relative">{footer}</div>
  </div>
);

const formatLastLogin = (lastLoginAt: string | null) => {
  if (!lastLoginAt) return '—';

  const diff = Date.now() - new Date(lastLoginAt).getTime();

  if (!Number.isFinite(diff)) return '—';

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
    ? {
        label: '관리자',
        cls: 'bg-orange-100 text-orange-700',
      }
    : {
        label: '일반',
        cls: 'bg-blue-100 text-blue-700',
      };

const getStatusBadge = (status: string) => {
  if (status === 'active') {
    return {
      label: '활성',
      cls: 'bg-green-100 text-green-700',
    };
  }

  if (status === 'inactive') {
    return {
      label: '비활성',
      cls: 'bg-surface-container-high text-on-surface-variant',
    };
  }

  return {
    label: status,
    cls: 'bg-surface-container-high text-on-surface-variant',
  };
};

const AdminDashboard = () => {
  // null: API 조회 실패 또는 아직 조회하지 않은 상태
  // []: API 조회 성공, 사용자 0명
  const [users, setUsers] = useState<UserResponse[] | null>(null);
  const [majorCount, setMajorCount] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      const [usersResult, majorsResult] = await Promise.allSettled([
        getUsers(),
        getMajors(),
      ]);

      if (!active) return;

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      } else {
        setUsers(null);
      }

      if (majorsResult.status === 'fulfilled') {
        setMajorCount(majorsResult.value.length);
      } else {
        setMajorCount(null);
      }

      setLoading(false);
    };

    void fetchDashboardData();

    return () => {
      active = false;
    };
  }, []);

  const userCountText = loading
    ? '—'
    : users === null
      ? '—'
      : users.length.toLocaleString();

  const majorCountText = loading
    ? '—'
    : majorCount === null
      ? '—'
      : majorCount.toLocaleString();

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      {/* 관리자 대시보드 헤더 */}
      <div className="mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary font-headline tracking-tight mb-2">
          Admin Dashboard
        </h2>

        <p className="text-on-primary-container text-base sm:text-xl max-w-2xl">
          등록된 전공과 사용자 현황을 확인할 수 있습니다.
        </p>

        {/* 고정된 AI Prediction Active 표시 제거 */}
      </div>

      {/* 실제 API 결과로 계산한 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-14">
        <StatCard
          label="전체 전공 수"
          value={majorCountText}
          icon="school"
          footer={
            <p className="mt-4 text-xs text-on-surface-variant">
              {loading
                ? '전공 목록을 불러오는 중입니다.'
                : majorCount === null
                  ? '전공 목록을 불러오지 못했습니다.'
                  : '등록된 전공 목록 기준'}
            </p>
          }
        />

        <StatCard
          label="전체 사용자"
          value={userCountText}
          icon="group"
          footer={
            <p className="mt-4 text-xs text-on-surface-variant">
              {loading
                ? '사용자 목록을 불러오는 중입니다.'
                : users === null
                  ? '사용자 목록을 불러오지 못했습니다.'
                  : '등록된 사용자 목록 기준'}
            </p>
          }
        />
      </div>

      {/* 사용자 목록 테이블 */}
      <div className="bg-surface-container-lowest cloud-shadow rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-surface-container-high">
          <h3 className="text-xl sm:text-2xl font-bold font-headline text-primary">
            사용자 목록
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-surface-container-low text-on-primary-container text-xs sm:text-sm uppercase tracking-wide">
                <th className="px-5 sm:px-8 py-4 font-semibold">
                  사용자
                </th>

                <th className="px-5 sm:px-8 py-4 font-semibold">
                  역할
                </th>

                <th className="hidden sm:table-cell px-5 sm:px-8 py-4 font-semibold">
                  상태
                </th>

                <th className="px-5 sm:px-8 py-4 font-semibold">
                  마지막 로그인
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-container-high">
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 sm:px-8 py-8 text-center text-sm text-on-surface-variant"
                  >
                    불러오는 중...
                  </td>
                </tr>
              )}

              {!loading && users === null && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 sm:px-8 py-8 text-center text-sm text-on-surface-variant"
                  >
                    사용자 목록을 불러오지 못했습니다.
                  </td>
                </tr>
              )}

              {!loading && users?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 sm:px-8 py-8 text-center text-sm text-on-surface-variant"
                  >
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
              )}

              {!loading &&
                users?.map((user, index) => {
                  const initials = (
                    user.nickname ?? user.email
                  )
                    .slice(0, 2)
                    .toUpperCase();

                  const avatarBg =
                    AVATAR_COLORS[index % AVATAR_COLORS.length];

                  const role = getRoleBadge(user.role);
                  const status = getStatusBadge(user.status);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold shrink-0`}
                          >
                            {initials}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">
                              {user.nickname ?? '—'}
                            </p>

                            <p className="text-xs text-on-surface-variant truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 sm:px-8 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${role.cls}`}
                        >
                          {role.label}
                        </span>
                      </td>

                      <td className="hidden sm:table-cell px-5 sm:px-8 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${status.cls}`}
                        >
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