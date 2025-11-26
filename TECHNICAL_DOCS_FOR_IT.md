# Azure/SharePoint 연동 기술 문서

전산팀에서 코드를 확인할 때 참고할 기술 문서입니다.

## 현재 저장 방식

현재는 **로컬 파일 시스템**에 저장하도록 구현되어 있습니다.
- 파일: `backend/src/services/localStorage.ts`
- 저장 위치: `backend/data/InspectionData/`

## SharePoint 연동 코드

SharePoint에 저장하려면 다음 코드를 사용합니다:

### 1. 저장 서비스 코드
**파일**: `backend/src/services/sharepoint.ts`

```typescript
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

// Azure AD 인증을 위한 설정
function getMSALClient(): ConfidentialClientApplication {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;
  
  const msalConfig = {
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  };
  
  return new ConfidentialClientApplication(msalConfig);
}

// Microsoft Graph API를 통해 SharePoint에 접근
async function getAccessToken(): Promise<string> {
  const msalClient = getMSALClient();
  const response = await msalClient.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  return response.accessToken;
}
```

### 2. 필요한 환경 변수

**파일**: `backend/.env`

```env
# Azure AD 앱 등록 정보
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_TENANT_ID=your-tenant-id-here

# SharePoint 사이트 정보
SHAREPOINT_SITE_ID=your-site-id-here
SHAREPOINT_DRIVE_ID=your-drive-id-here
SHAREPOINT_FOLDER_PATH=InspectionData
```

### 3. API 라우트 코드

**파일**: `backend/src/routes/inspection.ts`

현재는 로컬 저장을 사용:
```typescript
import { saveToLocal } from '../services/localStorage';

// 로컬 파일 시스템에 저장
const result = await saveToLocal(data);
```

SharePoint로 변경하려면:
```typescript
import { saveToSharePoint } from '../services/sharepoint';

// SharePoint에 저장
const result = await saveToSharePoint(data);
```

## 필요한 Azure 권한

### API 권한
- **Microsoft Graph** → **애플리케이션 권한**
- `Sites.ReadWrite.All` (SharePoint 사이트 읽기/쓰기)

### 인증 방식
- **Client Credentials Flow** (서버-투-서버 인증)
- 사용자 로그인 불필요
- 앱 등록의 클라이언트 ID와 시크릿으로 인증

## 코드 구조

```
backend/
├── src/
│   ├── services/
│   │   ├── sharepoint.ts      # SharePoint 저장 (Azure 필요)
│   │   └── localStorage.ts    # 로컬 저장 (현재 사용 중)
│   └── routes/
│       └── inspection.ts      # API 엔드포인트
└── .env                        # 환경 변수 설정
```

## 저장 데이터 구조

```typescript
interface InspectionData {
  productName: string;      // 제품명
  inspector: string;        // 검사자
  notes: string;           // 비고
  photos: {
    front: string | null;  // 정면 사진 (Base64)
    back: string | null;   // 후면 사진
    left: string | null;   // 좌측 사진
    right: string | null;  // 우측 사진
  };
}
```

## SharePoint 저장 구조

```
SharePoint 사이트
└── InspectionData/
    └── {제품명}_{타임스탬프}/
        ├── inspection-data.json
        ├── 정면.jpg
        ├── 후면.jpg
        ├── 좌측.jpg
        └── 우측.jpg
```

## 사용된 라이브러리

**package.json**:
```json
{
  "dependencies": {
    "@azure/msal-node": "^3.8.3",
    "@microsoft/microsoft-graph-client": "^3.0.7"
  }
}
```

## 테스트 방법

1. 환경 변수 설정 (`backend/.env`)
2. 백엔드 서버 실행: `npm run dev`
3. 프론트엔드에서 데이터 입력 후 저장
4. SharePoint 사이트에서 `InspectionData` 폴더 확인

## 보안 고려사항

- 클라이언트 시크릿은 `.env` 파일에 저장 (Git에 커밋하지 않음)
- `.gitignore`에 `.env` 파일 포함
- 프로덕션 환경에서는 환경 변수로 관리 권장

