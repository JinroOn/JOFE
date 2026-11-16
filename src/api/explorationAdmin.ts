import api from './axios';
import { isExplorationMock } from '../config/features';
import * as mock from './explorationAdminMock';

import type {
  CatalogSummary,
  CatalogDetail,
  CatalogTargetType,
  CatalogReviewRequest,
  CatalogActivationRequest,
  CatalogArchiveRequest,
} from '../types/explorationAdmin';

const BASE = '/admin/exploration/catalogs';
const REVIEW_BASE = '/admin/exploration/reviews';
const ACTIVATION_BASE = '/admin/exploration/activations';

// 카탈로그 목록
export const getExplorationCatalogs = () =>
  isExplorationMock
    ? mock.listCatalogs()
    : api
        .get<CatalogSummary[]>(BASE)
        .then((response) => response.data);

// 카탈로그 상세
// targetType과 targetId를 반드시 함께 전달
export const getExplorationCatalog = (
  targetType: CatalogTargetType,
  targetId: number,
) =>
  isExplorationMock
    ? mock.getCatalog(targetType, targetId)
    : api
        .get<CatalogDetail>(
          `${BASE}/${targetType}/${targetId}`,
        )
        .then((response) => response.data);

// 카탈로그 검토
export const reviewExplorationCatalog = (
  request: CatalogReviewRequest,
) =>
  isExplorationMock
    ? mock.review(request)
    : api
        .post(REVIEW_BASE, request)
        .then((response) => response.data);

// 카탈로그 활성화
export const activateExplorationCatalog = (
  request: CatalogActivationRequest,
) =>
  isExplorationMock
    ? mock.activate(request)
    : api
        .post(ACTIVATION_BASE, request)
        .then((response) => response.data);

// 카탈로그 보관
export const archiveExplorationCatalog = (
  request: CatalogArchiveRequest,
) =>
  isExplorationMock
    ? mock.archive(request)
    : api
        .post(`${ACTIVATION_BASE}/archive`, request)
        .then((response) => response.data);
