import express, { Request, Response } from 'express';
import { saveToSharePoint } from '../services/sharepoint';

const router = express.Router();

interface InspectionRequestBody {
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

router.post('/', async (req: Request, res: Response) => {
  try {
    const data: InspectionRequestBody = req.body;

    // 유효성 검사
    if (!data.productName || !data.inspector) {
      return res.status(400).json({
        error: '제품명과 검사자는 필수입니다.',
      });
    }

    // SharePoint에 저장
    const result = await saveToSharePoint(data);

    res.json({
      success: true,
      message: '데이터가 성공적으로 저장되었습니다.',
      data: result,
    });
  } catch (error: any) {
    console.error('저장 오류:', error);
    const errorMessage = error?.message || '데이터 저장 중 오류가 발생했습니다.';
    console.error('상세 오류 정보:', {
      message: errorMessage,
      stack: error?.stack,
      name: error?.name,
    });
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
});

export default router;




