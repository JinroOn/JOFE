import api from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationAdminMock';
import type { CatalogDetail, CatalogStatus, CatalogSummary } from '../types/explorationAdmin';

const BASE = '/admin/exploration/catalogs';

export const getExplorationCatalogs = () =>
  isExplorationMock ? mock.listCatalogs() : api.get<CatalogSummary[]>(BASE).then((r) => r.data);

export const getExplorationCatalog = (catalogId: number) =>
  isExplorationMock ? mock.getCatalog(catalogId) : api.get<CatalogDetail>(`${BASE}/${catalogId}`).then((r) => r.data);

// 작성자 외 1명 검토 (D-33). 작성자 본인 여부는 서버가 판단한다.
export const reviewExplorationCatalog = (catalogId: number, expectedStatus: CatalogStatus) =>
  isExplorationMock
    ? mock.review(catalogId, expectedStatus)
    : api.post<CatalogSummary>(`${BASE}/${catalogId}/review`, { expectedStatus }).then((r) => r.data);

// 활성화와 롤백(보관된 검증 버전 재활성화)은 같은 요청이다. 같은 종류의 기존 ACTIVE는 ARCHIVED가 된다.
export const activateExplorationCatalog = (catalogId: number, expectedStatus: CatalogStatus) =>
  isExplorationMock
    ? mock.activate(catalogId, expectedStatus)
    : api.post<CatalogSummary>(`${BASE}/${catalogId}/activate`, { expectedStatus }).then((r) => r.data);
