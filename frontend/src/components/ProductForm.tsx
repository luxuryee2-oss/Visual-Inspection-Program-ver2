import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { DataMatrixScanner } from './DataMatrixScanner';
import { FourDirectionPhotoCapture } from './PhotoCapture';
import { Scan, Save, Loader2 } from 'lucide-react';

export interface InspectionData {
  productName: string;
  inspector: string;
  notes: string;
  photos: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
  };
}

interface ProductFormProps {
  onSubmit: (data: InspectionData) => Promise<void>;
}

export function ProductForm({ onSubmit }: ProductFormProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InspectionData>({
    productName: '',
    inspector: '',
    notes: '',
    photos: {
      front: null,
      back: null,
      left: null,
      right: null,
    },
  });

  const handleScanSuccess = (productName: string) => {
    setFormData((prev) => ({
      ...prev,
      productName,
    }));
    setShowScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      alert('제품명을 입력하거나 스캔해주세요.');
      return;
    }

    if (!formData.inspector.trim()) {
      alert('검사자 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // 성공 후 폼 초기화
      setFormData({
        productName: '',
        inspector: '',
        notes: '',
        photos: {
          front: null,
          back: null,
          left: null,
          right: null,
        },
      });
      alert('저장되었습니다.');
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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

          {/* 제품명 */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="productName" className="text-base font-bold">
              제품명
            </Label>
            <div className="flex gap-2">
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productName: e.target.value,
                  }))
                }
                placeholder="제품명을 입력하거나 스캔하세요"
                className="border-4 border-foreground flex-1"
              />
              <Button
                type="button"
                onClick={() => setShowScanner(true)}
                className="border-4 border-foreground shadow-lg"
              >
                <Scan className="mr-2 h-4 w-4" />
                스캔
              </Button>
            </div>
          </div>

          {/* 검사자 */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="inspector" className="text-base font-bold">
              검사자
            </Label>
            <Input
              id="inspector"
              value={formData.inspector}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  inspector: e.target.value,
                }))
              }
              placeholder="검사자 이름을 입력하세요"
              className="border-4 border-foreground"
              required
            />
          </div>

          {/* 비고 */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="notes" className="text-base font-bold">
              비고
            </Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="비고를 입력하세요 (선택사항)"
              className="border-4 border-foreground"
            />
          </div>

          {/* 4방향 사진 */}
          <div className="space-y-2 mb-6">
            <Label className="text-base font-bold">사진 촬영</Label>
            <FourDirectionPhotoCapture
              photos={formData.photos}
              onPhotosChange={(photos) =>
                setFormData((prev) => ({
                  ...prev,
                  photos,
                }))
              }
            />
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full border-4 border-foreground shadow-lg text-lg py-6"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                저장
              </>
            )}
          </Button>
        </Card>
      </form>

      {/* 데이터 매트릭스 스캐너 모달 */}
      {showScanner && (
        <DataMatrixScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}


