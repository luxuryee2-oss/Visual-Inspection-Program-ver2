import express from 'express';

const app = express();
const PORT = 3000;

console.log('🚀 간단한 서버 시작...');

app.get('/api/inspection/direct-test', (req, res) => {
  console.log('✅ direct-test 라우트 실행!');
  res.json({ message: '작동합니다!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`테스트: http://localhost:${PORT}/api/inspection/direct-test`);
});




