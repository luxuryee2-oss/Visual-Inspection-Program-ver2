import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

type PhotoDirection = 'front' | 'back' | 'left' | 'right';

interface PhotoCaptureProps {
  direction: PhotoDirection;
  label: string;
  photo: string | null;
  onPhotoChange: (photo: string | null) => void;
}

export function PhotoCapture({ label, photo, onPhotoChange }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 후면 카메라
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('카메라 접근 오류:', err);
      setError(err.message || '카메라에 접근할 수 없습니다.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    onPhotoChange(dataUrl);
    stopCamera();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onPhotoChange(result);
      setError(null);
    };
    reader.onerror = () => {
      setError('파일을 읽을 수 없습니다.');
    };
    reader.readAsDataURL(file);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
    setError(null);
  };

  return (
    <Card className="border-4 border-foreground shadow-lg">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{label}</h3>
          {photo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemovePhoto}
              className="border-2 border-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {photo ? (
          <div className="space-y-2">
            <div className="relative aspect-square bg-black rounded-none border-4 border-foreground overflow-hidden">
              <img
                src={photo}
                alt={label}
                className="w-full h-full object-contain"
              />
            </div>
            <Button
              onClick={handleRemovePhoto}
              variant="outline"
              className="w-full border-4 border-foreground"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              다시 촬영
            </Button>
          </div>
        ) : isCapturing ? (
          <div className="space-y-2">
            <div className="relative aspect-square bg-black rounded-none border-4 border-foreground overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                className="flex-1 border-4 border-foreground shadow-lg"
                size="lg"
              >
                <Camera className="mr-2 h-4 w-4" />
                촬영
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1 border-4 border-foreground"
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={startCamera}
                className="flex-1 border-4 border-foreground shadow-lg"
                size="lg"
              >
                <Camera className="mr-2 h-4 w-4" />
                촬영
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 border-4 border-foreground"
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {error && (
          <div className="p-2 bg-destructive/10 border-2 border-destructive text-destructive text-xs">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}

interface FourDirectionPhotoCaptureProps {
  photos: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
  };
  onPhotosChange: (photos: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
  }) => void;
}

export function FourDirectionPhotoCapture({
  photos,
  onPhotosChange,
}: FourDirectionPhotoCaptureProps) {
  const updatePhoto = (direction: PhotoDirection, photo: string | null) => {
    onPhotosChange({
      ...photos,
      [direction]: photo,
    });
  };

  return (
    <div className="space-y-4">
      <PhotoCapture
        direction="front"
        label="정면"
        photo={photos.front}
        onPhotoChange={(photo) => updatePhoto('front', photo)}
      />
      <PhotoCapture
        direction="back"
        label="후면"
        photo={photos.back}
        onPhotoChange={(photo) => updatePhoto('back', photo)}
      />
      <PhotoCapture
        direction="left"
        label="좌측"
        photo={photos.left}
        onPhotoChange={(photo) => updatePhoto('left', photo)}
      />
      <PhotoCapture
        direction="right"
        label="우측"
        photo={photos.right}
        onPhotoChange={(photo) => updatePhoto('right', photo)}
      />
    </div>
  );
}




