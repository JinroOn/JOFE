import { useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import { updateMe } from '../../../api/user';

interface Props {
  onClose: () => void;
}

const AVATARS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
];

const ProfileEditModal = ({ onClose }: Props) => {
  const { user, updateUser } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    user?.profileImageUrl ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const initial = nickname ? nickname[0] : '?';
  const hasAvatar = selectedAvatar && AVATARS.includes(selectedAvatar);

  const handleSave = async () => {
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await updateMe({
        nickname: nickname.trim(),
        profileImageUrl: selectedAvatar ?? undefined,
      });
      updateUser({ ...updated, role: updated.role as 'member' | 'admin' });
      onClose();
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="bg-white w-full max-w-md rounded-[14px] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-container">프로필 편집</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shadow-lg border-4 border-white bg-secondary-container flex items-center justify-center">
              {hasAvatar ? (
                <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-white">{initial}</span>
              )}
            </div>
          </div>

          {/* Avatar Grid */}
          <div>
            <p className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider mb-3">프로필 아바타 선택</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar === selectedAvatar ? null : avatar)}
                  className={`relative w-full aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 ${
                    selectedAvatar === avatar
                      ? 'ring-2 ring-offset-2 ring-secondary scale-105'
                      : 'hover:ring-2 hover:ring-offset-1 hover:ring-outline-variant'
                  }`}
                >
                  <img src={avatar} alt="avatar option" className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm drop-shadow">check_circle</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium text-on-surface"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">이메일</label>
            <p className="px-4 py-3 bg-surface-container-high/50 rounded-xl text-sm font-medium text-on-surface-variant">
              {user?.email}
            </p>
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
            className="flex-[1.5] px-4 py-3.5 bg-[#FFAB00] text-white font-bold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(255,171,0,0.3)] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '변경 내용 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
