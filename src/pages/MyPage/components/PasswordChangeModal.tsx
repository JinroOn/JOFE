import { useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import { changePassword } from '../../../api/auth';

interface Props {
  onClose: () => void;
}

const PasswordChangeModal = ({ onClose }: Props) => {
  const { refreshToken } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!currentPassword) { setError('현재 비밀번호를 입력해주세요.'); return; }
    if (newPassword.length < 8) { setError('새 비밀번호는 8자 이상이어야 합니다.'); return; }
    if (newPassword !== confirmPassword) { setError('새 비밀번호가 일치하지 않습니다.'); return; }
    if (!refreshToken) { setError('인증 정보가 없습니다. 다시 로그인해주세요.'); return; }

    setSaving(true);
    setError('');
    try {
      await changePassword({ refreshToken, currentPassword, newPassword });
      setDone(true);
    } catch {
      setError('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="bg-white w-full max-w-md rounded-[14px] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-container">비밀번호 변경</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {done ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl">check_circle</span>
            </div>
            <p className="font-bold text-on-surface mb-1">비밀번호가 변경되었습니다.</p>
            <p className="text-sm text-on-surface-variant mb-6">다음 로그인부터 새 비밀번호를 사용해주세요.</p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium text-on-surface"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium text-on-surface"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium text-on-surface"
                />
              </div>
              {error && <p className="text-sm text-error font-medium">{error}</p>}
            </div>

            <div className="px-6 py-5 flex gap-3 border-t border-outline-variant/15">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[1.5] px-4 py-3.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-50"
              >
                {saving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeModal;
