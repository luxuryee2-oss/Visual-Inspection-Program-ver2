# 🚀 서버 시작 가이드

## 문제 해결: ERR_CONNECTION_REFUSED

`ERR_CONNECTION_REFUSED` 오류가 발생하면 서버가 실행되지 않고 있는 것입니다.

---

## 방법 1: PowerShell 스크립트 사용 (추천)

### 1단계: 서버 상태 확인
```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
.\check-server.ps1
```

### 2단계: 서버 시작
```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
.\start-server.ps1
```

---

## 방법 2: 수동으로 시작

### 1단계: 터미널 열기
- VS Code에서 `Ctrl + ~` (백틱) 또는 터미널 메뉴 선택
- 또는 PowerShell을 별도로 열기

### 2단계: 백엔드 폴더로 이동
```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
```

### 3단계: 서버 시작
```powershell
npm run dev
```

### 4단계: 서버 시작 확인
서버가 성공적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
🚀 서버 시작 중...
📁 현재 작업 디렉토리: ...
🔧 PORT: 3000
...
✅✅✅ 서버가 포트 3000에서 실행 중입니다. ✅✅✅
========================================

테스트 URL들:
  1. http://localhost:3000/test-root
  2. http://localhost:3000/api/health
  3. http://localhost:3000/api/inspection/direct-test
  4. http://localhost:3000/api/inspection/test
  5. http://localhost:3000/api/inspection/health-check
  6. http://localhost:3000/api/inspection/auth-test
  7. http://localhost:3000/api/inspection/list-info
========================================
```

---

## 방법 3: 루트에서 전체 시작

프로젝트 루트에서:
```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2"
npm run dev
```

이렇게 하면 프론트엔드와 백엔드가 동시에 시작됩니다.

---

## 문제 해결 체크리스트

### ✅ 서버가 시작되지 않을 때

1. **.env 파일 확인**
   ```powershell
   cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
   Test-Path .env
   ```
   - `.env` 파일이 없으면 생성해야 합니다
   - 파일 위치: `backend/.env`

2. **node_modules 확인**
   ```powershell
   Test-Path node_modules
   ```
   - 없으면 설치:
   ```powershell
   npm install
   ```

3. **포트 3000 확인**
   ```powershell
   netstat -ano | findstr :3000
   ```
   - 다른 프로세스가 포트를 사용 중이면 종료:
   ```powershell
   taskkill /PID <프로세스ID> /F
   ```

4. **의존성 재설치**
   ```powershell
   cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

---

## 서버가 시작되었는지 확인

브라우저에서 다음 URL들을 확인하세요:

1. **기본 헬스 체크**: http://localhost:3000/api/health
   - 정상이면: `{"status":"ok"}`

2. **테스트 엔드포인트**: http://localhost:3000/api/inspection/test
   - 정상이면: `{"message":"라우터 작동 중!","timestamp":"..."}`

3. **리스트 정보**: http://localhost:3000/api/inspection/list-info
   - 정상이면: SharePoint 리스트 정보 JSON
   - 오류면: 오류 메시지와 함께 상태 코드

---

## 자주 발생하는 오류

### 오류 1: "Cannot find module"
**해결 방법:**
```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
npm install
```

### 오류 2: "Port 3000 is already in use"
**해결 방법:**
```powershell
# 포트 사용 중인 프로세스 찾기
netstat -ano | findstr :3000

# 프로세스 종료 (PID를 실제 프로세스 ID로 변경)
taskkill /PID <프로세스ID> /F
```

### 오류 3: ".env file not found"
**해결 방법:**
- `backend/.env` 파일이 있는지 확인
- 없으면 `backend/ENV_SETUP.md` 파일 참고하여 생성

---

## 빠른 시작 명령어

**VS Code 터미널에서:**
```powershell
# 1. 백엔드 폴더로 이동
cd backend

# 2. 서버 시작
npm run dev

# 3. 새 터미널에서 프론트엔드 시작 (선택사항)
cd ../frontend
npm run dev
```

---

## 도움이 필요하신가요?

서버가 시작되지 않으면:
1. 터미널 오류 메시지를 확인하세요
2. 위의 체크리스트를 따라 확인하세요
3. 오류 메시지를 알려주시면 추가 도움을 드리겠습니다


