import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

interface FormState {
  name: string;
  id: string;
  newPassword: string;
  passwordConfirm: string;
}

const inputClass =
  'w-full bg-surface-container-high border-b-2 border-transparent focus:border-[#FFAB00] px-4 py-4 rounded-t-lg transition-all text-on-surface placeholder:text-on-surface-variant/40 outline-none';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 ml-1';

const FindPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ name: '', id: '', newPassword: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = <K extends keyof FormState>(k: K, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.id) return setError('이름과 아이디를 입력해 주세요.');
    if (form.newPassword.length < 8) return setError('비밀번호는 8자 이상이어야 합니다.');
    if (form.newPassword !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
    setError('');
    setLoading(true);
    // TODO: API 연동
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    navigate('/auth/login');
  };

  return (
    <AuthLayout blurSize="lg" showLogo={false}>
      <div className="w-full max-w-[480px]">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary-container tracking-tight mb-3">계정 정보 찾기</h1>
          <p className="text-on-surface-variant text-lg">가입하신 정보로 계정을 확인하실 수 있습니다.</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-[14px] border border-outline-variant/10 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
          <div className="p-8 sm:p-10">
            <h2 className="text-xl font-bold text-primary-container text-center mb-8">비밀번호 찾기</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={labelClass}>이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="성명을 입력해 주세요"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>아이디</label>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setField('id', e.target.value)}
                  placeholder="사용중인 아이디를 입력해 주세요"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>새 비밀번호</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setField('newPassword', e.target.value)}
                  placeholder="새로운 비밀번호를 입력해 주세요"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>비밀번호 확인</label>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => setField('passwordConfirm', e.target.value)}
                  placeholder="비밀번호를 한 번 더 입력해 주세요"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-error text-sm">{error}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFAB00] text-primary-container font-bold py-5 rounded-lg shadow-lg shadow-[#FFAB00]/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60"
                >
                  {loading ? '처리 중...' : '비밀번호 재설정'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <Link
            to="/auth/login"
            className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            로그인 페이지로 돌아가기
          </Link>
          <div className="flex items-center gap-6 mt-2">
            <Link to="/auth/signup" className="text-sm text-on-surface-variant/60 hover:text-secondary transition-colors">
              회원가입
            </Link>
            <div className="w-1 h-1 bg-outline-variant/30 rounded-full" />
            <a href="#" className="text-sm text-on-surface-variant/60 hover:text-secondary transition-colors">
              고객센터 문의
            </a>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default FindPassword;
