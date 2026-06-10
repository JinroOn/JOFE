import { useEffect, useRef, useState } from 'react';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../../../api/notice';
import useAuthStore from '../../../store/useAuthStore';
import type { Notice, NoticeFormData } from '../../../types/notice';

const EMPTY_FORM: NoticeFormData = {
  title: '',
  content: '',
  displayType: 'popup',
  startAt: '',
  endAt: '',
};

const toDatetimeLocal = (iso: string) => iso?.slice(0, 16) ?? '';
const toIso = (local: string) => local ? `${local}:00` : '';
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\. /g, '.').replace(/\.$/, '');

const AdminNoticeManage = () => {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Notice | null>(null);
  const [form, setForm] = useState<NoticeFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  const fetchNotices = (page = 0) => {
    setLoading(true);
    getNotices(page, 10)
      .then((data) => {
        setNotices(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(0); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const openEdit = (n: Notice) => {
    setEditTarget(n);
    setForm({
      title: n.title,
      content: n.content,
      displayType: n.displayType,
      startAt: toDatetimeLocal(n.startAt),
      endAt: toDatetimeLocal(n.endAt),
    });
    setFormError('');
    setModalOpen(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError('제목을 입력해주세요.'); return; }
    if (!form.content.trim()) { setFormError('내용을 입력해주세요.'); return; }
    if (!form.startAt || !form.endAt) { setFormError('노출 기간을 입력해주세요.'); return; }
    if (form.startAt >= form.endAt) { setFormError('종료일이 시작일보다 늦어야 합니다.'); return; }

    setSaving(true);
    setFormError('');
    try {
      const payload: NoticeFormData = {
        ...form,
        createdBy: user?.id,
        startAt: toIso(form.startAt),
        endAt: toIso(form.endAt),
      };
      if (editTarget) {
        await updateNotice(editTarget.id, payload);
      } else {
        await createNotice(payload);
      }
      setModalOpen(false);
      fetchNotices(editTarget ? currentPage : 0);
    } catch {
      setFormError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNotice(deleteTarget.id);
      setDeleteTarget(null);
      fetchNotices(notices.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage);
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i);

  return (
    <div className="px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10">
      <div className="mb-8 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary font-headline tracking-tight mb-1">
            공지사항 관리
          </h2>
          <p className="text-on-primary-container">
            총 <span className="font-bold text-primary">{totalElements}</span>건
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg font-bold hover:bg-secondary/90 transition-all"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          공지 작성
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-[14px] cloud-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider w-14">No</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">제목</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider w-24">타입</th>
                <th className="hidden md:table-cell px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider w-48">노출 기간</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider w-28">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                  </td>
                </tr>
              )}
              {!loading && notices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                    공지사항이 없습니다.
                  </td>
                </tr>
              )}
              {!loading && notices.map((n, idx) => (
                <tr key={n.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-5 text-sm text-on-surface-variant">
                    {String(currentPage * 10 + idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-medium text-on-surface line-clamp-1">{n.title}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                      n.displayType === 'banner'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {n.displayType === 'banner' ? '배너' : '팝업'}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-5 text-center text-sm text-on-surface-variant">
                    {formatDate(n.startAt)} ~ {formatDate(n.endAt)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(n)}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                        title="수정"
                      >
                        <span className="material-symbols-outlined text-lg text-on-surface-variant">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(n)}
                        className="p-1.5 rounded-lg hover:bg-error-container/30 transition-colors"
                        title="삭제"
                      >
                        <span className="material-symbols-outlined text-lg text-error">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-6 border-t border-outline-variant/10">
            <button
              onClick={() => fetchNotices(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => fetchNotices(p)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold transition-colors ${
                  p === currentPage ? 'bg-primary-container text-white' : 'hover:bg-surface-container-high'
                }`}
              >
                {p + 1}
              </button>
            ))}
            <button
              onClick={() => fetchNotices(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
              <h3 className="text-lg font-bold text-on-surface">
                {editTarget ? '공지사항 수정' : '공지사항 작성'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1.5">제목 *</label>
                <input
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1.5">내용 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={5}
                  placeholder="공지사항 내용을 입력하세요"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1.5">노출 타입 *</label>
                <div className="flex gap-3">
                  {(['popup', 'banner'] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.displayType === type}
                        onChange={() => setForm((f) => ({ ...f, displayType: type }))}
                        className="accent-secondary"
                      />
                      <span className="text-sm font-medium">
                        {type === 'popup' ? '팝업 (일반)' : '배너 (중요)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1.5">노출 시작 *</label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="w-full px-3 py-3 bg-surface-container-low rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1.5">노출 종료 *</label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                    className="w-full px-3 py-3 bg-surface-container-low rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-error font-medium">{formError}</p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-outline-variant/15">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 rounded-lg border border-outline-variant/30 font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-lg bg-secondary text-white font-bold hover:bg-secondary/90 transition-all disabled:opacity-50"
              >
                {saving ? '저장 중...' : editTarget ? '수정 완료' : '작성 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-2xl">delete</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">공지사항 삭제</h3>
            <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">
              <span className="font-semibold text-on-surface">"{deleteTarget.title}"</span>을 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-lg border border-outline-variant/30 font-bold hover:bg-surface-container-low transition-all"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-lg bg-error text-white font-bold hover:bg-error/90 transition-all disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoticeManage;
