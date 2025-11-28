import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Prisma 클라이언트 싱글톤 패턴 (Vercel Serverless Functions용)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
    // Prisma 클라이언트 초기화 확인
    if (!prisma) {
      throw new Error('Prisma 클라이언트가 초기화되지 않았습니다.');
    }
    const { email, username, password, name } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        error: '이메일, 사용자명, 비밀번호는 필수입니다.',
      });
    }

    const existingUser = await prisma.user.findFirst({
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

    const user = await prisma.user.create({
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
        error: '회원가입 중 오류가 발생했습니다.',
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

