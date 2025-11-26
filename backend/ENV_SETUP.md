# 환경 변수 설정 가이드

## .env 파일 생성

`backend` 폴더에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Azure AD 앱 등록 설정
AZURE_CLIENT_ID=943f2db3-1aa5-42d8-af9c-f4afb6236ba4
AZURE_CLIENT_SECRET=여기에-클라이언트-시크릿-입력
AZURE_TENANT_ID=1757bd3c-a2e2-4dd3-9a67-139612e54698

# SharePoint 설정
SHAREPOINT_SITE_ID=여기에-사이트-ID-입력
SHAREPOINT_DRIVE_ID=여기에-드라이브-ID-입력
SHAREPOINT_FOLDER_PATH=InspectionData
```

## 필요한 정보

### 1. 클라이언트 시크릿
Azure Portal → 앱 등록 → 인증서 및 비밀에서 생성한 클라이언트 시크릿 값을 입력하세요.

### 2. SharePoint 사이트 정보
- **사이트 URL**: 저장할 SharePoint 사이트의 URL
  - 예: `https://yourcompany.sharepoint.com/sites/YourSiteName`
- **사이트 ID**: Graph API로 자동 조회 가능 (또는 수동 입력)
- **드라이브 ID**: 보통 "문서" 라이브러리 (자동 조회 가능)

## 사이트 ID와 드라이브 ID 찾기

SharePoint 사이트 URL만 있으면 자동으로 찾을 수 있습니다.
또는 Graph Explorer (https://developer.microsoft.com/graph/graph-explorer)에서:

1. 사이트 ID 찾기:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{your-site-url}
   ```

2. 드라이브 ID 찾기:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
   ```

