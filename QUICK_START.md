# ⚡ 빠른 시작

## 서버 시작하기

**VS Code 터미널에서 아래 명령어를 실행하세요:**

```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2\backend"
npm run dev
```

또는 프로젝트 루트에서:

```powershell
cd "C:\cursorstudy\Visual Inspection Program ver2"
npm run dev:backend
```

---

## 서버가 시작되면

터미널에 다음과 같은 메시지가 나타나야 합니다:

```
✅✅✅ 서버가 포트 3000에서 실행 중입니다. ✅✅✅
```

**그 후 브라우저에서 테스트:**

1. http://localhost:3000/api/inspection/list-info
2. http://localhost:3000/api/inspection/auth-test

---

## 여전히 안 되면?

1. **터미널 오류 메시지를 확인하세요**
   - 빨간색 에러 메시지가 있는지 확인
   - 오류 메시지를 복사해서 알려주세요

2. **포트 확인**
   ```powershell
   netstat -ano | findstr :3000
   ```
   - 결과가 나오면 다른 프로그램이 포트를 사용 중입니다

3. **Node.js 확인**
   ```powershell
   node --version
   npm --version
   ```
   - 버전이 출력되어야 합니다

---

자세한 내용은 `SERVER_START_GUIDE.md` 파일을 참고하세요.
