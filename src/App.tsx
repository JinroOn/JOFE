import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import FindPassword from './pages/Auth/FindPassword';
import MyPage from './pages/MyPage';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-[60vh] text-on-surface-variant text-lg">
    {name} 페이지 준비 중
  </div>
);

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Header />}
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<><Home /><Footer /></>} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/find-password" element={<FindPassword />} />
          <Route path="/diagnosis" element={<Placeholder name="역량진단" />} />
          <Route path="/analysis/*" element={<Placeholder name="진로분석" />} />
          <Route path="/library" element={<Placeholder name="자료실" />} />
          <Route path="/ai-chat" element={<Placeholder name="AI챗봇" />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="*" element={<Placeholder name="404 - 찾을 수 없는" />} />
        </Routes>
      </div>
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
