import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';

interface SessionModalProps {
  onClose: () => void;
}

const SessionModal = ({ onClose }: SessionModalProps) => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleReLogin = () => {
    logout();
    onClose();
    navigate('/auth/login');
  };

  const handleGoHome = () => {
    logout();
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(10,25,47,0.4)] flex items-center justify-center px-4">
      <div className="bg-white rounded-[14px] shadow-2xl w-full max-w-[384px] p-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            notifications_off
          </span>
        </div>
        <h2 className="text-xl font-bold text-primary-container text-center mb-2">
          세션이 만료되었습니다
        </h2>
        <p className="text-sm text-on-surface-variant text-center leading-relaxed mb-8">
          보안을 위해 30분 동안 활동이 없어 로그아웃 되었습니다.<br />
          다시 로그인하여 이용해 주세요.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleReLogin}
            className="w-full py-3.5 bg-primary-container text-white font-bold text-base rounded-[12px] hover:opacity-90 transition-opacity"
          >
            다시 로그인하기
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-2 text-on-surface-variant text-sm hover:text-primary transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
