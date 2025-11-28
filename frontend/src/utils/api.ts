const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

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

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// 인증 토큰을 포함한 헤더 가져오기
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function saveInspectionData(data: InspectionData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/inspection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = '저장에 실패했습니다.';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        
        // 인증 오류인 경우
        if (response.status === 401 || response.status === 403) {
          errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
          localStorage.removeItem('token');
          window.location.reload();
        }
      } catch {
        errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result: ApiResponse = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }
    throw error;
  }
}

export async function getInspectionHistory(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/inspection/history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.reload();
        throw new Error('인증이 필요합니다.');
      }
      throw new Error('검사 이력 조회에 실패했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}
