import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';
import { signup as signupApi, sendEmailVerification, confirmEmailVerification } from '../../../api/auth';
import { labelClass, inputClass, isValidEmail, pwChecks } from '../constants';
import ConsentModal from './ConsentModal';
import { CONSENT_TEXTS } from './consentTexts';

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
  const [openConsent, setOpenConsent] = useState<keyof typeof CONSENT_TEXTS | null>(null);

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

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
      await sendEmailVerification(form.email);
      setStep('verify');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setSubmitError('이미 사용 중인 이메일입니다.');
      } else {
        setSubmitError('인증 코드 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyInput.trim()) { setVerifyError('인증 코드를 입력해주세요.'); return; }
    if (!/^\d{6}$/.test(verifyInput.trim())) { setVerifyError('인증 코드는 숫자 6자리를 입력해주세요.'); return; }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      await confirmEmailVerification(form.email, verifyInput.trim());
    } catch {
      setVerifyError('인증 코드가 올바르지 않거나 만료되었습니다.');
      setVerifyLoading(false);
      return;
    }
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
        setVerifyError('이미 사용 중인 이메일입니다.');
      } else {
        setVerifyError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendEmailVerification(form.email);
      setVerifyInput('');
      setVerifyError('');
    } catch {
      setVerifyError('재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
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

          {step === 'verify' ? (
          <div className="p-8 sm:p-10 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">mark_email_unread</span>
              </div>
              <h2 className="text-xl font-bold text-primary-container mb-1">이메일 인증</h2>
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">{form.email}</span>으로<br />인증 코드를 발송했습니다.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>인증 코드</label>
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="이메일로 발송된 6자리 코드 입력"
                maxLength={6}
                className={inputClass}
                autoFocus
              />
            </div>

            {verifyError && <p className="text-error text-sm">{verifyError}</p>}

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifyLoading}
              className="w-full bg-[#FFAB00] text-primary-container font-bold py-5 rounded-lg shadow-lg shadow-[#FFAB00]/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60"
            >
              {verifyLoading ? '확인 중...' : '인증 완료'}
            </button>

            <p className="text-center text-sm text-on-surface-variant">
              코드를 받지 못하셨나요?{' '}
              <button type="button" onClick={handleResend} className="text-secondary font-semibold hover:underline">
                재발송
              </button>
            </p>
          </div>
          ) : (
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
                    <div key={key} className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[key]}
                          onChange={(e) => setField(key, e.target.checked)}
                          className="w-4 h-4 rounded border-outline-variant accent-[#FFAB00]"
                        />
                        <span className="text-sm text-on-surface-variant">{label}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setOpenConsent(key)}
                        className="p-1 hover:text-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
                      </button>
                    </div>
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
          )}
        </div>
      </div>
      {openConsent && (
        <ConsentModal
          title={CONSENT_TEXTS[openConsent].title}
          content={CONSENT_TEXTS[openConsent].content}
          onClose={() => setOpenConsent(null)}
        />
      )}
    </AuthLayout>
  );
};

export default Signup;
