import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 서버 시작 중...');

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 모든 요청 로깅 (디버깅용)
app.use((req, res, next) => {
  console.log(`📥 요청: ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  res.json({ message: 'API 서버가 정상 작동 중입니다!', timestamp: new Date().toISOString() });
});

// 라우트 로딩 및 등록
(async () => {
  try {
    console.log('🔍 라우터 파일 로딩 시도...');
    
    // 인증 라우트
    const authRoutes = (await import('./routes/auth')).default;
    app.use('/api/auth', authRoutes);
    console.log('✅ 인증 라우트 등록 완료: /api/auth');
    
    // 검사 데이터 라우트
    const inspectionRoutes = (await import('./routes/inspection')).default;
    app.use('/api/inspection', inspectionRoutes);
    console.log('✅ 검사 데이터 라우트 등록 완료: /api/inspection');
    
    console.log('✅ 모든 라우트 등록 완료!');
  } catch (error: any) {
    console.error('❌ 라우터 로딩 실패:', error);
    console.error('❌ 오류 스택:', error.stack);
    console.error('⚠️  일부 라우트가 로드되지 않았지만 서버는 계속 실행됩니다.');
  }
})();

app.listen(PORT, () => {
  console.log(`\n`);
  console.log(`========================================`);
  console.log(`✅✅✅ 서버가 포트 ${PORT}에서 실행 중입니다. ✅✅✅`);
  console.log(`========================================`);
  console.log(`\nAPI 엔드포인트:`);
  console.log(`  - Health: http://localhost:${PORT}/api/health`);
  console.log(`  - 회원가입: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`  - 로그인: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  - 사용자 정보: GET http://localhost:${PORT}/api/auth/me`);
  console.log(`  - 로그아웃: POST http://localhost:${PORT}/api/auth/logout`);
  console.log(`  - 검사 데이터 저장: POST http://localhost:${PORT}/api/inspection`);
  console.log(`========================================\n`);
});

