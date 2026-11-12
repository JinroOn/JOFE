import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getExplorationCatalog } from '../../../../api/explorationAdmin';
import type { CatalogDetail, CatalogQuestion } from '../../../../types/explorationAdmin';
import CatalogActions from '../components/CatalogActions';
import StatusBadge from '../components/StatusBadge';

const STAGE_LABEL: Record<CatalogQuestion['stage'], string> = {
  STAGE_1: '1단계',
  STAGE_2: '2단계',
  STAGE_3: '3단계',
  POST_RESULT: '결과 후',
};

const ExplorationCatalogDetail = () => {
  const { catalogId } = useParams();
  const id = Number(catalogId);
  const [catalog, setCatalog] = useState<CatalogDetail | null>(null);
  const [error, setError] = useState(false);
  const [stage, setStage] = useState<string>('ALL');
  const [moduleCode, setModuleCode] = useState<string>('ALL');
  const [query, setQuery] = useState('');

  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    getExplorationCatalog(id)
      .then((res) => {
        if (!alive) return;
        setCatalog(res);
        setError(false);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [id, version]);

  const modules = useMemo(
    () => [...new Set((catalog?.questions ?? []).map((q) => q.moduleCode))].sort(),
    [catalog],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (catalog?.questions ?? []).filter(
      (item) =>
        (stage === 'ALL' || item.stage === stage) &&
        (moduleCode === 'ALL' || item.moduleCode === moduleCode) &&
        (!q || item.questionId.toLowerCase().includes(q) || item.text.toLowerCase().includes(q)),
    );
  }, [catalog, stage, moduleCode, query]);

  const selectCls = 'min-h-[40px] rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 text-sm';

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      <Link to="/admin/exploration-catalogs" className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-secondary mb-2">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
        카탈로그 목록
      </Link>

      {error && (
        <div role="alert" className="rounded-[14px] bg-error-container px-5 py-4 text-sm text-on-error-container">
          카탈로그를 불러오지 못했어요.{' '}
          <button type="button" onClick={load} className="font-bold underline">다시 시도</button>
        </div>
      )}
      {!error && !catalog && <p role="status" className="text-sm text-on-surface-variant">불러오는 중…</p>}

      {catalog && (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-headline tracking-tight break-all">{catalog.version}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <StatusBadge status={catalog.status} />
                <span>항목 {catalog.itemCount}개</span>
                <span>· 해시 <code>{catalog.contentHash}</code></span>
                <span>· 작성 {catalog.author} · 검토 {catalog.reviewer ?? '-'}</span>
              </p>
            </div>
            <div className="w-full sm:w-[320px]">
              <CatalogActions catalog={catalog} onChanged={load} />
            </div>
          </div>

          {catalog.catalogType !== 'QUESTION_CATALOG' ? (
            <p className="rounded-[14px] bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
              이 종류의 카탈로그는 상태만 관리해요. 세부 내용 열람은 문항 카탈로그부터 지원해요.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <label className="sr-only" htmlFor="stage-filter">단계</label>
                <select id="stage-filter" value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
                  <option value="ALL">모든 단계</option>
                  {Object.entries(STAGE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="module-filter">모듈</label>
                <select id="module-filter" value={moduleCode} onChange={(e) => setModuleCode(e.target.value)} className={selectCls}>
                  <option value="ALL">모든 모듈</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="question-search">문항 검색</label>
                <input
                  id="question-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="문항 ID나 문구로 검색"
                  className={`${selectCls} flex-1 min-w-[200px]`}
                />
                <span className="text-sm text-on-surface-variant" aria-live="polite">{filtered.length}개</span>
              </div>

              <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[760px] text-sm">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/10 text-xs text-on-surface-variant">
                        <th className="px-5 py-3 text-left font-bold">문항 ID·버전</th>
                        <th className="px-5 py-3 text-left font-bold">단계·모듈</th>
                        <th className="px-5 py-3 text-left font-bold">지표</th>
                        <th className="px-5 py-3 text-left font-bold">문구</th>
                        <th className="px-5 py-3 text-center font-bold">선택지</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filtered.map((q) => (
                        <tr key={q.questionId} className="align-top">
                          <td className="px-5 py-3 font-mono text-xs">
                            {q.questionId}
                            <span className="block text-on-surface-variant">v{q.questionVersion}</span>
                          </td>
                          <td className="px-5 py-3 text-on-surface-variant">
                            {STAGE_LABEL[q.stage]}
                            <span className="block text-xs">{q.moduleCode}</span>
                          </td>
                          <td className="px-5 py-3 text-on-surface-variant">{q.metricCode ?? '-'}</td>
                          <td className="px-5 py-3 text-on-surface">{q.text}</td>
                          <td className="px-5 py-3 text-center text-on-surface-variant">{q.optionCount}</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-on-surface-variant">조건에 맞는 문항이 없어요.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExplorationCatalogDetail;
