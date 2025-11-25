# 완제품 확인검사 웹앱

모바일 우선 웹 애플리케이션으로 완제품 확인검사를 수행하고 SharePoint에 저장하는 시스템입니다.

## 주요 기능

1. **데이터 매트릭스 스캔**: 핸드폰 카메라를 이용한 데이터 매트릭스 스캔 및 자동 파싱
2. **제품 정보 입력**: 제품명, 검사자, 비고 입력
3. **4방향 사진 촬영**: 정면, 후면, 좌측, 우측 사진 촬영 또는 파일 선택
4. **SharePoint 저장**: 모든 데이터를 SharePoint에 자동 저장

## 기술 스택

### 프론트엔드
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui (Neo-brutalism 테마)
- ZXing 라이브러리 (데이터 매트릭스 스캔)

### 백엔드
- Node.js + Express
- Microsoft Graph API (SharePoint 연동)
- TypeScript

## 설치 및 실행

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

### 백엔드

```bash
cd backend
npm install
```

환경 변수 설정:
```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 정보를 입력하세요:
- `AZURE_CLIENT_ID`: Azure AD 앱 등록의 클라이언트 ID
- `AZURE_CLIENT_SECRET`: Azure AD 앱 등록의 클라이언트 시크릿
- `AZURE_TENANT_ID`: Azure AD 테넌트 ID
- `SHAREPOINT_SITE_ID`: SharePoint 사이트 ID
- `SHAREPOINT_DRIVE_ID`: SharePoint 드라이브 ID
- `SHAREPOINT_FOLDER_PATH`: 저장할 폴더 경로 (기본값: InspectionData)

서버 실행:
```bash
npm run dev
```

## 데이터 매트릭스 파싱 규칙

데이터 매트릭스에서 제품명을 추출하는 규칙:

1. **P 필드**: VSBH4 다음 P 필드에서 10글자 추출
2. **E 필드**: SH 다음 E 필드에서 2글자 추출
3. **C 필드**: C 필드에서 C 다음 7-9번째 숫자 추출

예시:
- 입력: `[)>␞06␝VSBH4␝P91958CU810PD␝SHB81␝EJW124052␝T241017KKH1@OX15901W␝C020100007000000A2␝␞␄`
- 출력: `91958CU810JW007`

## Azure 설정

1. Azure Portal에서 앱 등록 생성
2. API 권한 추가: `Sites.ReadWrite.All` (Microsoft Graph)
3. 클라이언트 시크릿 생성
4. SharePoint 사이트 ID 및 드라이브 ID 확인

## 사용 방법

1. 웹앱을 모바일 브라우저에서 열기
2. "스캔" 버튼을 눌러 데이터 매트릭스 스캔
3. 검사자 이름 입력
4. 비고 입력 (선택사항)
5. 정면, 후면, 좌측, 우측 사진 촬영 또는 파일 선택
6. "저장" 버튼 클릭

## 프로젝트 구조

```
프로젝트 루트/
├── frontend/          # React 웹앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── DataMatrixScanner.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── PhotoCapture.tsx
│   │   ├── utils/
│   │   │   ├── datamatrixParser.ts
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
├── backend/           # Express 서버
│   ├── src/
│   │   ├── routes/
│   │   │   └── inspection.ts
│   │   ├── services/
│   │   │   └── sharepoint.ts
│   │   └── server.ts
│   └── package.json
└── README.md
```

## 라이선스

ISC



