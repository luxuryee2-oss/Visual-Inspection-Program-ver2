# 서버 시작 가이드

## 현재 문제

`ERR_CONNECTION_REFUSED` 오류는 **서버가 실행되지 않았다**는 의미입니다.

## 해결 방법

### 방법 1: 간단한 테스트 서버 실행

**새로운 터미널**을 열고:

```bash
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
npx ts-node src/server-simple.ts
```

**중요:** 서버가 시작되면 다음과 같은 메시지가 표시되어야 합니다:
```
🚀 간단한 서버 시작...
서버가 포트 3000에서 실행 중입니다.
테스트: http://localhost:3000/api/inspection/direct-test
```

**이 메시지가 보이면** 서버가 실행 중입니다!

### 방법 2: 원래 서버 실행

```bash
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
npm run dev
```

**중요:** 서버 시작 메시지 확인:
```
서버가 포트 3000에서 실행 중입니다.
```

## 확인 사항

### 서버가 실행 중인지 확인

터미널에 다음과 같은 메시지가 **계속 표시**되어야 합니다:
- 서버 시작 메시지
- 오류 없음

만약 오류가 있으면 → 그 오류 메시지를 복사해서 알려주세요

### 포트 확인

포트 3000에서 서버가 실행 중인지 확인:
```bash
netstat -ano | findstr :3000
```

서버가 실행 중이면 포트가 LISTENING 상태로 표시됩니다.

## 테스트 순서

1. **터미널에서 서버 실행**
   ```bash
   cd backend
   npx ts-node src/server-simple.ts
   ```

2. **서버 시작 메시지 확인**
   - "서버가 포트 3000에서 실행 중입니다." 메시지가 보여야 함

3. **브라우저에서 접속**
   ```
   http://localhost:3000/api/inspection/direct-test
   ```

4. **서버 콘솔 확인**
   - 요청이 오면 서버 콘솔에 로그가 출력되어야 함

## 문제 해결

### 서버가 시작되지 않는 경우

터미널에 **오류 메시지**가 표시됩니다. 그 오류 메시지를 알려주세요.

### 서버는 시작되었는데 연결이 안 되는 경우

1. 포트 확인: 다른 포트를 사용 중일 수 있음
2. 방화벽 확인: Windows 방화벽이 포트를 차단할 수 있음

## 다음 단계

터미널에서 서버를 실행하고, **터미널에 표시되는 모든 메시지**를 알려주세요!




