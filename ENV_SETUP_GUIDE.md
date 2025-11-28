# Vercel 환경 변수 설정 가이드

## 필수 환경 변수

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

### 1. DATABASE_URL 설정

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 선택: `Visual-Inspection-Program-ver2`
3. **Settings** 탭 클릭
4. **Environment Variables** 클릭
5. **Add New** 버튼 클릭
6. 다음 정보 입력:
   - **Name**: `DATABASE_URL`
   - **Value**: Vercel Postgres 데이터베이스의 연결 문자열
     - Postgres를 생성했다면, **Storage** 탭 → 생성한 데이터베이스 클릭 → **.env.local** 탭에서 `DATABASE_URL` 값을 복사
   - **Environment**: Production, Preview, Development 모두 선택
7. **Save** 클릭

### 2. JWT_SECRET 설정

1. **Environment Variables** 페이지에서 **Add New** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `JWT_SECRET`
   - **Value**: 강력하고 고유한 비밀 키 문자열 (예: `your-super-secret-jwt-key-change-this-in-production-12345`)
     - **중요**: 이 값은 절대로 외부에 노출되어서는 안 됩니다!
   - **Environment**: Production, Preview, Development 모두 선택
3. **Save** 클릭

## 확인 방법

환경 변수가 제대로 설정되었는지 확인하려면:

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. `DATABASE_URL`과 `JWT_SECRET`이 목록에 있는지 확인
3. 각 변수의 값이 올바른지 확인

## 문제 해결

### DATABASE_URL이 없는 경우

1. Vercel Postgres 데이터베이스를 생성했는지 확인
2. **Storage** 탭에서 데이터베이스가 생성되어 있는지 확인
3. 데이터베이스가 있다면, 해당 데이터베이스의 `.env.local` 탭에서 `DATABASE_URL` 값을 복사하여 환경 변수로 추가

### 환경 변수 설정 후에도 오류가 발생하는 경우

1. 환경 변수를 설정한 후 **새로운 배포**가 필요합니다
2. Vercel 대시보드 → **Deployments** 탭에서 최신 배포가 완료되었는지 확인
3. 배포가 완료되면 다시 테스트해보세요

