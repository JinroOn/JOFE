export const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 ml-1';

export const inputClass =
  'w-full bg-surface-container-high border-b-2 border-transparent focus:border-[#FFAB00] px-4 py-4 rounded-t-lg transition-all text-on-surface placeholder:text-on-surface-variant/40 outline-none';

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const pwChecks = [
  { label: '8자 이상',      test: (v: string) => v.length >= 8 },
  { label: '숫자 포함',      test: (v: string) => /\d/.test(v) },
  { label: '특수문자 포함',  test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
  { label: '영문 대소문자',  test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
];
