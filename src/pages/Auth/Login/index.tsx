import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import useAuthStore from '../../../store/useAuthStore';

interface FormState {
  email: string;
  password: string;
  keepLogin: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const inputClass =
  'w-full bg-surface-container-high border-b-2 border-transparent focus:border-secondary px-4 py-4 rounded-t-lg transition-all text-on-surface placeholder:text-on-surface-variant/40 outline-none pr-10';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 ml-1';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState<FormState>({ email: '', password: '', keepLogin: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: FormErrors = {};
    if (!isValidEmail(form.email)) e.email = '올바른 이메일 형식을 입력해 주세요.';
    if (!form.password) e.password = '비밀번호를 입력해 주세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // TODO: API 연동 — 현재는 목업 로그인 (test123 / test123)
    await new Promise((r) => setTimeout(r, 1000));
    if (form.email === 'test123@gmail.com' && form.password === 'test123') {
      login({ id: 1, email: 'test123@gmail.com', nickname: 'test123' }, 'mock-token');
    } else {
      setErrors({ password: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/');
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-[14px] border border-outline-variant/10 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-outline-variant/20">
            <div className="flex-1 py-4 text-center font-bold text-primary-container text-sm border-b-2 border-secondary -mb-px">
              로그인
            </div>
            <Link
              to="/auth/signup"
              className="flex-1 py-4 text-center text-on-surface-variant/60 text-sm hover:text-primary transition-colors"
            >
              회원가입
            </Link>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이메일 */}
              <div>
                <label className={labelClass}>이메일 주소</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="example@email.com"
                    className={inputClass}
                  />
                  {emailTouched && form.email && (
                    <span
                      className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-xl ${isValidEmail(form.email) ? 'text-green-500' : 'text-error'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {isValidEmail(form.email) ? 'check_circle' : 'cancel'}
                    </span>
                  )}
                </div>
                {errors.email && <p className="text-error text-xs mt-1 ml-1">{errors.email}</p>}
              </div>

              {/* 비밀번호 */}
              <div>
                <label className={labelClass}>비밀번호</label>
                <div className="relative">
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="비밀번호를 입력하세요"
                    className={inputClass}
                  />
                  {errors.password && (
                    <span
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-xl text-error"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      cancel
                    </span>
                  )}
                </div>
                {errors.password && <p className="text-error text-xs mt-1 ml-1">{errors.password}</p>}
              </div>

              {/* 로그인 상태 유지 + 비밀번호 찾기 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.keepLogin}
                    onChange={(e) => setForm((p) => ({ ...p, keepLogin: e.target.checked }))}
                    className="w-4 h-4 rounded border-outline-variant accent-secondary"
                  />
                  로그인 상태 유지
                </label>
                <Link to="/auth/find-password" className="text-sm text-on-surface-variant hover:text-secondary transition-colors">
                  비밀번호 찾기
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary text-white font-bold py-5 rounded-lg shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60"
                >
                  {loading ? '처리 중...' : '로그인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
