import type { Notice, NoticePage, NoticeFormData } from '../types/notice';
import api from './axios';

export const getNotices = (page = 0, size = 10, activeOnly = false) =>
  api
    .get<NoticePage>('/notices', { params: { page, size, activeOnly } })
    .then((r) => r.data);

export const getNotice = (noticeId: number) =>
  api.get<Notice>(`/notices/${noticeId}`).then((r) => r.data);

export const createNotice = (data: NoticeFormData) =>
  api.post<Notice>('/notices', data).then((r) => r.data);

export const updateNotice = (noticeId: number, data: Partial<NoticeFormData>) =>
  api.patch<Notice>(`/notices/${noticeId}`, data).then((r) => r.data);

export const deleteNotice = (noticeId: number) =>
  api.delete(`/notices/${noticeId}`);
