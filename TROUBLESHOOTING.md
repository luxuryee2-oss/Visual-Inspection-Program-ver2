# Prisma 클라이언트 초기화 오류 해결 가이드

## 문제 증상
- 회원가입 시 "데이터베이스 클라이언트를 초기화할 수 없습니다" 오류
- Vercel Functions에서 500 Internal Server Error

## 확인 사항

### 1. Vercel 빌드 로그 확인
Vercel 대시보드 → Deployments → 최신 배포 → Build Logs에서 확인:

1. **Prisma 클라이언트 생성 확인**
   ```
   npx prisma generate --schema=backend/prisma/schema.prisma
   ```
   이 명령이 성공했는지 확인

2. **마이그레이션 확인**
   ```
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```
   이 명령이 성공했는지 확인

### 2. Vercel Functions 로그 확인
Vercel 대시보드 → Functions 탭 → `/api/auth/register` 함수 클릭

로그에서 다음 메시지 확인:
- "Prisma 클라이언트 로드 시도..."
- "@prisma/client 모듈 로드 실패" 또는 "Prisma 모듈 로드 성공"
- "node_modules/@prisma/client 존재: true/false"

### 3. 환경 변수 확인
Vercel 대시보드 → Settings → Environment Variables:

- `DATABASE_URL`: Postgres 데이터베이스 연결 문자열 (자동 생성됨)
- `JWT_SECRET`: JWT 토큰 서명용 비밀 키 (수동 설정 필요)

### 4. 데이터베이스 연결 테스트
배포 후 다음 URL로 테스트:
```
https://visual-inspection-program-ver2.vercel.app/api/test-db
```

## 해결 방법

### 방법 1: 빌드 로그에서 오류 확인
빌드 로그에 Prisma 관련 오류가 있다면:
1. `DATABASE_URL` 환경 변수가 설정되어 있는지 확인
2. Prisma 스키마 파일 경로가 올바른지 확인 (`backend/prisma/schema.prisma`)

### 방법 2: 수동 마이그레이션 실행
배포 후 다음 엔드포인트 호출:
```
POST https://visual-inspection-program-ver2.vercel.app/api/migrate
```

### 방법 3: Prisma 클라이언트 재생성
로컬에서:
```bash
cd backend
npx prisma generate --schema=prisma/schema.prisma
```

그리고 다시 푸시:
```bash
git add .
git commit -m "Regenerate Prisma client"
git push origin main
```

## 일반적인 원인

1. **Prisma 클라이언트가 생성되지 않음**
   - 빌드 로그에서 `prisma generate` 명령 실패 확인
   - `postinstall` 스크립트가 실행되지 않음

2. **DATABASE_URL이 설정되지 않음**
   - Vercel Postgres를 생성했지만 환경 변수가 추가되지 않음
   - Settings → Environment Variables에서 확인

3. **마이그레이션이 실행되지 않음**
   - 데이터베이스 테이블이 생성되지 않음
   - `/api/migrate` 엔드포인트로 수동 실행

4. **Prisma 클라이언트 경로 문제**
   - Vercel Functions는 루트의 `node_modules`를 사용
   - Prisma 클라이언트가 루트에 생성되어야 함

## 다음 단계

1. Vercel 빌드 로그를 확인하고 오류 메시지를 공유해주세요
2. Vercel Functions 로그를 확인하고 "Prisma 클라이언트 로드 시도..." 이후의 메시지를 공유해주세요
3. `/api/test-db` 엔드포인트 결과를 공유해주세요

이 정보를 바탕으로 더 정확한 해결책을 제시할 수 있습니다.
