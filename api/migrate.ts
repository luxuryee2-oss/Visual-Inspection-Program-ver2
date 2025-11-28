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
    const fs = require('fs');

    console.log('마이그레이션 시작...');
    console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);
    console.log('현재 작업 디렉토리:', process.cwd());

    // prisma.config.ts 파일이 backend 디렉토리에 있는지 확인
    const configPath = path.join(process.cwd(), 'backend', 'prisma.config.ts');
    const schemaPath = path.join(process.cwd(), 'backend', 'prisma', 'schema.prisma');
    
    console.log('Config 파일 경로:', configPath);
    console.log('Config 파일 존재:', fs.existsSync(configPath));
    console.log('Schema 파일 경로:', schemaPath);
    console.log('Schema 파일 존재:', fs.existsSync(schemaPath));

    // Prisma 마이그레이션 실행
    // Prisma 7에서는 prisma.config.ts를 사용하므로 --config 옵션 사용
    let result;
    try {
      // 먼저 backend 디렉토리로 이동하여 실행
      result = execSync(
        'npx prisma migrate deploy',
        {
          cwd: path.join(process.cwd(), 'backend'),
          env: { ...process.env },
          encoding: 'utf8',
        }
      );
    } catch (execError: any) {
      // --schema 옵션으로 재시도
      console.log('--schema 옵션으로 재시도...');
      result = execSync(
        'npx prisma migrate deploy --schema=prisma/schema.prisma',
        {
          cwd: path.join(process.cwd(), 'backend'),
          env: { ...process.env },
          encoding: 'utf8',
        }
      );
    }

    console.log('마이그레이션 결과:', result);

    res.json({
      success: true,
      message: '데이터베이스 마이그레이션이 완료되었습니다.',
      output: result,
    });
  } catch (error: any) {
    console.error('마이그레이션 오류:', error);
    console.error('에러 메시지:', error?.message);
    console.error('에러 스택:', error?.stack);
    res.status(500).json({
      success: false,
      error: error?.message || '마이그레이션 실패',
      output: error?.stdout || error?.stderr || error?.message,
      details: error?.stack,
    });
  }
}

