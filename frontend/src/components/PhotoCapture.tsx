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

  // 모든 활성 미디어 스트림 강제 정리
  const cleanupAllStreams = async () => {
    try {
      // 현재 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }

      // 비디오 요소 정리
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }

      // 페이지의 모든 비디오 요소에서 스트림 정리
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          video.srcObject = null;
          video.pause();
        }
      });

      // 충분한 대기 시간 (카메라 하드웨어 해제 시간)
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (e) {
      console.warn('스트림 정리 중 오류:', e);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);

      // 모든 스트림 강제 정리
      await cleanupAllStreams();

      // 사용 가능한 비디오 입력 장치 확인
      let selectedDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // 후면 카메라 우선 선택
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        selectedDeviceId = backCamera?.deviceId || videoDevices[0]?.deviceId;
      } catch (e) {
        console.warn('장치 열거 실패, 기본 설정 사용:', e);
      }

      // 카메라 접근 (더 유연한 설정)
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { 
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          : { 
              facingMode: 'environment', // 후면 카메라
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 비디오 메타데이터 로드 대기
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('비디오 요소를 찾을 수 없습니다'));
            return;
          }
          
          const timeout = setTimeout(() => {
            reject(new Error('비디오 로드 시간 초과'));
          }, 5000);
          
          videoRef.current!.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          
          videoRef.current!.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
          };
        });
        
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('카메라 접근 오류:', err);
      let errorMessage = '카메라에 접근할 수 없습니다.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '카메라를 찾을 수 없습니다.';
      } else if (err.name === 'NotReadableError' || err.message?.includes('Could not start video source')) {
        errorMessage = '카메라가 다른 앱에서 사용 중이거나 접근할 수 없습니다. 다른 앱을 종료하고 다시 시도해주세요.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setIsCapturing(false);
      
      // 오류 발생 시 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
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
                className="flex-1 border-4 border-foreground shadow-lg text-sm py-2"
                size="sm"
              >
                <Camera className="mr-1 h-3 w-3" />
                촬영
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1 border-4 border-foreground text-sm py-2"
                size="sm"
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
                className="flex-1 border-4 border-foreground shadow-lg text-sm py-2"
                size="sm"
              >
                <Camera className="mr-1 h-3 w-3" />
                촬영
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 border-4 border-foreground text-sm py-2"
                size="sm"
              >
                <Upload className="mr-1 h-3 w-3" />
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




