# Vercel Postgres 설정 가이드

## 1. Vercel Postgres 데이터베이스 생성

### 방법 A: Vercel 대시보드에서 생성
1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 선택: `Visual-Inspection-Program-ver2`
3. **Storage** 탭 클릭
4. **Create Database** 버튼 클릭
5. **Postgres** 선택
6. 데이터베이스 이름 입력 (예: `visual-inspection-db`)
7. 지역 선택 (가장 가까운 지역, 예: `Seoul` 또는 `Tokyo`)
8. **Create** 클릭

### 방법 B: Vercel CLI 사용
```bash
vercel postgres create visual-inspection-db
```

## 2. 환경 변수 설정

데이터베이스 생성 후 자동으로 `DATABASE_URL` 환경 변수가 추가됩니다.

### 확인 방법:
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. `DATABASE_URL`이 자동으로 추가되어 있는지 확인
3. 형식: `postgres://user:password@host:port/database?sslmode=require`

## 3. 로컬 개발 환경 설정

로컬에서 개발하려면 `.env` 파일에 `DATABASE_URL`을 추가해야 합니다.

### Vercel에서 연결 문자열 가져오기:
1. Vercel 대시보드 → 프로젝트 → **Storage** → 생성한 데이터베이스 클릭
2. **.env.local** 탭 클릭
3. `DATABASE_URL` 값을 복사

### 로컬 `.env` 파일에 추가:
```env
DATABASE_URL="postgres://user:password@host:port/database?sslmode=require"
```

## 4. Prisma 마이그레이션 실행

### 방법 A: 자동 마이그레이션 (권장)
`vercel.json`에 마이그레이션 명령이 포함되어 있어 배포 시 자동으로 실행됩니다.

### 방법 B: 수동 마이그레이션
배포 후 다음 엔드포인트를 호출하여 마이그레이션을 실행할 수 있습니다:
```
POST https://your-app.vercel.app/api/migrate
```

### 방법 C: 로컬에서 마이그레이션 실행
로컬에서 실행하려면:
```bash
cd backend
npx prisma migrate dev --name init
```

**중요**: Vercel Postgres를 사용하는 경우, 로컬에서 마이그레이션을 실행하려면 Vercel 대시보드에서 `.env.local` 파일의 `DATABASE_URL`을 복사하여 로컬 `.env` 파일에 추가해야 합니다.

## 5. Prisma 클라이언트 재생성

```bash
cd backend
npx prisma generate
```

## 6. 배포 확인

변경사항을 푸시하면 Vercel이 자동으로:
1. 환경 변수 사용
2. Prisma 클라이언트 생성
3. 데이터베이스 연결

## 문제 해결

### 연결 오류가 발생하는 경우:
1. `DATABASE_URL` 환경 변수가 올바르게 설정되었는지 확인
2. Vercel 대시보드에서 데이터베이스 상태 확인
3. Prisma 클라이언트가 재생성되었는지 확인

### 로컬에서 테스트:
```bash
cd backend
npx prisma studio
```
이 명령으로 데이터베이스 내용을 시각적으로 확인할 수 있습니다.

