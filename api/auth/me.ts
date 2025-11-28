import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// Prisma 클라이언트 지연 로딩 (Vercel Serverless Functions용)
let prisma: any = null;

function getPrismaClient() {
  if (!prisma) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    } catch (error) {
      console.error('Prisma 클라이언트 초기화 실패:', error);
      throw new Error('데이터베이스 클라이언트를 초기화할 수 없습니다.');
    }
  }
  return prisma;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    ) as any;
    
    // Prisma 클라이언트 가져오기
    const prismaClient = getPrismaClient();
    
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('사용자 정보 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    
    // Prisma 연결 오류 확인
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      return res.status(500).json({
        error: '데이터베이스 연결에 실패했습니다. 데이터베이스 설정을 확인해주세요.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    // JWT 오류
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '유효하지 않은 토큰입니다.',
      });
    }

    return res.status(500).json({
      error: '사용자 정보 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

