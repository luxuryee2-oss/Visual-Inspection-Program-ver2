import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
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

// 검사 데이터 저장 (인증 필요)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('📥 새로운 저장 요청 수신');
  console.log('='.repeat(60));
  
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const data: InspectionRequestBody = req.body;
    console.log('요청 데이터:', {
      productName: data.productName,
      inspector: data.inspector,
      notesLength: data.notes?.length || 0,
      photos: {
        front: data.photos?.front ? '있음' : '없음',
        back: data.photos?.back ? '있음' : '없음',
        left: data.photos?.left ? '있음' : '없음',
        right: data.photos?.right ? '있음' : '없음',
      },
    });

    // 유효성 검사
    if (!data.productName || !data.inspector) {
      console.error('❌ 유효성 검사 실패:', {
        hasProductName: !!data.productName,
        hasInspector: !!data.inspector,
      });
      return res.status(400).json({
        error: '제품명과 검사자는 필수입니다.',
      });
    }

    console.log('✅ 유효성 검사 통과');

    // 데이터베이스에 저장
    const photosJson = JSON.stringify(data.photos);
    const inspection = await prisma.inspection.create({
      data: {
        productName: data.productName,
        inspector: data.inspector,
        notes: data.notes || null,
        photos: photosJson,
        userId: userId,
      },
    });

    console.log('✅ 데이터베이스 저장 완료');

    // SharePoint에도 저장 (선택적)
    let sharePointResult = null;
    try {
      console.log('🔄 SharePoint 저장 시작...');
      sharePointResult = await saveToSharePoint(data);
      console.log('✅ SharePoint 저장 완료');
    } catch (sharePointError: any) {
      console.warn('⚠️ SharePoint 저장 실패 (데이터베이스에는 저장됨):', sharePointError.message);
      // SharePoint 저장 실패해도 데이터베이스 저장은 성공했으므로 계속 진행
    }

    const elapsedTime = Date.now() - startTime;
    console.log('='.repeat(60));
    console.log('✅ 저장 완료! (소요 시간:', elapsedTime, 'ms)');
    console.log('='.repeat(60));

    res.json({
      success: true,
      message: '데이터가 성공적으로 저장되었습니다.',
      data: {
        id: inspection.id,
        productName: inspection.productName,
        inspector: inspection.inspector,
        createdAt: inspection.createdAt,
        sharePoint: sharePointResult,
      },
    });
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    console.error('='.repeat(60));
    console.error('❌ 저장 오류 발생! (소요 시간:', elapsedTime, 'ms)');
    console.error('='.repeat(60));
    console.error('오류 타입:', error?.constructor?.name);
    console.error('오류 메시지:', error?.message);
    console.error('오류 스택:', error?.stack);
    
    const errorMessage = error?.message || '데이터 저장 중 오류가 발생했습니다.';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
});

// 사용자의 검사 이력 조회
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const inspections = await prisma.inspection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productName: true,
        inspector: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: inspections,
    });
  } catch (error: any) {
    console.error('검사 이력 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '검사 이력 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
});

export default router;
