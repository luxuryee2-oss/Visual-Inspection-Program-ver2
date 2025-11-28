import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { execSync } = require('child_process');
    const path = require('path');

    console.log('마이그레이션 시작...');
    console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);

    // Prisma 마이그레이션 실행
    const result = execSync(
      'npx prisma migrate deploy --schema=backend/prisma/schema.prisma',
      {
        cwd: path.join(process.cwd()),
        env: { ...process.env },
        encoding: 'utf8',
      }
    );

    console.log('마이그레이션 결과:', result);

    res.json({
      success: true,
      message: '데이터베이스 마이그레이션이 완료되었습니다.',
      output: result,
    });
  } catch (error: any) {
    console.error('마이그레이션 오류:', error);
    res.status(500).json({
      success: false,
      error: error?.message || '마이그레이션 실패',
      output: error?.stdout || error?.stderr || error?.message,
    });
  }
}

