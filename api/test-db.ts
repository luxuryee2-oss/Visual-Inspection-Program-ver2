import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Prisma 클라이언트 테스트
    let prismaStatus = 'not initialized';
    let prismaError = null;
    
    try {
      const { PrismaClient } = require('@prisma/client');
      if (PrismaClient) {
        prismaStatus = 'PrismaClient found';
        const prisma = new PrismaClient();
        prismaStatus = 'PrismaClient created';
        await prisma.$connect();
        prismaStatus = 'PrismaClient connected';
        await prisma.$disconnect();
        prismaStatus = 'PrismaClient disconnected';
      } else {
        prismaStatus = 'PrismaClient not found';
      }
    } catch (error: any) {
      prismaError = {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      };
      prismaStatus = 'PrismaClient error';
    }

    res.json({
      success: true,
      message: '데이터베이스 연결 테스트',
      prismaStatus,
      prismaError,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || '알 수 없는 오류',
      stack: error?.stack,
    });
  }
}

