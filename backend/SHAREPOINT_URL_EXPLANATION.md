# SharePoint URL 형식 설명

## 현재 제공하신 URL

```
https://kyungshino365.sharepoint.com/sites/checksheet/Lists/List45/AllItems.aspx
```

이것은 **리스트 페이지 URL**입니다. 리스트의 "모든 항목" 페이지를 보여주는 URL입니다.

## ✅ 올바른 사이트 URL

`.env` 파일에는 **사이트 메인 URL**을 입력해야 합니다:

```
SHAREPOINT_SITE_URL=https://kyungshino365.sharepoint.com/sites/checksheet
```

### URL 비교

| 구분 | URL | 설명 |
|------|-----|------|
| ✅ **사이트 URL** | `https://kyungshino365.sharepoint.com/sites/checksheet` | 사이트 메인 (올바름) |
| ❌ 리스트 페이지 | `https://kyungshino365.sharepoint.com/sites/checksheet/Lists/List45/AllItems.aspx` | 리스트 페이지 (잘못됨) |
| ❌ 편집 모드 | `https://kyungshino365.sharepoint.com/:l:/r/sites/checksheet/Lists/List45` | 편집 모드 (잘못됨) |

## 올바른 사이트 URL 찾는 방법

### 방법 1: SharePoint 사이트 홈으로 이동

1. SharePoint에서 사이트 이름(예: "checksheet")을 클릭하거나
2. 브레드크럼에서 사이트 이름 클릭
3. 주소창의 URL 확인
4. `/Lists/` 또는 `/AllItems.aspx` 같은 부분이 **없는** URL 사용

### 방법 2: 리스트 URL에서 추출

제공하신 URL:
```
https://kyungshino365.sharepoint.com/sites/checksheet/Lists/List45/AllItems.aspx
```

여기서:
- `https://kyungshino365.sharepoint.com/sites/checksheet` ← 이것이 사이트 URL!
- `/Lists/List45/AllItems.aspx` ← 이 부분을 제거

### 방법 3: 사이트 설정에서 확인

1. SharePoint 사이트에서 설정(톱니바퀴 아이콘) 클릭
2. "사이트 정보" 또는 "사이트 설정" 클릭
3. 사이트 URL 확인

## .env 파일 설정

`backend/.env` 파일에 다음과 같이 설정하세요:

```env
SHAREPOINT_SITE_URL=https://kyungshino365.sharepoint.com/sites/checksheet
```

**중요:** 
- ❌ `/Lists/List45/AllItems.aspx` 포함하면 안 됨
- ❌ `:l:` 또는 `/r/` 같은 부분 포함하면 안 됨
- ✅ `https://도메인/sites/사이트명` 형식만 사용

## 확인 방법

올바른 URL로 설정한 후:

1. 서버 재시작
2. 테스트:
   ```
   http://localhost:3000/api/inspection/list-info
   ```

서버 콘솔에서 사이트 ID 조회 로그를 확인할 수 있습니다.



