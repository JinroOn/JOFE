import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedExplorationResult } from '../../../api/exploration';
import type { SharedExplorationResult } from '../../../types/exploration';

const formatDate = (iso: string) => {
  const d = new Date(iso);

  return Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

// 로그인 없이 여는 공개 결과
const SharedExploration = () => {
  const { token } = useParams();

  const [data, setData] =
    useState<SharedExplorationResult | null>(null);

  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!token) return;

    let alive = true;

    getSharedExplorationResult(token)
      .then((res) => {
        if (alive) {
          setData(res);
        }
      })
      .catch(() => {
        if (alive) {
          setMissing(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[880px] w-full mx-auto px-4 sm:px-8 pt-10 pb-24">

        {(missing || !token) && (
          <div className="rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-8 text-center">
            <h1 className="text-xl font-bold text-primary-container mb-2">
              볼 수 없는 링크예요
            </h1>

            <p className="text-sm text-on-surface-variant mb-6">
              만료되었거나 공유한 사람이 공유를 껐어요.
            </p>

            <Link
              to="/diagnosis/exploration"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-primary-container px-6 text-white font-bold"
            >
              나도 전공 탐색해보기
            </Link>
          </div>
        )}

        {!missing && token && !data && (
          <p
            role="status"
            className="text-sm text-on-surface-variant"
          >
            결과를 불러오는 중이에요…
          </p>
        )}

        {data && (
          <>
            <header className="mb-8">
              <p className="text-xs text-on-surface-variant mb-2">
                {data.nickname
                  ? `${data.nickname}님이 공유한 전공 탐색 결과`
                  : '공유된 전공 탐색 결과'}

                {data.completedAt &&
                  ` · ${formatDate(data.completedAt)} 완료`}
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-primary-container leading-snug">
                {data.groups.length > 0
                  ? '먼저 탐색해볼 수 있는 전공이에요'
                  : data.uncertainty?.noSupportedCandidate
                    ? '현재 응답으로는 추천할 전공 후보가 없어요'
                    : '공유된 탐색 결과를 확인해보세요'}
              </h1>

              <p className="text-sm text-on-surface-variant mt-2">
                검사 응답을 바탕으로 먼저 살펴볼 방향을 정리한 결과예요.
                능력이나 적성을 판정한 결과가 아니에요.
              </p>
            </header>

            {(data.notes?.length ?? 0) > 0 ||
              data.uncertainty?.message ? (
              <div
                role="note"
                className="rounded-brand bg-secondary-container/15 px-5 py-4 mb-8 text-sm text-primary-container space-y-1"
              >
                {data.notes?.map((note) => (
                  <p key={note}>{note}</p>
                ))}

                {data.uncertainty?.message && (
                  <p>{data.uncertainty.message}</p>
                )}
              </div>
            ) : null}

            {data.groups.length > 0 && (
              <section
                aria-label="탐색 전공군"
                className="space-y-4 mb-10"
              >
                {data.groups.map((group) => (
                  <div
                    key={group.groupCode ?? group.name}
                    className="rounded-brand bg-surface-container-low p-5"
                  >
                    <h2 className="text-lg font-bold text-primary-container">
                      {group.name}
                    </h2>

                    <p className="text-sm text-on-surface-variant mb-3">
                      {group.summary}
                    </p>

                    <ul className="space-y-2">
                      {group.majors.map((major) => (
                        <li
                          key={major.name}
                          className="rounded-lg bg-surface-container-lowest px-4 py-3"
                        >
                          <p className="font-semibold text-primary-container">
                            {major.name}
                          </p>

                          {major.reason && (
                            <p className="text-sm text-on-surface-variant">
                              {major.reason}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {(data.activities?.length ?? 0) > 0 && (
              <section
                aria-labelledby="shared-activities"
                className="mb-10"
              >
                <h2
                  id="shared-activities"
                  className="text-lg font-bold text-primary-container mb-3"
                >
                  해보려는 탐색 활동
                </h2>

                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.activities?.map((activity) => (
                    <li
                      key={activity.title}
                      className="rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-4"
                    >
                      <p className="text-xs font-bold text-secondary mb-1">
                        {activity.duration}
                      </p>

                      <p className="font-semibold text-primary-container">
                        {activity.title}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(data.nextSteps?.length ?? 0) > 0 && (
              <section
                aria-labelledby="shared-next-steps"
                className="mb-10"
              >
                <h2
                  id="shared-next-steps"
                  className="text-lg font-bold text-primary-container mb-3"
                >
                  다음으로 확인해볼 내용
                </h2>

                <ul className="space-y-2">
                  {data.nextSteps?.map((step, index) => (
                    <li
                      key={`${index}-${step}`}
                      className="rounded-brand bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant"
                    >
                      {step}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="rounded-brand bg-surface-container-low p-5 text-center">
              <p className="text-sm text-on-surface-variant mb-3">
                나는 어떤 전공부터 탐색해보면 좋을까?
              </p>

              <Link
                to="/diagnosis/exploration"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary-container px-6 text-white font-bold"
              >
                나도 전공 탐색해보기
              </Link>

              <p className="mt-4 text-[11px] text-on-surface-variant">
                이 링크는 {formatDate(data.expiresAt)}까지 열려 있어요.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedExploration;
