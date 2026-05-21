import { Link } from 'react-router-dom';
import logo from '../../../assets/logo.png';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* 배경 블러 장식 */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-primary-container/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Link to="/" className="flex flex-col items-center mb-8">
        <img src={logo} alt="JinroOn" className="h-[44px] object-contain" />
        <p className="mt-2 text-sm text-on-surface-variant">내일을 향한 가장 똑똑한 길잡이, 진로온</p>
      </Link>

      {children}
    </div>
  );
};

export default AuthLayout;
