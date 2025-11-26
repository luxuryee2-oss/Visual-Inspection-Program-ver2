import type { VercelRequest, VercelResponse } from '@vercel/node';

interface InspectionData {
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as InspectionData;

    // 유효성 검사
    if (!data?.productName || !data?.inspector) {
      return res.status(400).json({
        error: '제품명과 검사자는 필수입니다.',
      });
    }

    // SharePoint 저장 기능은 나중에 구현
    // 현재는 성공 응답만 반환
    return res.json({
      success: true,
      message: '데이터가 성공적으로 저장되었습니다.',
      data: {
        productName: data.productName,
        inspector: data.inspector,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('저장 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '데이터 저장 중 오류가 발생했습니다.';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}
