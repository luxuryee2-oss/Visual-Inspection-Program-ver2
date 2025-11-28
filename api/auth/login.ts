import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn } as SignOptions
    );

    res.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
      token,
    });
  } catch (error: any) {
    console.error('로그인 오류:', error);
    console.error('에러 스택:', error.stack);
    
    // Prisma 연결 오류 확인
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      return res.status(500).json({
        error: '데이터베이스 연결에 실패했습니다. 데이터베이스 설정을 확인해주세요.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    return res.status(500).json({
      error: '로그인 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

