import './App.css';
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EditorPage from './components/EditorPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import ProfilePage from './pages/ProfilePage';
import Error500Page from './pages/Error500Page';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Layout>
          <div>
            <Toaster position='top-center' toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
                fontFamily: 'var(--font-ui)',
                fontSize: '14px',
              },
            }}></Toaster>
          </div>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/success" element={<AuthSuccessPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/editor/:roomId" element={<EditorPage />} />
            <Route path="/500" element={<Error500Page />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/chat' element={<ChatPage />} />
              <Route path='/chat/:friendId' element={<ChatPage />} />
            </Route>
          </Routes>
        </Layout>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
