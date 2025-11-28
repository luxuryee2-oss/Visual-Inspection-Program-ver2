import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      // 토큰이 없으면 즉시 로딩 종료 (로그인 화면 표시)
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // 토큰이 유효하지 않으면 제거하고 로그인 화면 표시
        console.log('토큰이 유효하지 않습니다. 로그인 화면으로 이동합니다.');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      // 네트워크 오류 등으로 실패해도 로그인 화면 표시
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error('서버에서 응답이 없습니다.');
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('서버 응답을 파싱할 수 없습니다. 서버 오류가 발생했을 수 있습니다.');
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || '로그인 실패');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const register = async (email: string, username: string, password: string, name?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password, name }),
    });

    let data;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error('서버에서 응답이 없습니다.');
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('서버 응답을 파싱할 수 없습니다. 서버 오류가 발생했을 수 있습니다.');
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || '회원가입 실패');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

