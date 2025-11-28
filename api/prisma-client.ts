// Prisma 클라이언트 공통 유틸리티
// Vercel Serverless Functions에서 사용

let prisma: any = null;

export function getPrismaClient() {
  if (!prisma) {
    try {
      console.log('Prisma 클라이언트 로드 시도...');
      console.log('현재 작업 디렉토리:', process.cwd());
      
      let PrismaClient;
      try {
        const prismaModule = require('@prisma/client');
        PrismaClient = prismaModule.PrismaClient || prismaModule.default?.PrismaClient || prismaModule;
        console.log('Prisma 모듈 로드 성공:', !!PrismaClient);
      } catch (requireError: any) {
        console.error('@prisma/client 모듈 로드 실패:', requireError?.message);
        console.error('에러 스택:', requireError?.stack);
        
        // 대체 경로 시도
        try {
          const path = require('path');
          const fs = require('fs');
          const possiblePaths = [
            path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
            path.join(process.cwd(), 'backend', 'node_modules', '@prisma', 'client'),
          ];
          
          for (const modulePath of possiblePaths) {
            if (fs.existsSync(modulePath)) {
              try {
                PrismaClient = require(modulePath).PrismaClient;
                console.log('대체 경로에서 Prisma 클라이언트 발견:', modulePath);
                break;
              } catch {
                // 계속 시도
              }
            }
          }
        } catch {
          // 무시
        }
        
        if (!PrismaClient) {
          throw new Error(`@prisma/client 모듈을 찾을 수 없습니다. Prisma 클라이언트가 생성되었는지 확인해주세요. (${requireError?.message})`);
        }
      }
      
      if (!PrismaClient) {
        throw new Error('PrismaClient를 찾을 수 없습니다. Prisma 클라이언트가 생성되었는지 확인해주세요.');
      }
      
      console.log('PrismaClient 생성 시도...');
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      console.log('Prisma 클라이언트 초기화 성공');
    } catch (error: any) {
      console.error('Prisma 클라이언트 초기화 실패:', error);
      console.error('에러 메시지:', error?.message);
      console.error('에러 스택:', error?.stack);
      console.error('에러 이름:', error?.name);
      console.error('에러 코드:', error?.code);
      
      // 더 자세한 디버깅 정보
      try {
        const fs = require('fs');
        const path = require('path');
        const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
        const exists = fs.existsSync(nodeModulesPath);
        console.error('node_modules/@prisma/client 존재:', exists);
        
        if (exists) {
          const files = fs.readdirSync(nodeModulesPath);
          console.error('@prisma/client 디렉토리 내용:', files.slice(0, 10));
        }
      } catch (fsError) {
        console.error('파일 시스템 확인 실패:', fsError);
      }
      
      throw new Error(`데이터베이스 클라이언트를 초기화할 수 없습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  }
  return prisma;
}

