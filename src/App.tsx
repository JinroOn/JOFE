import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import FooterSimple from './components/layout/FooterSimple';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import FindPassword from './pages/Auth/FindPassword';
import MyPage from './pages/MyPage';
import DiagnosisMajor from './pages/Diagnosis/Major';
import DiagnosisLoading from './pages/Diagnosis/Loading';
import DiagnosisQuiz from './pages/Diagnosis/Quiz';
import DiagnosisTendency from './pages/Diagnosis/Tendency';
import LibraryNotice from './pages/Library/Notice';
import LibraryContent from './pages/Library/Content';
import LibraryContentDetail from './pages/Library/Content/Detail';
import AiChat from './pages/AiChat';
import MajorExplore from './pages/Analysis/MajorExplore';
import WeakCapability from './pages/Analysis/WeakCapability';
import MajorCompare from './pages/Analysis/MajorCompare';
import Dashboard from './pages/Analysis/Dashboard';
import AdminLayout from './pages/Admin';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminMajorManage from './pages/Admin/MajorManage';
import AdminNoticeManage from './pages/Admin/NoticeManage';
import SharedResult from './pages/Analysis/SharedResult';
import ErrorPage from './pages/Error';
import SessionModal from './pages/Auth/components/SessionModal';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-[60vh] text-on-surface-variant text-lg">
    {name} 페이지 준비 중
  </div>
);

const AdminRedirect = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const UserOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/auth/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const AdminOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);
  const isAuthPage = location.pathname.startsWith('/auth');
  const isMainPage = location.pathname === '/';
  const isLoadingPage = location.pathname === '/diagnosis/loading';
  const isChatPage = location.pathname === '/ai-chat';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && !isLoadingPage && !isChatPage && !isAdminPage && <Header />}
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<AdminRedirect><Home /><Footer /></AdminRedirect>} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/find-password" element={<FindPassword />} />
          <Route path="/diagnosis" element={<UserOnlyRoute><DiagnosisMajor /></UserOnlyRoute>} />
          <Route path="/diagnosis/tendency" element={<UserOnlyRoute><DiagnosisTendency /></UserOnlyRoute>} />
          <Route path="/diagnosis/loading" element={<UserOnlyRoute><DiagnosisLoading /></UserOnlyRoute>} />
          <Route path="/diagnosis/quiz" element={<UserOnlyRoute><DiagnosisQuiz /></UserOnlyRoute>} />
          <Route path="/diagnosis/explore" element={<UserOnlyRoute><MajorExplore /></UserOnlyRoute>} />
          <Route path="/analysis/weak" element={<UserOnlyRoute><WeakCapability /></UserOnlyRoute>} />
          <Route path="/analysis/dashboard" element={<UserOnlyRoute><Dashboard /></UserOnlyRoute>} />
          <Route path="/analysis/compare" element={<UserOnlyRoute><MajorCompare /></UserOnlyRoute>} />
          <Route path="/analysis/*" element={<UserOnlyRoute><Placeholder name="진로분석" /></UserOnlyRoute>} />
          <Route path="/library" element={<UserOnlyRoute><LibraryNotice /></UserOnlyRoute>} />
          <Route path="/library/content" element={<UserOnlyRoute><LibraryContent /></UserOnlyRoute>} />
          <Route path="/library/content/:id" element={<UserOnlyRoute><LibraryContentDetail /></UserOnlyRoute>} />
          <Route path="/ai-chat" element={<UserOnlyRoute><AiChat /></UserOnlyRoute>} />
          <Route path="/mypage" element={<UserOnlyRoute><MyPage /></UserOnlyRoute>} />
          <Route path="/admin" element={<AdminOnlyRoute><AdminLayout /></AdminOnlyRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="majors" element={<AdminMajorManage />} />
            <Route path="notices" element={<AdminNoticeManage />} />
          </Route>
          <Route path="/results/share/:token" element={<SharedResult />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<Placeholder name="404 - 찾을 수 없는" />} />
        </Routes>
      </div>
      {!isAuthPage && !isMainPage && !isLoadingPage && !isChatPage && !isAdminPage && <FooterSimple />}
      {sessionExpired && <SessionModal onClose={() => setSessionExpired(false)} />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
