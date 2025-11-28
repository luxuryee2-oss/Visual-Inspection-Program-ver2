import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

// Prisma 클라이언트 지연 로딩 (Vercel Serverless Functions용)
let prisma: any = null;

function getPrismaClient() {
  if (!prisma) {
    try {
      console.log('Prisma 클라이언트 로드 시도...');
      let PrismaClient;
      try {
        const prismaModule = require('@prisma/client');
        PrismaClient = prismaModule.PrismaClient || prismaModule.default?.PrismaClient || prismaModule;
      } catch (requireError: any) {
        console.error('@prisma/client 모듈 로드 실패:', requireError?.message);
        throw new Error(`@prisma/client 모듈을 찾을 수 없습니다: ${requireError?.message}`);
      }
      
      if (!PrismaClient) {
        throw new Error('PrismaClient를 찾을 수 없습니다.');
      }
      
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      console.log('Prisma 클라이언트 초기화 성공');
    } catch (error: any) {
      console.error('Prisma 클라이언트 초기화 실패:', error);
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

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // Prisma 클라이언트 가져오기
    let prismaClient;
    try {
      prismaClient = getPrismaClient();
      console.log('Prisma 클라이언트 가져오기 성공');
    } catch (prismaError: any) {
      console.error('Prisma 클라이언트 가져오기 오류:', prismaError);
      return res.status(500).json({
        success: false,
        error: '데이터베이스 클라이언트를 초기화할 수 없습니다. 데이터베이스 설정을 확인해주세요.',
        details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined,
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
    console.error('에러 스택:', error?.stack);
    console.error('에러 코드:', error?.code);
    console.error('에러 메시지:', error?.message);
    
    // 항상 JSON 응답 보장
    try {
      // Prisma 연결 오류 확인
      if (error?.code === 'P1001' || error?.code === 'P1000' || error?.message?.includes('Can\'t reach database server') || error?.message?.includes('database')) {
        return res.status(500).json({
          success: false,
          error: '데이터베이스 연결에 실패했습니다. 데이터베이스 설정을 확인해주세요.',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        });
      }

      // Prisma 스키마 오류
      if (error?.code?.startsWith('P')) {
        return res.status(500).json({
          success: false,
          error: '데이터베이스 오류가 발생했습니다.',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        });
      }

      return res.status(500).json({
        success: false,
        error: '로그인 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
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

