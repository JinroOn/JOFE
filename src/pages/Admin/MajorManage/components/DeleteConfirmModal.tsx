import { useState } from 'react';
import { deleteMajor } from '../../../../api/major';
import type { Major } from '../../../../types/major';

interface Props {
  major: Major;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export default function DeleteConfirmModal({ major, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setError(false);
    try {
      await deleteMajor(major.id);
      onDeleted(major.id);
    } catch {
      setError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-error text-2xl">delete</span>
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">전공 삭제</h3>
        <p className="text-sm text-on-surface-variant mb-1">
          <span className="font-bold text-on-surface">{major.name}</span>
        </p>
        <p className="text-sm text-on-surface-variant mb-6">
          삭제 시 관련 진단 결과 데이터에 영향을 줄 수 있습니다. 정말 삭제하시겠습니까?
        </p>
        {error && <p className="text-sm text-error font-medium mb-4">삭제 중 오류가 발생했습니다.</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-outline-variant/30 font-bold text-sm hover:bg-surface-container transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-error text-white font-bold text-sm hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
