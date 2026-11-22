import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';

import useAuthStore from './store/useAuthStore';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import FooterSimple from './components/layout/FooterSimple';

import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import FindPassword from './pages/Auth/FindPassword';
import MyPage from './pages/MyPage';

import ExplorationIntro from './pages/Diagnosis/Exploration/Intro';
import ExplorationQuestion from './pages/Diagnosis/Exploration/QuestionWithPresentation';

import ExplorationResult from './pages/Analysis/ExplorationResult';
import ExplorationCompare from './pages/Analysis/ExplorationCompare';
import ExplorationActivities from './pages/Analysis/ExplorationActivities';
import ExplorationAsk from './pages/Analysis/ExplorationAsk';
import ExplorationPlan from './pages/Analysis/ExplorationPlan';
import ExplorationShared from './pages/Analysis/ExplorationShared';

import {
  diagnosisEntryPath,
  isExplorationEnabled,
} from './config/features';

import LibraryNotice from './pages/Library/Notice';
import MajorExplore from './pages/Analysis/MajorExplore';
import ResultHome from './pages/Analysis/ResultHome';

import AdminLayout from './pages/Admin';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminMajorManage from './pages/Admin/MajorManage';
import AdminNoticeManage from './pages/Admin/NoticeManage';

import AdminExplorationCatalog from './pages/Admin/ExplorationCatalog';
import AdminExplorationCatalogDetail from './pages/Admin/ExplorationCatalog/Detail';
import AdminExplorationCatalogActivityDetail from './pages/Admin/ExplorationCatalog/ActivityDetail';

import ErrorPage from './pages/Error';
import SessionModal from './pages/Auth/components/SessionModal';

const NotFoundPage = () => (
  <main className="flex min-h-[60vh] w-full items-center justify-center px-4 py-16">
    <div className="w-full max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
        <span
          className="material-symbols-outlined text-5xl text-secondary"
          aria-hidden="true"
        >
          search_off
        </span>
      </div>

      <p className="mb-3 text-sm font-bold text-secondary">
        404
      </p>

      <h1 className="mb-4 text-2xl font-bold text-primary-container sm:text-3xl">
        페이지를 찾을 수 없습니다
      </h1>

      <p className="mb-8 text-sm leading-relaxed text-on-surface-variant sm:text-base">
        요청하신 페이지의 주소가 잘못되었거나
        페이지가 이동 또는 삭제되었을 수 있습니다.
        주소를 다시 확인해 주세요.
      </p>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3 font-bold text-white"
        >
          <span
            className="material-symbols-outlined text-xl"
            aria-hidden="true"
          >
            home
          </span>
          홈으로 돌아가기
        </Link>

        <Link
          to="/library"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-3 font-semibold text-primary-container"
        >
          공지사항
        </Link>
      </div>
    </div>
  </main>
);

// 기존 진단 공유 링크는 API를 호출하지 않고
// 서비스 종료 안내만 표시합니다.
const LegacyShareUnavailable = () => (
  <main className="flex min-h-[60vh] items-center justify-center bg-surface px-4 py-12">
    <section className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm">
      <span
        className="material-symbols-outlined mb-4 text-5xl text-secondary"
        aria-hidden="true"
      >
        info
      </span>

      <h1 className="mb-3 text-xl font-bold text-primary-container">
        이전 방식 진단의 공유 결과는 더 이상 제공하지 않습니다
      </h1>

      <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
        현재 진로온에서는 전공 탐색 진단을 제공하고 있습니다.
        새 진단을 완료한 후 탐색 결과를 확인하고
        공유할 수 있습니다.
      </p>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-outline-variant/30 px-5 py-3 font-semibold text-primary-container"
        >
          홈으로 돌아가기
        </Link>

        {isExplorationEnabled && (
          <Link
            to={diagnosisEntryPath}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-container px-5 py-3 font-bold text-white"
          >
            전공 탐색 진단 시작하기
          </Link>
        )}
      </div>
    </section>
  </main>
);

const AdminRedirect = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuthStore();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const UserOnlyRoute = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const AdminOnlyRoute = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isLoggedIn, user } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();

  const sessionExpired = useAuthStore(
    (state) => state.sessionExpired,
  );

  const setSessionExpired = useAuthStore(
    (state) => state.setSessionExpired,
  );

  const isAuthPage =
    location.pathname.startsWith('/auth');

  const isMainPage =
    location.pathname === '/';

  const isAdminPage =
    location.pathname.startsWith('/admin');

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {!isAuthPage && !isAdminPage && <Header />}

      <div className="flex flex-grow flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <AdminRedirect>
                <Home />
                <Footer />
              </AdminRedirect>
            }
          />

          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route
            path="/auth/find-password"
            element={<FindPassword />}
          />

          {/* 이전 진단 시작 주소는 탐색 진단으로 이동 */}
          {[
            '/diagnosis',
            '/diagnosis/basic-info',
            '/diagnosis/tendency',
            '/diagnosis/quiz',
            '/diagnosis/loading',
          ].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <Navigate
                  to={diagnosisEntryPath}
                  replace
                />
              }
            />
          ))}

          <Route
            path="/diagnosis/exploration"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationIntro />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/diagnosis/exploration/session/:sessionId"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationQuestion />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/diagnosis/explore"
            element={
              <UserOnlyRoute>
                <MajorExplore />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/analysis/weak"
            element={
              <Navigate
                to="/analysis/dashboard"
                replace
              />
            }
          />

          <Route
            path="/analysis/dashboard"
            element={
              <UserOnlyRoute>
                <ResultHome />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/analysis/compare"
            element={
              <Navigate
                to="/analysis/dashboard?next=compare"
                replace
              />
            }
          />

          <Route
            path="/analysis/exploration/:sessionId"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationResult />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/analysis/exploration/:sessionId/compare"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationCompare />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/analysis/exploration/:sessionId/activities"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationActivities />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/analysis/exploration/:sessionId/ask"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationAsk />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/analysis/exploration/:sessionId/plan"
            element={
              isExplorationEnabled ? (
                <UserOnlyRoute>
                  <ExplorationPlan />
                </UserOnlyRoute>
              ) : (
                <Navigate
                  to="/analysis/dashboard"
                  replace
                />
              )
            }
          />

          <Route
            path="/analysis/*"
            element={<NotFoundPage />}
          />

          <Route
            path="/library"
            element={
              <UserOnlyRoute>
                <LibraryNotice />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/ai-chat"
            element={
              <Navigate
                to="/analysis/dashboard?next=ask"
                replace
              />
            }
          />

          <Route
            path="/mypage"
            element={
              <UserOnlyRoute>
                <MyPage />
              </UserOnlyRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminOnlyRoute>
                <AdminLayout />
              </AdminOnlyRoute>
            }
          >
            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="majors"
              element={<AdminMajorManage />}
            />

            <Route
              path="notices"
              element={<AdminNoticeManage />}
            />

            {isExplorationEnabled && (
              <>
                <Route
                  path="exploration-catalogs"
                  element={<AdminExplorationCatalog />}
                />

                <Route
                  path="exploration-catalogs/:catalogId"
                  element={<AdminExplorationCatalogDetail />}
                />

                <Route
                  path="exploration-catalogs/:catalogId/activities/:activityId"
                  element={
                    <AdminExplorationCatalogActivityDetail />
                  }
                />
              </>
            )}
          </Route>

          {/* 기존 진단 공유는 더 이상 제공하지 않음 */}
          <Route
            path="/results/share/:token"
            element={<LegacyShareUnavailable />}
          />

          {/* 탐색 진단 결과 공유는 정상 유지 */}
          <Route
            path="/exploration/share/:token"
            element={
              isExplorationEnabled ? (
                <ExplorationShared />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/error"
            element={<ErrorPage />}
          />

          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
      </div>

      {!isAuthPage && !isMainPage && !isAdminPage && (
        <FooterSimple />
      )}

      {sessionExpired && (
        <SessionModal
          onClose={() => setSessionExpired(false)}
        />
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppLayout />
  </BrowserRouter>
);

export default App;