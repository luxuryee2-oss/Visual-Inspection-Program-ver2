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
        log: ['error'],
      });
    } catch (error: any) {
      console.error('Prisma 클라이언트 초기화 실패:', error);
      console.error('에러 메시지:', error?.message);
      console.error('에러 스택:', error?.stack);
      throw new Error(`데이터베이스 클라이언트를 초기화할 수 없습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  }
  return prisma;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 초기 로깅
  console.log('회원가입 요청 수신');
  console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET 존재:', !!process.env.JWT_SECRET);

  try {
    const { email, username, password, name } = req.body;
    console.log('요청 본문:', { email, username, hasPassword: !!password, name });
    
    // Prisma 클라이언트 가져오기
    let prismaClient;
    try {
      prismaClient = getPrismaClient();
    } catch (prismaError: any) {
      console.error('Prisma 클라이언트 초기화 오류:', prismaError);
      return res.status(500).json({
        success: false,
        error: '데이터베이스 클라이언트를 초기화할 수 없습니다. 데이터베이스 설정을 확인해주세요.',
        details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined,
      });
    }

    if (!email || !username || !password) {
      return res.status(400).json({
        error: '이메일, 사용자명, 비밀번호는 필수입니다.',
      });
    }

    const existingUser = await prismaClient.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: '이미 사용 중인 이메일 또는 사용자명입니다.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prismaClient.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn } as SignOptions
    );

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user,
      token,
    });
  } catch (error: any) {
    console.error('회원가입 오류:', error);
    console.error('에러 스택:', error?.stack);
    console.error('에러 코드:', error?.code);
    console.error('에러 메시지:', error?.message);
    
    // 항상 JSON 응답 보장
    try {
      // Prisma 연결 오류 확인
      if (error?.code === 'P1001' || error?.code === 'P1000' || error?.message?.includes('Can\'t reach database server') || error?.message?.includes('database') || error?.message?.includes('DATABASE_URL')) {
        return res.status(500).json({
          success: false,
          error: '데이터베이스 연결에 실패했습니다. Vercel Postgres 데이터베이스를 생성하고 DATABASE_URL 환경 변수를 설정해주세요.',
          code: error?.code,
          details: error?.message,
        });
      }

      // Prisma 스키마 오류
      if (error?.code?.startsWith('P')) {
        return res.status(500).json({
          success: false,
          error: '데이터베이스 오류가 발생했습니다.',
          code: error?.code,
          details: error?.message,
        });
      }

      // Prisma 클라이언트 초기화 오류
      if (error?.message?.includes('PrismaClient') || error?.message?.includes('초기화')) {
        return res.status(500).json({
          success: false,
          error: '데이터베이스 클라이언트 초기화에 실패했습니다. Prisma 클라이언트가 빌드되었는지 확인해주세요.',
          details: error?.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: '회원가입 중 오류가 발생했습니다.',
        code: error?.code,
        details: error?.message,
        type: error?.name || typeof error,
      });
    } catch (jsonError) {
      // JSON 응답도 실패하는 경우 (매우 드뭄)
      console.error('JSON 응답 생성 실패:', jsonError);
      return res.status(500).send(JSON.stringify({
        success: false,
        error: '서버 오류가 발생했습니다.',
      }));
    }
  }
}

