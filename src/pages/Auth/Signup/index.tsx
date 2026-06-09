import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';
import { signup as signupApi } from '../../../api/auth';
import { labelClass, inputClass, isValidEmail, pwChecks } from '../constants';

interface FormState {
  email: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  agreeAll: boolean;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    email: '', nickname: '', password: '', passwordConfirm: '',
    agreeAll: false, agreeTerms: false, agreePrivacy: false, agreeMarketing: false,
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleAgreeAll = (checked: boolean) =>
    setForm((p) => ({ ...p, agreeAll: checked, agreeTerms: checked, agreePrivacy: checked, agreeMarketing: checked }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) return setSubmitError('올바른 이메일 형식을 입력해 주세요.');
    if (!form.nickname.trim()) return setSubmitError('닉네임을 입력해 주세요.');
    if (form.nickname.length > 50) return setSubmitError('닉네임은 50자 이하로 입력해 주세요.');
    if (!pwChecks.every((c) => c.test(form.password))) return setSubmitError('비밀번호 조건을 모두 충족해 주세요.');
    if (form.password !== form.passwordConfirm) return setSubmitError('비밀번호가 일치하지 않습니다.');
    if (!form.agreeTerms || !form.agreePrivacy) return setSubmitError('필수 약관에 동의해 주세요.');
    setSubmitError('');
    setLoading(true);
    try {
      await signupApi({
        email: form.email,
        password: form.password,
        nickname: form.nickname.trim(),
        termsAgreed: form.agreeTerms,
        privacyAgreed: form.agreePrivacy,
        marketingAgreed: form.agreeMarketing,
      });
      navigate('/auth/login', { state: { signedUp: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setSubmitError('이미 사용 중인 이메일입니다.');
      } else {
        setSubmitError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout blurSize="lg">
      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-[14px] border border-outline-variant/10 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-outline-variant/20">
            <Link
              to="/auth/login"
              className="flex-1 py-4 text-center text-on-surface-variant/60 text-sm hover:text-primary transition-colors"
            >
              로그인
            </Link>
            <div className="flex-1 py-4 text-center font-bold text-primary-container text-sm border-b-2 border-[#FFAB00] -mb-px">
              회원가입
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이메일 */}
              <div>
                <label className={labelClass}>이메일 주소</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="example@email.com"
                    className={inputClass + ' pr-10'}
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
              </div>

              {/* 닉네임 */}
              <div>
                <label className={labelClass}>닉네임</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setField('nickname', e.target.value)}
                  placeholder="사용할 닉네임을 입력하세요 (최대 50자)"
                  className={inputClass}
                />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className={labelClass}>비밀번호</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className={inputClass}
                />
                {form.password && (
                  <div className="grid grid-cols-2 gap-1 mt-2 px-1">
                    {pwChecks.map(({ label, test }) => (
                      <span key={label} className={`flex items-center gap-1 text-xs ${test(form.password) ? 'text-green-600' : 'text-on-surface-variant/50'}`}>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {test(form.password) ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className={labelClass}>비밀번호 확인</label>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => setField('passwordConfirm', e.target.value)}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  className={inputClass}
                />
              </div>

              {/* 약관 동의 */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeAll}
                    onChange={(e) => handleAgreeAll(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant accent-[#FFAB00]"
                  />
                  <span className="text-sm font-medium text-primary-container">전체 동의</span>
                </label>
                <div className="flex flex-col gap-2 pl-1 border-t border-outline-variant/20 pt-2">
                  {[
                    { key: 'agreeTerms' as const, label: '이용약관 동의 (필수)' },
                    { key: 'agreePrivacy' as const, label: '개인정보처리방침 동의 (필수)' },
                    { key: 'agreeMarketing' as const, label: '마케팅 정보 수신 동의 (선택)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form[key]}
                          onChange={(e) => setField(key, e.target.checked)}
                          className="w-4 h-4 rounded border-outline-variant accent-[#FFAB00]"
                        />
                        <span className="text-sm text-on-surface-variant">{label}</span>
                      </div>
                      <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
                    </label>
                  ))}
                </div>
              </div>

              {submitError && <p className="text-error text-sm">{submitError}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFAB00] text-primary-container font-bold py-5 rounded-lg shadow-lg shadow-[#FFAB00]/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60"
                >
                  {loading ? '처리 중...' : '회원가입'}
                </button>
              </div>

              <p className="text-center text-sm text-on-surface-variant pt-1">
                이미 계정이 있으신가요?{' '}
                <Link to="/auth/login" className="text-secondary font-semibold hover:underline">
                  로그인하기
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
