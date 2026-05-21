import { Link } from 'react-router-dom';
import logo from '../../../assets/logo-auth.svg';

interface AuthLayoutProps {
  children: React.ReactNode;
  blurSize?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
}

const blurSizeMap = {
  sm: 'w-[28rem] h-[28rem] blur-[90px]',
  md: 'w-[38rem] h-[25rem] blur-[100px]',
  lg: 'w-[45rem] h-[45rem] blur-[120px]',
};

const AuthLayout = ({ children, blurSize = 'md', showLogo = true }: AuthLayoutProps) => {
  return (
    <div className="flex-1 min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* 배경 블러 장식 */}
      <div className={`absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 bg-secondary-container/25 rounded-full pointer-events-none ${blurSizeMap[blurSize]}`} />

      <div className="relative z-10 flex flex-col items-center w-full">
        {showLogo && (
          <Link to="/" className="flex flex-col items-center mb-8">
            <img src={logo} alt="JinroOn" className="h-[56px] w-auto mx-auto ml-10" />
            <p className="mt-2 text-sm text-on-surface-variant">내일을 향한 가장 똑똑한 길잡이, 진로온</p>
          </Link>
        )}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
