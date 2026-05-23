import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import LibraryNotice from './pages/Library/Notice';
import LibraryContent from './pages/Library/Content';
import LibraryContentDetail from './pages/Library/Content/Detail';
import AiChat from './pages/AiChat';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-[60vh] text-on-surface-variant text-lg">
    {name} 페이지 준비 중
  </div>
);

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');
  const isMainPage = location.pathname === '/';
  const isLoadingPage = location.pathname === '/diagnosis/loading';
  const isChatPage = location.pathname === '/ai-chat';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && !isLoadingPage && !isChatPage && <Header />}
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<><Home /><Footer /></>} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/find-password" element={<FindPassword />} />
          <Route path="/diagnosis" element={<DiagnosisMajor />} />
          <Route path="/diagnosis/loading" element={<DiagnosisLoading />} />
          <Route path="/analysis/*" element={<Placeholder name="진로분석" />} />
          <Route path="/library" element={<LibraryNotice />} />
          <Route path="/library/content" element={<LibraryContent />} />
          <Route path="/library/content/:id" element={<LibraryContentDetail />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="*" element={<Placeholder name="404 - 찾을 수 없는" />} />
        </Routes>
      </div>
      {!isAuthPage && !isMainPage && !isLoadingPage && !isChatPage && <FooterSimple />}
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
