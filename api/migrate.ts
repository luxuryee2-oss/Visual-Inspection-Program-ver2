import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('마이그레이션 시작...');
    console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);

    // Prisma Client 가져오기
    let PrismaClient;
    try {
      const prismaModule = require('@prisma/client');
      PrismaClient = prismaModule.PrismaClient || prismaModule.default?.PrismaClient || prismaModule;
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Prisma Client를 찾을 수 없습니다.',
        details: error?.message,
      });
    }

    const prisma = new PrismaClient({
      log: ['error'],
    });

    try {
      // 테이블이 존재하는지 확인하고, 없으면 생성
      console.log('데이터베이스 연결 확인...');
      
      // User 테이블 생성
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "username" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        )
      `);

      // User 테이블에 unique 제약 조건 추가
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'User_email_key'
          ) THEN
            ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
          END IF;
        END $$;
      `);

      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'User_username_key'
          ) THEN
            ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
          END IF;
        END $$;
      `);

      // Inspection 테이블 생성
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Inspection" (
          "id" TEXT NOT NULL,
          "productName" TEXT NOT NULL,
          "inspector" TEXT NOT NULL,
          "notes" TEXT,
          "photos" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
        )
      `);

      // Inspection 테이블에 외래 키 추가
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'Inspection_userId_fkey'
          ) THEN
            ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      // 인덱스 생성
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Inspection_userId_idx" ON "Inspection"("userId");
      `);

      console.log('마이그레이션 완료');

      res.json({
        success: true,
        message: '데이터베이스 마이그레이션이 완료되었습니다.',
      });
    } catch (dbError: any) {
      console.error('데이터베이스 오류:', dbError);
      throw dbError;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error: any) {
    console.error('마이그레이션 오류:', error);
    res.status(500).json({
      success: false,
      error: error?.message || '마이그레이션 실패',
      details: error?.stack,
    });
  }
}
