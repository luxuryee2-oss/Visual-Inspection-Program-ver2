import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-4 border-foreground shadow-lg w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        <CardDescription>계정에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border-4 border-destructive text-destructive text-sm rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              title="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-4 border-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              title="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-4 border-foreground"
            />
          </div>

          <Button
            type="submit"
            className="w-full border-4 border-foreground shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

