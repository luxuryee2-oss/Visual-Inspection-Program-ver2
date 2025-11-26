# Azure AD 앱 등록 설정 가이드

전산팀에서 Azure Portal에서 앱 등록을 설정할 때 필요한 정보입니다.

## 필요한 권한 및 설정

### 1. 앱 등록 생성
- **이름**: Visual Inspection Program (또는 원하는 이름)
- **지원되는 계정 유형**: "이 조직 디렉터리에만 있는 계정" (Single tenant)
- **리디렉션 URI**: 설정하지 않음 (서버 앱이므로)

### 2. API 권한 설정
- **Microsoft Graph** → **애플리케이션 권한** 선택
- 다음 권한 추가:
  - `Sites.ReadWrite.All` (SharePoint 사이트 읽기/쓰기)

### 3. 관리자 동의
- "관리자 동의 부여" 버튼 클릭하여 권한 승인

### 4. 클라이언트 시크릿 생성
- **인증서 및 비밀** 메뉴에서 새 클라이언트 비밀 생성
- 만료 기간: 24개월 (또는 원하는 기간)
- **중요**: 생성 후 즉시 시크릿 값을 복사 (다시 볼 수 없음)

### 5. 필요한 정보 (앱 등록 페이지에서 확인)
다음 정보들을 복사해서 제공해주세요:

1. **애플리케이션(클라이언트) ID**
   - 앱 등록 개요 페이지에서 확인
   - 예: `12345678-1234-1234-1234-123456789abc`

2. **디렉터리(테넌트) ID**
   - 앱 등록 개요 페이지에서 확인
   - 예: `87654321-4321-4321-4321-cba987654321`

3. **클라이언트 시크릿 값**
   - 인증서 및 비밀 페이지에서 생성한 시크릿의 "값" 열
   - 예: `abc~123~xyz~...`

### 6. SharePoint 사이트 정보
다음 정보도 함께 필요합니다:

1. **SharePoint 사이트 URL**
   - 저장할 SharePoint 사이트의 URL
   - 예: `https://yourcompany.sharepoint.com/sites/YourSiteName`

2. **사이트 ID** (선택사항 - 자동으로 찾을 수 있음)
   - Graph Explorer에서 확인 가능
   - 또는 제공된 URL로 자동 조회 가능

3. **드라이브 ID** (선택사항 - 자동으로 찾을 수 있음)
   - 보통 "문서" 라이브러리
   - 또는 제공된 사이트 URL로 자동 조회 가능

## 제공받은 정보를 사용하는 방법

전산팀에서 위 정보를 받으면, `backend/.env` 파일에 다음과 같이 설정합니다:

```env
# Azure AD 설정
AZURE_CLIENT_ID=여기에-클라이언트-ID-입력
AZURE_CLIENT_SECRET=여기에-클라이언트-시크릿-입력
AZURE_TENANT_ID=여기에-테넌트-ID-입력

# SharePoint 설정
SHAREPOINT_SITE_ID=여기에-사이트-ID-입력 (또는 사이트 URL로 자동 조회)
SHAREPOINT_DRIVE_ID=여기에-드라이브-ID-입력 (또는 자동 조회)
SHAREPOINT_FOLDER_PATH=InspectionData
```

## 참고사항

- 현재는 로컬 파일 시스템에 저장하도록 설정되어 있습니다
- Azure 설정이 완료되면 `backend/src/routes/inspection.ts`에서 `saveToLocal` 대신 `saveToSharePoint`를 사용하도록 변경하면 됩니다
- 앱 등록은 한 번만 설정하면 되며, 이후 모든 사용자가 Microsoft 계정 없이 사용할 수 있습니다

