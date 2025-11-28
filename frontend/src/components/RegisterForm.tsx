import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, username, password, name || undefined);
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-4 border-foreground shadow-lg w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription>새 계정을 만드세요</CardDescription>
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
            <Label htmlFor="username">사용자명</Label>
            <Input
              id="username"
              type="text"
              placeholder="사용자명을 입력하세요"
              title="사용자명"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border-4 border-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름 (선택사항)</Label>
            <Input
              id="name"
              type="text"
              placeholder="이름을 입력하세요"
              title="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-4 border-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              title="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-4 border-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              title="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-4 border-foreground"
            />
          </div>

          <Button
            type="submit"
            className="w-full border-4 border-foreground shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? '회원가입 중...' : '회원가입'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

