import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = express.Router();

// 회원가입
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password, name } = req.body;

    // 유효성 검사
    if (!email || !username || !password) {
      return res.status(400).json({
        error: '이메일, 사용자명, 비밀번호는 필수입니다.',
      });
    }

    // 중복 확인
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

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
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

    // JWT 토큰 생성
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
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // JWT 토큰 생성
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
});

// 현재 사용자 정보 조회
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    ) as any;
    
    const user = await prisma.user.findUnique({
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
    res.status(401).json({
      error: '유효하지 않은 토큰입니다.',
    });
  }
});

// 로그아웃 (클라이언트 측에서 토큰 삭제하므로 서버에서는 단순 응답)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '로그아웃되었습니다.',
  });
});

export default router;

