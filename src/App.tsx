import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import FindPassword from './pages/Auth/FindPassword';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-[60vh] text-on-surface-variant text-lg">
    {name} 페이지 준비 중
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/find-password" element={<FindPassword />} />
            <Route path="/diagnosis" element={<Placeholder name="역량진단" />} />
            <Route path="/analysis/*" element={<Placeholder name="진로분석" />} />
            <Route path="/library" element={<Placeholder name="자료실" />} />
            <Route path="/ai-chat" element={<Placeholder name="AI챗봇" />} />
            <Route path="/mypage" element={<Placeholder name="마이페이지" />} />
            <Route path="*" element={<Placeholder name="404 - 찾을 수 없는" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
