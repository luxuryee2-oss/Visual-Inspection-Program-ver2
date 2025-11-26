import type { InspectionData } from '@/components/ProductForm';

// Vercel 배포 환경에서는 /api 경로 사용, 로컬에서는 localhost 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function saveInspectionData(data: InspectionData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = '저장에 실패했습니다.';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
        errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result: ApiResponse = await response.json();
    return result;
  } catch (error) {
    // 네트워크 오류 처리
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }
    throw error;
  }
}


