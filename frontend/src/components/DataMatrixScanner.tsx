import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { parseDataMatrix } from '@/utils/datamatrixParser';
import { Scan, X } from 'lucide-react';

interface DataMatrixScannerProps {
  onScanSuccess: (productName: string) => void;
  onClose?: () => void;
}

export function DataMatrixScanner({ onScanSuccess, onClose }: DataMatrixScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 카메라 정리
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // ZXing 스캐너 설정 (Data Matrix 우선)
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.DATA_MATRIX, BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      const codeReader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = codeReader;

      // 카메라 접근
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('카메라를 찾을 수 없습니다');
      }

      // 후면 카메라 우선 선택 (모바일)
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );

      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

      // 비디오 스트림 시작 (고해상도 및 자동 포커스 설정)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          facingMode: 'environment', // 후면 카메라
          width: { ideal: 3840, min: 1920 }, // 고해상도
          height: { ideal: 2160, min: 1080 },
          focusMode: 'continuous', // 자동 포커스
          zoom: { ideal: 2.0 }, // 줌 설정 (지원되는 경우)
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 비디오 메타데이터 로드 대기
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(null);
            };
          } else {
            resolve(null);
          }
        });
        
        await videoRef.current.play();
        
        // 카메라 설정 최적화 (지원되는 경우)
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const capabilities = track.getCapabilities();
          const settings = track.getSettings();
          
          // 자동 포커스 설정
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' }],
            });
          }
          
          // 줌 설정 (지원되는 경우)
          if (capabilities.zoom && capabilities.zoom.max > 1) {
            const zoomValue = Math.min(2.0, capabilities.zoom.max);
            await track.applyConstraints({
              advanced: [{ zoom: zoomValue }],
            });
          }
        }
      }

      // 스캔 시작 (고해상도 스캔을 위해 설정)
      if (!videoRef.current) {
        throw new Error('비디오 요소를 찾을 수 없습니다');
      }
      
      // ZXing 스캐너 설정 개선
      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
        if (result) {
          const scannedText = result.getText();
          console.log('스캔된 원본 데이터:', scannedText);
          console.log('스캔된 데이터 타입:', result.getBarcodeFormat());
          console.log('스캔된 데이터 길이:', scannedText.length);
          
          // 데이터 매트릭스 파싱
          const productName = parseDataMatrix(scannedText);
          
          if (productName) {
            stopScanning();
            onScanSuccess(productName);
          } else {
            setError(`데이터 매트릭스를 파싱할 수 없습니다.\n스캔된 데이터: ${scannedText.substring(0, 100)}...\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.`);
          }
        }
        
        if (err && !(err as any).name?.includes('NotFoundError')) {
          console.error('스캔 오류:', err);
        }
      });
    } catch (err: any) {
      console.error('카메라 접근 오류:', err);
      setError(err.message || '카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      // BrowserMultiFormatReader는 reset 메서드가 없으므로 null로 설정
      codeReaderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border-4 border-foreground shadow-lg w-full max-w-md">
        <div className="p-4 border-b-4 border-foreground flex items-center justify-between">
          <h2 className="text-xl font-bold">데이터 매트릭스 스캔</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="border-2 border-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {!isScanning ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                스캔 버튼을 눌러 카메라를 시작하세요.
              </p>
              <Button
                onClick={startScanning}
                className="w-full border-4 border-foreground shadow-lg"
                size="lg"
              >
                <Scan className="mr-2 h-5 w-5" />
                스캔 시작
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-square bg-black rounded-none border-4 border-foreground overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoFocus
                  style={{
                    transform: 'scale(1.5)', // 확대
                    transformOrigin: 'center',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-primary w-3/4 h-3/4 rounded-none" />
                  <div className="absolute top-2 left-2 right-2 text-center">
                    <p className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                      데이터 매트릭스를 프레임 안에 맞춰주세요
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={stopScanning}
                variant="destructive"
                className="w-full border-4 border-foreground shadow-lg"
                size="lg"
              >
                스캔 중지
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border-4 border-destructive text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


