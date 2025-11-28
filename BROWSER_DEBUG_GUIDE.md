# 🌐 브라우저에서 API 응답 확인하기

## ✅ 현재 상황

서버는 정상 작동 중이며 JSON 응답을 반환하고 있습니다. 
브라우저에서 viewport 경고가 나타나는 것은 정상입니다 (HTML 페이지가 아니므로).

---

## 🔍 브라우저에서 실제 JSON 응답 확인하기

### 방법 1: 네트워크 탭 (추천)

1. **F12** 키로 개발자 도구 열기
2. **"Network"** 또는 **"네트워크"** 탭 클릭
3. 브라우저 새로고침 (F5)
4. **`list-info`** 요청 찾기
5. 클릭하여 상세 정보 확인:
   - **Headers** 탭: 요청/응답 헤더
   - **Response** 또는 **응답** 탭: 실제 JSON 데이터 확인
   - **Status Code**: 상태 코드 확인 (현재 500 또는 401)

### 방법 2: 콘솔에서 직접 확인

브라우저 콘솔(F12 → Console)에서 다음 명령어 실행:

```javascript
fetch('http://localhost:3000/api/inspection/list-info')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### 방법 3: Response 탭 확인

1. 개발자 도구 → Network 탭
2. `list-info` 요청 클릭
3. **"Response"** 또는 **"응답"** 탭 클릭
4. 실제 JSON 응답 확인

---

## 📊 현재 응답 예시

현재 서버에서 반환하는 JSON:

```json
{
  "success": false,
  "error": "SharePoint 사이트를 찾을 수 없습니다.\n오류: 인증 오류(401): SharePoint에 접근할 수 있는 권한이 없습니다.\n\n가능한 원인:\n1. Azure AD 앱에 \"Application\" 권한으로 \"Sites.ReadWrite.All\"이 부여되지 않았습니다.\n2. 관리자 동의가 완료되지 않았습니다.\n3. 클라이언트 시크릿이 만료되었습니다.\n\n해결 방법:\n1. Azure Portal → 앱 등록 → API 권한에서 \"애플리케이션 권한\"으로 Sites.ReadWrite.All 추가\n2. \"관리자 동의 부여\" 클릭\n3. .env 파일의 AZURE_CLIENT_SECRET 확인"
}
```

이것은 정상적인 JSON 응답입니다!

---

## 🎯 다음 단계

### 1. Azure 권한 수정
`AZURE_PERMISSION_FIX.md` 파일의 가이드를 따라 Azure Portal에서 권한을 수정하세요.

### 2. 권한 수정 후 테스트

권한 수정 후 다시 확인:
```
http://localhost:3000/api/inspection/list-info
```

성공 시 응답 예시:
```json
{
  "success": true,
  "data": {
    "siteId": "...",
    "listId": "...",
    "listName": "...",
    "columns": [...]
  }
}
```

---

## 💡 참고사항

- **Viewport 경고**: 무시해도 됩니다. 이는 HTML 페이지에 대한 경고이고, API는 JSON을 반환합니다.
- **401 오류**: Azure AD 권한 문제입니다. `AZURE_PERMISSION_FIX.md` 참고
- **JSON 포맷**: 브라우저에서 보기 좋게 보려면 JSON 뷰어 확장 프로그램을 설치하거나, 콘솔에서 확인하세요.

