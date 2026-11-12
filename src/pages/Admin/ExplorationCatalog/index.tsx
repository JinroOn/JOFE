import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExplorationCatalogs } from '../../../api/explorationAdmin';
import type { CatalogSummary, CatalogType } from '../../../types/explorationAdmin';
import CatalogActions from './components/CatalogActions';
import StatusBadge from './components/StatusBadge';

const TYPE_LABEL: Record<CatalogType, { text: string; desc: string }> = {
  QUESTION_CATALOG: { text: '문항', desc: '질문 문구와 단계·모듈' },
  OPTION_CATALOG: { text: '선택지', desc: '문항별 선택지와 비교 선택지' },
  MAJOR_MAPPING: { text: '전공 매핑', desc: '전공과 흥미·활동·학습 연결' },
  RULESET: { text: '추천·분기 규칙', desc: '가중치·임계값·출제 규칙' },
};
const TYPES = Object.keys(TYPE_LABEL) as CatalogType[];

const EXTERNAL_LABEL: Record<string, string> = {
  APPROVED_FOR_IMPLEMENTATION: '구현 승인',
  DOMAIN_REVIEW_PENDING: '전문가 검토 대기',
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const ExplorationCatalog = () => {
  const [catalogs, setCatalogs] = useState<CatalogSummary[] | null>(null);
  const [error, setError] = useState(false);

  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    getExplorationCatalogs()
      .then((res) => {
        if (!alive) return;
        setCatalogs(res);
        setError(false);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [version]);

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-primary font-headline tracking-tight mb-1">진단 카탈로그</h2>
        <p className="text-on-primary-container text-sm">
          탐색형 진단의 문항·선택지·전공 매핑·규칙을 버전 단위로 관리해요.
        </p>
      </div>

      <div className="rounded-[14px] bg-surface-container-low px-5 py-4 mb-8 text-sm text-on-surface-variant leading-relaxed">
        <p className="font-semibold text-primary mb-1">이 화면에서는 문항을 직접 고치지 않아요</p>
        <p>
          문구를 고치거나 문항을 바꾸려면 새 버전 카탈로그로 적재해요. 작성 중 → 다른 관리자 검토 → 사용 순서로 바뀌고,
          사용을 시작해도 이미 시작한 검사는 시작할 때의 버전을 그대로 써요.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container mb-6">
          카탈로그 목록을 불러오지 못했어요.{' '}
          <button type="button" onClick={load} className="font-bold underline">다시 시도</button>
        </div>
      )}
      {!error && !catalogs && <p role="status" className="text-sm text-on-surface-variant">불러오는 중…</p>}

      {catalogs && (
        <div className="space-y-8">
          {TYPES.map((type) => {
            const items = catalogs
              .filter((c) => c.catalogType === type)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (items.length === 0) return null;
            return (
              <section key={type} aria-labelledby={`type-${type}`}>
                <h3 id={`type-${type}`} className="text-lg font-bold text-primary">
                  {TYPE_LABEL[type].text}
                  <span className="ml-2 text-sm font-normal text-on-surface-variant">{TYPE_LABEL[type].desc}</span>
                </h3>
                <div className="mt-3 bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[760px] text-sm">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/10 text-xs text-on-surface-variant">
                          <th className="px-5 py-3 text-left font-bold">버전</th>
                          <th className="px-5 py-3 text-center font-bold">상태</th>
                          <th className="px-5 py-3 text-left font-bold">작성·검토</th>
                          <th className="px-5 py-3 text-left font-bold">외부 검토</th>
                          <th className="px-5 py-3 text-left font-bold">만든 날·사용 시작</th>
                          <th className="px-5 py-3 text-left font-bold w-[260px]">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {items.map((c) => (
                          <tr key={c.catalogId} className="align-top">
                            <td className="px-5 py-4">
                              <Link to={`/admin/exploration-catalogs/${c.catalogId}`} className="font-semibold text-secondary hover:underline break-all">
                                {c.version}
                              </Link>
                              <p className="text-xs text-on-surface-variant mt-1">
                                항목 {c.itemCount}개 · 해시 <code>{c.contentHash.slice(0, 8)}</code>
                              </p>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              <p>작성 {c.author}</p>
                              <p>검토 {c.reviewer ?? '-'}</p>
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              {c.externalReviewStatus ? EXTERNAL_LABEL[c.externalReviewStatus] : '-'}
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              <p>{formatDate(c.createdAt)}</p>
                              <p>{c.activatedAt ? `사용 ${formatDate(c.activatedAt)}` : ''}</p>
                            </td>
                            <td className="px-5 py-4">
                              <CatalogActions catalog={c} onChanged={load} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExplorationCatalog;
