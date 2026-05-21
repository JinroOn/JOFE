import { useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';

interface Props {
  onClose: () => void;
}

const ProfileEditModal = ({ onClose }: Props) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.nickname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const initial = name ? name[0] : '?';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="bg-white w-full max-w-md rounded-[14px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-container">프로필 편집</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-lg border-4 border-white bg-secondary-container flex items-center justify-center">
                <span className="text-4xl font-extrabold text-white">{initial}</span>
              </div>
              <button className="absolute -bottom-1 -right-1 bg-secondary-container text-on-secondary-container w-10 h-10 rounded-2xl shadow-md hover:scale-105 transition-transform flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">photo_camera</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium text-on-surface"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider ml-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button className="flex-[1.5] px-4 py-3.5 bg-[#FFAB00] text-white font-bold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(255,171,0,0.3)]">
            변경 내용 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
