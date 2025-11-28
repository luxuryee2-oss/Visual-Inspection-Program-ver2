# 🚀 Vercel 배포 체크리스트

## 현재 상황

Vercel에 배포된 사이트(`https://visual-inspection-program-ver2.vercel.app`)에서 로그인 화면이 보이지 않는 문제가 있습니다.

## 확인 사항

### 1. 최신 코드가 배포되었는지 확인

Vercel 대시보드에서:
- 최근 배포 내역 확인
- 빌드 로그 확인
- 배포 상태 확인

### 2. 빌드 설정 확인

현재 `vercel.json` 설정:
- 프론트엔드 빌드: `cd frontend && npm run build`
- 출력 디렉토리: `frontend/dist`
- API 라우트: `api/**/*.ts`

### 3. 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수 설정:

```
VITE_API_BASE_URL=/api
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url (PostgreSQL 필요)
```

## 배포 방법

### 방법 1: Git 푸시 (자동 배포)

```bash
git add .
git commit -m "Add authentication system"
git push origin main
```

Vercel이 자동으로 배포합니다.

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

## 문제 해결

### 로그인 화면이 보이지 않는 경우

1. **브라우저 캐시 클리어**
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)
   - 또는 하드 리프레시: Ctrl+F5

2. **Local Storage 확인**
   - 개발자 도구 → Application → Local Storage
   - `token` 키가 있으면 삭제
   - 페이지 새로고침

3. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 → Build Logs
   - 오류 메시지 확인

4. **API 엔드포인트 확인**
   - 브라우저 콘솔(F12)에서 네트워크 탭 확인
   - `/api/auth/login` 요청이 실패하는지 확인

## 다음 단계

1. ✅ `vercel.json` 업데이트 완료
2. ⏳ Git에 푸시하여 재배포
3. ⏳ 환경 변수 설정 확인
4. ⏳ 배포 후 테스트

## 중요: 데이터베이스

현재 SQLite를 사용 중이지만, Vercel에서는 작동하지 않습니다. PostgreSQL로 마이그레이션해야 합니다.

### PostgreSQL 설정 방법

1. Vercel Postgres 추가:
   ```bash
   vercel postgres create
   ```

2. Prisma 스키마 변경:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. 마이그레이션:
   ```bash
   cd backend
   npx prisma migrate dev --name init_postgres
   ```

