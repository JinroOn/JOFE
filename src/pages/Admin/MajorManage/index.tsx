import { useEffect, useState } from 'react';
import type { Major } from '../../../types/major';
import { getMajors } from '../../../api/major';
import MajorFormModal from './components/MajorFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const DIFFICULTY_LABEL = {
  low: 'Low',
  mid: 'Mid',
  high: 'High',
} as const;

const DIFFICULTY_COLOR = {
  low: 'bg-surface-container text-on-surface-variant',
  mid: 'bg-secondary-container/20 text-secondary',
  high: 'bg-error-container/20 text-error',
} as const;

const AdminMajorManage = () => {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<
    Major | undefined
  >(undefined);

  const [deleteTarget, setDeleteTarget] = useState<
    Major | null
  >(null);

  useEffect(() => {
    let active = true;

    const loadMajors = async () => {
      try {
        const result = await getMajors();

        if (!active) return;

        setMajors(result);
        setLoadError(false);
      } catch {
        if (!active) return;

        setLoadError(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadMajors();

    return () => {
      active = false;
    };
  }, []);

  const handleSaved = (saved: Major) => {
    setMajors((previous) => {
      const index = previous.findIndex(
        (major) => major.id === saved.id,
      );

      return index >= 0
        ? previous.map((major) =>
            major.id === saved.id ? saved : major,
          )
        : [saved, ...previous];
    });

    setShowForm(false);
    setEditTarget(undefined);
  };

  const handleDeleted = (id: number) => {
    setMajors((previous) =>
      previous.filter((major) => major.id !== id),
    );

    setDeleteTarget(null);
  };

  const openEdit = (major: Major) => {
    setEditTarget(major);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(undefined);
  };

  // 실제 서버 전공 목록만 사용하여 통계를 계산합니다.
  const stats = [
    {
      label: 'Total Majors',
      value:
        loading || loadError
          ? '-'
          : String(majors.length),
      icon: 'account_balance',
    },
    {
      label: 'High Difficulty',
      value:
        loading || loadError
          ? '-'
          : String(
              majors.filter(
                (major) => major.difficulty === 'high',
              ).length,
            ),
      icon: 'polyline',
    },
    {
      label: 'Categories',
      value:
        loading || loadError
          ? '-'
          : String(
              new Set(
                majors
                  .map((major) => major.category)
                  .filter(Boolean),
              ).size,
            ),
      icon: 'category',
    },
  ];

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 relative">
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-secondary-container/5 blur-[120px] rounded-full -z-10" />

      <div className="fixed -top-24 -right-24 w-96 h-96 bg-tertiary-fixed-dim/5 blur-[120px] rounded-full -z-10" />

      {/* 실제 전공 데이터를 기반으로 한 통계 카드 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {stats.map(({ label, value, icon }) => (
          <div
            key={label}
            className="p-5 sm:p-8 rounded-2xl cloud-shadow relative overflow-hidden group bg-surface-container-lowest"
          >
            <div className="relative z-10">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 text-on-surface-variant">
                {label}
              </p>

              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                {value}
              </p>
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110">
              <span className="material-symbols-outlined text-7xl sm:text-8xl">
                {icon}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* 전공 조회 실패 안내 */}
      {loadError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-error/30 bg-error-container/20 px-5 py-4 text-sm font-semibold text-error"
        >
          전공 목록을 불러오지 못했습니다.
          페이지를 새로고침한 뒤 다시 확인해 주세요.
        </div>
      )}

      {/* 전공 관리 테이블 */}
      <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden mb-8">
        <div className="px-5 sm:px-8 py-5 sm:py-7 flex flex-wrap justify-between items-center gap-3 bg-white border-b border-surface-container-high">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-on-surface">
              전공 핵심 역량 데이터베이스
            </h3>

            <p className="text-sm text-on-primary-container mt-1">
              AI 진로 매칭을 위한 전공별 핵심 역량 벡터 및
              직무 연결성 관리
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditTarget(undefined);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">
              add
            </span>

            전공 추가
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant">
                progress_activity
              </span>
            </div>
          ) : loadError ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block">
                error
              </span>

              <p className="text-sm font-medium">
                전공 목록을 표시할 수 없습니다.
              </p>
            </div>
          ) : majors.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block">
                school
              </span>

              <p className="text-sm font-medium">
                등록된 전공이 없습니다.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="text-xs font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4">
                    전공 명칭
                  </th>

                  <th className="text-xs font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4">
                    카테고리
                  </th>

                  <th className="text-xs font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4">
                    난이도
                  </th>

                  <th className="hidden sm:table-cell text-xs font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4">
                    역량 (수리·논리)
                  </th>

                  <th className="text-xs font-bold text-on-primary-container uppercase tracking-wide px-5 sm:px-8 py-4">
                    관리
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-surface-container-high">
                {majors.map((major) => (
                  <tr
                    key={major.id}
                    className="hover:bg-surface-container-low/30 transition-colors"
                  >
                    <td className="py-5 px-5 sm:px-8">
                      <p className="font-bold text-on-surface">
                        {major.name}
                      </p>

                      {major.description && (
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1 max-w-[200px]">
                          {major.description}
                        </p>
                      )}
                    </td>

                    <td className="py-5 px-5 sm:px-8 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-surface-container text-on-surface-variant">
                        {major.category ?? '-'}
                      </span>
                    </td>

                    <td className="py-5 px-5 sm:px-8 whitespace-nowrap">
                      {major.difficulty ? (
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${DIFFICULTY_COLOR[major.difficulty]}`}
                        >
                          {
                            DIFFICULTY_LABEL[
                              major.difficulty
                            ]
                          }
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="hidden sm:table-cell py-5 px-5 sm:px-8">
                      <div className="w-40">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>수리·논리</span>

                          <span>
                            {major.reqMathLogic ?? '-'}
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                          {major.reqMathLogic !== null && (
                            <div
                              className="h-full bg-secondary-container rounded-full"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    major.reqMathLogic,
                                    0,
                                  ),
                                  100,
                                )}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-5 px-5 sm:px-8">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(major)}
                          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                          title="수정"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                            edit
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget(major)
                          }
                          className="p-1.5 rounded-lg hover:bg-error-container/20 transition-colors"
                          title="삭제"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error/60">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !loadError && majors.length > 0 && (
          <div className="px-5 sm:px-8 py-4 bg-surface-container-low/30 border-t border-surface-container-high">
            <p className="text-xs text-on-surface-variant">
              총 {majors.length}개
            </p>
          </div>
        )}
      </div>

      {/* 전공 추가·수정 모달 */}
      {showForm && (
        <MajorFormModal
          major={editTarget}
          onClose={closeForm}
          onSave={handleSaved}
        />
      )}

      {/* 전공 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          major={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default AdminMajorManage;