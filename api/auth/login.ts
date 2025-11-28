import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const user = await prisma.user.findUnique({
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
    res.status(500).json({
      error: '로그인 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

