import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getExplorationCatalogActivity } from '../../../../api/explorationAdmin';

import type { CatalogActivityContent, CatalogActivityDetail } from '../../../../types/explorationAdmin';

import CatalogActions from '../components/CatalogActions';
import ReviewHistory from '../components/ReviewHistory';
import StatusBadge from '../components/StatusBadge';
import {
  ACTIVITY_KIND_LABEL,
  ACTIVITY_REVIEW_STATE_LABEL,
  activityReviewState,
  reviewStatusLabel,
} from '../components/adminLabels';

type LoadState =
  | { key: string; status: 'success'; detail: CatalogActivityDetail }
  | { key: string; status: 'error'; notFound: boolean };

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mb-8">
    <h3 className="text-base font-bold text-primary mb-2">{title}</h3>
    <div className="text-sm leading-7 text-on-surface">{children}</div>
  </section>
);

const durationText = (value: CatalogActivityContent['duration_minutes_proposal']) => {
  if (!value || (value.min == null && value.max == null)) return null;
  const range = value.min != null && value.max != null && value.min !== value.max ? `${value.min}~${value.max}분` : `${value.min ?? value.max}분`;
  return value.measured ? range : `${range} (제안값, 실제 수행 시간 미측정)`;
};

const requirementText = (value: CatalogActivityContent['requirements']) => {
  if (!value) return [];
  const lines: string[] = [];
  if (value.materials?.length) lines.push(`준비물: ${value.materials.join(', ')}`);
  lines.push(value.paid_tools ? '유료 도구 필요' : '유료 도구 불필요');
  lines.push(value.external_account ? '외부 계정 필요' : '외부 계정 불필요');
  lines.push(value.coding_experience ? '코딩 경험 필요' : '코딩 경험 불필요');
  return lines;
};

// 활동 한 건을 검토하는 화면. 백엔드 원본(payload_json)을 그대로 보여주고, 추천 결과에 쓰이는지는 검토 상태로만 안내한다
const ExplorationCatalogActivityDetail = () => {
  const { catalogId, activityId } = useParams();
  const catalog = Number(catalogId);
  const activity = Number(activityId);
  const invalid = !Number.isSafeInteger(catalog) || catalog <= 0 || !Number.isSafeInteger(activity) || activity <= 0;

  const [loaded, setLoaded] = useState<LoadState | null>(null);
  const [version, setVersion] = useState(0);
  const key = `${catalog}:${activity}:${version}`;

  useEffect(() => {
    if (invalid) return;
    let alive = true;
    getExplorationCatalogActivity(catalog, activity)
      .then((detail) => {
        if (alive) setLoaded({ key, status: 'success', detail });
      })
      .catch((e: unknown) => {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (alive) setLoaded({ key, status: 'error', notFound: status === 404 });
      });
    return () => {
      alive = false;
    };
  }, [activity, catalog, invalid, key]);

  const current = loaded?.key === key ? loaded : null;
  const detail = current?.status === 'success' ? current.detail : null;
  const reload = () => setVersion((value) => value + 1);

  const backTo = `/admin/exploration-catalogs/${catalogId}?targetType=ACTIVITY_CATALOG`;

  const summary = detail?.activity;
  const content = detail?.content ?? {};
  const reviewState = summary ? activityReviewState(summary) : null;
  const archived = summary?.contentStatus === 'ARCHIVED';
  const duration = durationText(content.duration_minutes_proposal);
  const requirements = requirementText(content.requirements);

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      <Link to={backTo} className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-secondary mb-5">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          arrow_back
        </span>
        활동 카탈로그
      </Link>

      {invalid && (
        <div role="alert" className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container">
          활동 식별자 정보가 올바르지 않습니다.
        </div>
      )}

      {!invalid && !current && (
        <p role="status" className="text-sm text-on-surface-variant">
          활동을 불러오는 중...
        </p>
      )}

      {current?.status === 'error' && (
        <div role="alert" className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container">
          {current.notFound ? '이 카탈로그에서 해당 활동을 찾을 수 없습니다.' : '활동 정보를 불러오지 못했습니다.'}{' '}
          {!current.notFound && (
            <button type="button" onClick={reload} className="font-bold underline">
              다시 시도
            </button>
          )}
        </div>
      )}

      {summary && detail && reviewState && (
        <>
          <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-on-surface-variant">
                {summary.activityCode} · v{summary.version}
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-primary font-headline tracking-tight break-keep">
                {summary.title ?? content.title ?? summary.activityCode}
              </h2>

              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <StatusBadge status={summary.contentStatus} />
                <span>{summary.kind ? (ACTIVITY_KIND_LABEL[summary.kind] ?? summary.kind) : '종류 미지정'}</span>
                <span>·</span>
                <span>
                  {summary.majorCode
                    ? `${typeof content.major_name === 'string' ? content.major_name : '전공'} (${summary.majorCode})`
                    : '공통 활동'}
                </span>
              </p>

              <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                <p>
                  대상 ID: {summary.targetType} / {summary.targetId}
                </p>
                <p className="break-all">
                  내용 해시: <code>{summary.contentHash}</code>
                </p>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <p>구현 검토: {reviewStatusLabel(summary.implementationReviewStatus)}</p>
                <p>내용 검토: {reviewStatusLabel(summary.domainReviewStatus)}</p>
                <p className={reviewState === 'APPROVED' ? 'font-bold text-secondary' : 'text-on-surface-variant'}>
                  {ACTIVITY_REVIEW_STATE_LABEL[reviewState]}
                  {reviewState === 'APPROVED'
                    ? ' — 활동 카탈로그도 승인돼 있으면 추천에 쓰일 수 있습니다.'
                    : ' — 아직 추천에 쓰이지 않습니다.'}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-[340px]">
              <CatalogActions
                catalog={{
                  targetType: 'ACTIVITY',
                  targetId: summary.targetId,
                  allowedActions: archived ? [] : ['REVIEW'],
                  blockedReasons: archived ? { REVIEW: 'CATALOG_REVIEW_ARCHIVED' } : {},
                }}
                onChanged={reload}
              />
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                활동 한 건은 검토만 기록합니다. 사용 시작·보관은 활동 카탈로그 단위로 합니다. 추천에는 DEV 범위의 구현
                검토와 내용 검토가 쓰입니다.
              </p>
            </div>
          </div>

          {typeof content.purpose === 'string' && <Section title="목적">{content.purpose}</Section>}

          {Array.isArray(content.steps) && content.steps.length > 0 && (
            <Section title="진행 단계">
              <ol className="list-decimal space-y-1 pl-5">
                {content.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </Section>
          )}

          {Array.isArray(content.artifacts) && content.artifacts.length > 0 && (
            <Section title="결과물">{content.artifacts.join(', ')}</Section>
          )}

          {(duration || requirements.length > 0) && (
            <Section title="시간·준비">
              <ul className="list-disc space-y-1 pl-5">
                {duration && <li>예상 시간: {duration}</li>}
                {requirements.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Section>
          )}

          {typeof content.alternative === 'string' && <Section title="대체 방법">{content.alternative}</Section>}

          {typeof content.safety_boundary === 'string' && (
            <Section title="안전·개인정보 경계">{content.safety_boundary}</Section>
          )}

          {Array.isArray(content.sources) && content.sources.length > 0 && (
            <Section title={`출처 ${content.sources.length}개`}>
              <ul className="space-y-3">
                {content.sources.map((source, index) => (
                  <li key={source.source_id ?? index} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4">
                    <p className="font-semibold">
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-secondary underline-offset-2 hover:underline break-all">
                          {source.title ?? source.url}
                        </a>
                      ) : (
                        (source.title ?? source.source_id)
                      )}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {[source.publisher, source.source_id, source.role, source.checked_on && `확인일 ${source.checked_on}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {source.verified_claim && <p className="mt-1 text-xs">확인한 내용: {source.verified_claim}</p>}
                    {source.application && <p className="mt-1 text-xs text-on-surface-variant">쓰는 범위: {source.application}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {typeof content.body_markdown === 'string' && (
            <Section title="활동 본문 (원문)">
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-surface-container-low p-4 font-sans text-sm leading-7">
                {content.body_markdown}
              </pre>
            </Section>
          )}

          {typeof content.worksheet_markdown === 'string' && (
            <details className="mb-8">
              <summary className="cursor-pointer min-h-[40px] flex items-center text-base font-bold text-primary">
                활동지·가상 결과물 예시 (원문)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-surface-container-low p-4 font-sans text-sm leading-7">
                {content.worksheet_markdown}
              </pre>
            </details>
          )}

          <Section title="사용 범위">
            <ul className="list-disc space-y-1 pl-5">
              <li>원본 사용 표시: {typeof content.allowed_use === 'string' ? content.allowed_use : '-'}</li>
              <li>
                추천 점수 영향:{' '}
                {content.score_effect === 'NONE' ? '없음 (활동은 원본 전공 추천을 바꾸지 않음)' : (content.score_effect ?? '-')}
              </li>
            </ul>
          </Section>

          <ReviewHistory reviews={detail.reviews} />
        </>
      )}
    </div>
  );
};

export default ExplorationCatalogActivityDetail;
