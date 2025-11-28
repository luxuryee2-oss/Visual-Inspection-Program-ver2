import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Button } from './components/ui/button';
import { ProductForm } from './components/ProductForm';
import './index.css';

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          {showRegister ? (
            <>
              <RegisterForm />
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowRegister(false)}
                  className="border-2 border-foreground"
                >
                  이미 계정이 있으신가요? 로그인
                </Button>
              </div>
            </>
          ) : (
            <>
              <LoginForm />
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowRegister(true)}
                  className="border-2 border-foreground"
                >
                  계정이 없으신가요? 회원가입
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-foreground bg-card p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">완제품 확인검사</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user.name || user.username} ({user.email})
            </span>
            <Button
              onClick={logout}
              variant="outline"
              className="border-2 border-foreground"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <main className="p-4">
        <ProductForm />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
