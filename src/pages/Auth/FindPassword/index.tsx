import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { labelClass, inputClass, isValidEmail, pwChecks } from '../constants';
import { sendPasswordResetCode, verifyPasswordResetCode, resetPassword } from '../../../api/auth';

const COUNTDOWN_SEC = 180;

const FindPassword = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCountdown = () => {
    setCountdown(COUNTDOWN_SEC);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const handleSendCode = async () => {
    if (!name.trim()) return setError('이름을 입력해 주세요.');
    if (!isValidEmail(email)) return setError('올바른 이메일 형식을 입력해 주세요.');
    setError('');
    setSendLoading(true);
    try {
      await sendPasswordResetCode(email);
      setCodeSent(true);
      setCode('');
      startCountdown();
    } catch {
      setError('인증 코드 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSendLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) return setError('인증 코드를 입력해 주세요.');
    setError('');
    setVerifyLoading(true);
    try {
      await verifyPasswordResetCode(email, code);
      setCodeVerified(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(0);
    } catch {
      setError('인증 코드가 올바르지 않거나 만료되었습니다.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeVerified) return setError('이메일 인증을 완료해 주세요.');
    if (!pwChecks.every((c) => c.test(newPassword))) return setError('비밀번호 조건을 모두 충족해 주세요.');
    if (newPassword !== passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
    setError('');
    setSubmitLoading(true);
    try {
      await resetPassword({ email, code, newPassword });
      navigate('/auth/login', { state: { passwordReset: true } });
    } catch {
      setError('비밀번호 재설정에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AuthLayout blurSize="lg" showLogo={false}>
      <div className="w-full max-w-[480px]">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary-container tracking-tight mb-3">계정 정보 찾기</h1>
          <p className="text-on-surface-variant text-lg">가입하신 이메일로 계정을 확인하실 수 있습니다.</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-[14px] border border-outline-variant/10 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] overflow-hidden">
          <div className="p-8 sm:p-10">
            <h2 className="text-xl font-bold text-primary-container text-center mb-8">비밀번호 찾기</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이름 */}
              <div>
                <label className={labelClass}>이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성명을 입력해 주세요"
                  className={inputClass}
                  disabled={codeVerified}
                />
              </div>

              {/* 이메일 + 인증코드 발송 */}
              <div>
                <label className={labelClass}>이메일</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setCodeSent(false); setCodeVerified(false); setCode(''); }}
                    placeholder="가입한 이메일을 입력해 주세요"
                    className={inputClass + ' flex-1 min-w-0'}
                    disabled={codeVerified}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendLoading || codeVerified}
                    className="shrink-0 px-4 py-2 bg-primary-container text-white text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {sendLoading ? '발송 중...' : codeSent ? '재발송' : '인증코드 발송'}
                  </button>
                </div>
              </div>

              {/* 인증코드 입력 */}
              {codeSent && !codeVerified && (
                <div>
                  <label className={labelClass}>인증 코드</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="인증 코드 6자리를 입력해 주세요"
                        maxLength={6}
                        className={inputClass + ' pr-16'}
                      />
                      {countdown > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-error font-mono pointer-events-none">
                          {formatTime(countdown)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyLoading || countdown === 0}
                      className="shrink-0 px-4 py-2 bg-secondary text-white text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {verifyLoading ? '확인 중...' : '확인'}
                    </button>
                  </div>
                  {countdown === 0 && (
                    <p className="text-xs text-error mt-1 ml-1">인증 시간이 만료되었습니다. 재발송을 클릭해 주세요.</p>
                  )}
                </div>
              )}

              {/* 인증 완료 표시 */}
              {codeVerified && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  이메일 인증이 완료되었습니다.
                </div>
              )}

              {/* 새 비밀번호 (인증 완료 후 표시) */}
              {codeVerified && (
                <>
                  <div>
                    <label className={labelClass}>새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="새로운 비밀번호를 입력해 주세요"
                      className={inputClass}
                    />
                    {newPassword && (
                      <div className="grid grid-cols-2 gap-1 mt-2 px-1">
                        {pwChecks.map(({ label, test }) => (
                          <span
                            key={label}
                            className={`flex items-center gap-1 text-xs ${test(newPassword) ? 'text-green-600' : 'text-on-surface-variant/50'}`}
                          >
                            <span
                              className="material-symbols-outlined text-[14px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {test(newPassword) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>비밀번호 확인</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호를 한 번 더 입력해 주세요"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {error && <p className="text-error text-sm">{error}</p>}

              {codeVerified && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-[#FFAB00] text-primary-container font-bold py-5 rounded-lg shadow-lg shadow-[#FFAB00]/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60"
                  >
                    {submitLoading ? '처리 중...' : '비밀번호 재설정'}
                  </button>
                </div>
              )}
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
