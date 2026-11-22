import { useEffect, useState } from 'react';
import { createMyConsent, getMyConsents } from '../../../api/user';
import { getApiErrorMessage, getApiErrorResponse } from '../../../api/error';
import type { UserConsentResponse } from '../../../types/user';

interface Props {
  onRequestWithdrawal: () => void;
}

const ConsentManagement = ({ onRequestWithdrawal }: Props) => {
  const [consent, setConsent] = useState<UserConsentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requiresWithdrawal, setRequiresWithdrawal] = useState(false);

  useEffect(() => {
    let active = true;

    const loadConsents = async () => {
      try {
        const items = await getMyConsents();

        if (!active) return;

        const latest = [...items].sort(
          (a, b) =>
            new Date(b.agreedAt).getTime() - new Date(a.agreedAt).getTime() ||
            b.id - a.id
        )[0] ?? null;

        setConsent(latest);
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, '동의 내역을 불러오지 못했습니다.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadConsents();

    return () => {
      active = false;
    };
  }, []);

  const handleMarketingChange = async (checked: boolean) => {
    if (!consent || saving) return;

    setSaving(true);
    setError(null);
    setNotice(null);
    setRequiresWithdrawal(false);

    try {
      const saved = await createMyConsent({
        marketingAgreed: checked,
      });

      setConsent(saved);
      setNotice(
        checked
          ? '마케팅 정보 수신에 동의했습니다.'
          : '마케팅 정보 수신 동의를 철회했습니다.'
      );
    } catch (err) {
      const response = getApiErrorResponse(err);

      if (response?.code === 'ACCOUNT_WITHDRAWAL_REQUIRED') {
        setRequiresWithdrawal(true);
        setError('필수 동의는 개별적으로 철회할 수 없습니다. 회원 탈퇴 절차를 이용해 주세요.');
      } else {
        setError(getApiErrorMessage(err, '동의 상태를 변경하지 못했습니다.'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 bg-white rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-primary-container mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined">verified_user</span>
        약관 및 동의 관리
      </h3>

      {loading && (
        <p className="text-sm text-on-surface-variant py-4">
          동의 내역을 불러오는 중입니다...
        </p>
      )}

      {!loading && consent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">이용약관 동의</p>
              <p className="text-xs text-on-surface-variant mt-1">필수 동의</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              consent.termsAgreed
                ? 'bg-green-100 text-green-700'
                : 'bg-error-container text-error'
            }`}>
              {consent.termsAgreed ? '동의' : '미동의'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">개인정보 수집 및 이용</p>
              <p className="text-xs text-on-surface-variant mt-1">필수 동의</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              consent.privacyAgreed
                ? 'bg-green-100 text-green-700'
                : 'bg-error-container text-error'
            }`}>
              {consent.privacyAgreed ? '동의' : '미동의'}
            </span>
          </div>

          <div className="border-t border-outline-variant/20 pt-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-on-surface">마케팅 정보 수신</p>
                <p className="text-xs text-on-surface-variant mt-1">선택 동의</p>
              </div>

              <input
                type="checkbox"
                checked={consent.marketingAgreed}
                disabled={saving}
                onChange={(e) => handleMarketingChange(e.target.checked)}
                className="w-5 h-5 accent-[#FFAB00] disabled:opacity-50"
              />
            </label>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            이용약관 및 개인정보 수집·이용 동의는 서비스 이용에 필요한 필수 동의입니다.
            필수 동의를 철회하려면 회원 탈퇴를 진행해야 합니다.
          </p>

          <p className="text-[11px] text-on-surface-variant">
            최근 동의 일시: {new Date(consent.agreedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      )}

      {!loading && !consent && !error && (
        <p className="text-sm text-on-surface-variant py-4">
          등록된 동의 내역이 없습니다.
        </p>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-error-container/20 text-error text-sm">
          {error}
        </div>
      )}

      {notice && (
        <p className="mt-4 text-sm text-green-700">{notice}</p>
      )}

      {requiresWithdrawal && (
        <button
          onClick={onRequestWithdrawal}
          className="mt-4 px-4 py-2.5 rounded-xl bg-error text-white text-sm font-bold hover:opacity-90"
        >
          회원 탈퇴 진행
        </button>
      )}

      {saving && (
        <p className="mt-3 text-xs text-on-surface-variant">동의 상태를 저장하고 있습니다...</p>
      )}
    </section>
  );
};

export default ConsentManagement;
