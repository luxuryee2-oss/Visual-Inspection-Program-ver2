# 저장 문제 해결 가이드

## "Cannot GET /api/inspection/health-check" 오류

이 오류가 발생하면:

### 1. 백엔드 서버 재시작

**중요:** 코드를 수정한 후에는 서버를 재시작해야 합니다!

```bash
# 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
cd backend
npm run dev
```

### 2. 서버 실행 확인

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:
```
서버가 포트 3000에서 실행 중입니다.
```

### 3. Health Check 테스트

서버가 실행된 후 브라우저에서:
```
http://localhost:3000/api/health
```

정상이면 `{"status":"ok"}` 응답이 옵니다.

### 4. 진단 엔드포인트 확인

```
http://localhost:3000/api/inspection/health-check
```

이 엔드포인트는 시스템 상태를 확인합니다.

## 서버 재시작이 안 되는 경우

### TypeScript 오류 확인

```bash
cd backend
npx tsc --noEmit
```

컴파일 오류가 있으면 수정해야 합니다.

### 포트 충돌 확인

포트 3000이 이미 사용 중일 수 있습니다:
```bash
# Windows에서 포트 사용 확인
netstat -ano | findstr :3000

# 사용 중인 프로세스 종료 필요 시
taskkill /PID [프로세스ID] /F
```

### Node 버전 확인

```bash
node --version
```

Node.js 18 이상이 필요합니다.

## 빠른 체크리스트

1. ✅ 서버가 실행 중인가요?
   - 터미널에 "서버가 포트 3000에서 실행 중입니다." 메시지 확인

2. ✅ 서버를 재시작했나요?
   - 코드 수정 후 반드시 재시작 필요

3. ✅ 포트가 충돌하지 않나요?
   - 다른 프로그램이 포트 3000을 사용 중인지 확인

4. ✅ TypeScript 오류가 없나요?
   - `npx tsc --noEmit` 실행하여 확인

## 여전히 안 되는 경우

1. 백엔드 서버 콘솔의 전체 오류 메시지 복사
2. 브라우저 개발자 도구(F12) → Network 탭에서 요청 상태 확인
3. 모든 오류 메시지 공유




