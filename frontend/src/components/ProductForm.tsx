import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { saveInspectionData, type InspectionData } from '@/utils/api';
import { Scan } from 'lucide-react';

export function ProductForm() {
  const [productName, setProductName] = useState('');
  const [inspector, setInspector] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const data: InspectionData = {
        productName,
        inspector,
        notes,
        photos: {
          front: null,
          back: null,
          left: null,
          right: null,
        },
      };

      const result = await saveInspectionData(data);
      setMessage({ type: 'success', text: result.message || '저장되었습니다.' });
      
      // 폼 초기화
      setProductName('');
      setInspector('');
      setNotes('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '저장에 실패했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-2xl mx-auto">
      <Card className="border-4 border-foreground shadow-lg p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">완제품 확인검사</h1>
          <div className="w-48 h-20 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Kyungshin Corp"
              className="max-h-full max-w-full object-contain drop-shadow-lg"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productName">제품명</Label>
            <div className="flex gap-2">
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="제품명을 입력하거나 스캔하세요"
                title="제품명"
                required
                className="border-4 border-foreground flex-1"
              />
              <Button
                type="button"
                variant="outline"
                className="border-4 border-foreground"
              >
                <Scan className="mr-2 h-4 w-4" />
                스캔
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspector">검사자</Label>
            <Input
              id="inspector"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              placeholder="검사자 이름을 입력하세요"
              title="검사자"
              required
              className="border-4 border-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="비고를 입력하세요 (선택사항)"
              title="비고"
              className="border-4 border-foreground"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded border-4 ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-red-50 border-red-500 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            className="w-full border-4 border-foreground shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
