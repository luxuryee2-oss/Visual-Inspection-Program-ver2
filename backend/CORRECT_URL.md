# ✅ 올바른 SharePoint 사이트 URL

## 현재 상황

제공하신 URL:
```
https://kyungshino365.sharepoint.com/sites/checksheet/Lists/List45/AllItems.aspx
```

이것은 **리스트 페이지 URL**입니다.

## ✅ 올바른 사이트 URL

`.env` 파일에 입력해야 하는 올바른 URL:
```
SHAREPOINT_SITE_URL=https://kyungshino365.sharepoint.com/sites/checksheet
```

## 📝 .env 파일 설정

`backend/.env` 파일을 열어서 다음처럼 설정하세요:

```env
# Azure AD 앱 등록 설정
AZURE_CLIENT_ID=943f2db3-1aa5-42d8-af9c-f4afb6236ba4
AZURE_CLIENT_SECRET=여기에-클라이언트-시크릿-입력
AZURE_TENANT_ID=1757bd3c-a2e2-4dd3-9a67-139612e54698

# SharePoint 설정
SHAREPOINT_SITE_URL=https://kyungshino365.sharepoint.com/sites/checksheet
SHAREPOINT_FOLDER_PATH=InspectionData

# SharePoint 리스트 설정
SHAREPOINT_LIST_ID=List45
```

**중요:** 
- ✅ `/sites/checksheet` 까지만 포함
- ❌ `/Lists/List45` 부분은 제거
- ❌ `/AllItems.aspx` 부분은 제거

## 🔄 서버 재시작

URL을 수정했다면:

1. 서버 중지 (터미널에서 `Ctrl + C`)
2. 서버 재시작:
   ```bash
   cd backend
   npm run dev
   ```

## 🧪 테스트

서버가 시작되면 다시 테스트:

```
http://localhost:3000/api/inspection/list-info
```

이제 사이트 ID를 성공적으로 조회할 수 있어야 합니다!



