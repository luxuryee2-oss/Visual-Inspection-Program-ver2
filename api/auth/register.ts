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
    res.status(500).json({
      error: '회원가입 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

