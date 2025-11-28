# 🔐 인증 시스템 설정 가이드

## 현재 구현된 기능

### 백엔드
- ✅ SQLite 데이터베이스 (Prisma)
- ✅ 회원가입 API (`POST /api/auth/register`)
- ✅ 로그인 API (`POST /api/auth/login`)
- ✅ 로그아웃 API (`POST /api/auth/logout`)
- ✅ 사용자 정보 조회 API (`GET /api/auth/me`)
- ✅ JWT 토큰 기반 인증
- ✅ 검사 데이터 저장 (인증 필요)

### 프론트엔드
- ✅ 로그인/회원가입 UI
- ✅ 인증 컨텍스트 (토큰 자동 관리)
- ✅ 인증 상태에 따른 라우팅

## 서버 실행 방법

### 1. 환경 변수 설정

`backend/.env` 파일에 다음을 추가하세요:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 2. 서버 실행

#### 전체 실행 (백엔드 + 프론트엔드)
```bash
npm run dev
```

#### 개별 실행
```bash
# 백엔드만
cd backend
npm run dev

# 프론트엔드만
cd frontend
npm run dev
```

## API 엔드포인트

### 인증 API

#### 회원가입
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "name": "사용자 이름" // 선택사항
}
```

#### 로그인
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 사용자 정보 조회
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

#### 로그아웃
```bash
POST http://localhost:3000/api/auth/logout
Authorization: Bearer <token>
```

### 검사 데이터 API

#### 검사 데이터 저장
```bash
POST http://localhost:3000/api/inspection
Authorization: Bearer <token>
Content-Type: application/json

{
  "productName": "제품명",
  "inspector": "검사자명",
  "notes": "비고",
  "photos": {
    "front": "base64...",
    "back": "base64...",
    "left": "base64...",
    "right": "base64..."
  }
}
```

#### 검사 이력 조회
```bash
GET http://localhost:3000/api/inspection/history
Authorization: Bearer <token>
```

## 문제 해결

### 404 오류가 발생하는 경우

1. **서버가 실행 중인지 확인**
   ```bash
   # 터미널에서 확인
   curl http://localhost:3000/api/health
   # 또는 브라우저에서
   http://localhost:3000/api/health
   ```

2. **서버 로그 확인**
   - 백엔드 터미널에서 요청이 들어오는지 확인
   - `📥 요청: GET /api/auth/me` 같은 로그가 보여야 함

3. **CORS 문제 확인**
   - 브라우저 콘솔에서 CORS 오류가 있는지 확인
   - 서버의 CORS 설정이 올바른지 확인

4. **포트 확인**
   - 백엔드가 3000번 포트에서 실행 중인지 확인
   - 프론트엔드의 API_BASE_URL이 올바른지 확인

### 데이터베이스 오류

1. **Prisma 클라이언트 생성**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **마이그레이션 확인**
   ```bash
   cd backend
   npx prisma migrate status
   ```

3. **데이터베이스 파일 확인**
   - `backend/dev.db` 파일이 존재하는지 확인

## 테스트 순서

1. 서버 실행 확인
   ```bash
   curl http://localhost:3000/api/health
   ```

2. 회원가입 테스트
   - 브라우저에서 프론트엔드 접속
   - 회원가입 폼 작성 및 제출

3. 로그인 테스트
   - 로그인 폼 작성 및 제출

4. 검사 데이터 저장 테스트
   - 로그인 후 검사 데이터 입력 및 저장

## 보안 주의사항

1. **JWT_SECRET 변경**
   - 프로덕션 환경에서는 반드시 강력한 JWT_SECRET 사용
   - `.env` 파일을 Git에 커밋하지 않도록 주의

2. **비밀번호 정책**
   - 현재는 최소 6자만 요구
   - 필요시 더 강력한 정책 추가 가능

3. **HTTPS 사용**
   - 프로덕션 환경에서는 반드시 HTTPS 사용

