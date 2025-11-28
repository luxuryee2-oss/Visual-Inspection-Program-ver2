# 🚀 Vercel 배포 가이드

## ⚠️ 중요 사항

현재 프로젝트는 **SQLite 데이터베이스**를 사용하고 있습니다. Vercel의 Serverless Functions는 **파일 시스템에 영구 저장이 불가능**하므로 SQLite는 작동하지 않습니다.

### 해결 방법

Vercel에 배포하려면 다음 중 하나를 선택해야 합니다:

1. **PostgreSQL 사용 (권장)**
   - Vercel Postgres 사용
   - 또는 외부 PostgreSQL 서비스 (Supabase, Neon 등)

2. **다른 서버리스 데이터베이스**
   - PlanetScale (MySQL)
   - MongoDB Atlas
   - Supabase

## 현재 설정된 파일

✅ `vercel.json` - Vercel 배포 설정
✅ `api/auth/register.ts` - 회원가입 API
✅ `api/auth/login.ts` - 로그인 API
✅ `api/auth/me.ts` - 사용자 정보 조회 API

## 배포 전 준비사항

### 1. 데이터베이스 마이그레이션

SQLite에서 PostgreSQL로 변경해야 합니다:

```bash
# Prisma 스키마 수정
# backend/prisma/schema.prisma에서:
# datasource db {
#   provider = "postgresql"  # sqlite에서 변경
#   url      = env("DATABASE_URL")
# }
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
SHAREPOINT_SITE_URL=your-sharepoint-url
SHAREPOINT_FOLDER_PATH=InspectionData
```

### 3. Prisma 설정

Vercel에서 Prisma를 사용하려면:

1. `package.json`에 Prisma generate 스크립트 추가
2. 빌드 시 Prisma 클라이언트 생성

## 배포 방법

### 방법 1: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동

1. GitHub에 코드 푸시
2. Vercel 대시보드에서 프로젝트 import
3. 환경 변수 설정
4. 자동 배포

## 주의사항

1. **데이터베이스**: SQLite는 Vercel에서 작동하지 않습니다. PostgreSQL로 변경 필요
2. **파일 저장**: Serverless Functions는 임시 파일 시스템만 사용 가능
3. **환경 변수**: 모든 민감한 정보는 Vercel 환경 변수로 설정
4. **빌드 시간**: Prisma generate가 빌드 시간에 포함됨

## PostgreSQL 마이그레이션 가이드

### 1. Vercel Postgres 사용

```bash
# Vercel CLI로 Postgres 추가
vercel postgres create

# 연결 문자열 자동 설정됨
```

### 2. Prisma 스키마 변경

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. 마이그레이션 실행

```bash
cd backend
npx prisma migrate dev --name init_postgres
npx prisma generate
```

## 현재 상태

- ✅ Vercel 설정 파일 생성됨
- ✅ API 라우트 생성됨
- ⚠️ 데이터베이스 마이그레이션 필요 (SQLite → PostgreSQL)
- ⚠️ 환경 변수 설정 필요

## 다음 단계

1. PostgreSQL 데이터베이스 설정
2. Prisma 스키마 변경
3. 환경 변수 설정
4. 배포 테스트

