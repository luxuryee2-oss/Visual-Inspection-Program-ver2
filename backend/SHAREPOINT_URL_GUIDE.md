# SharePoint 사이트 URL 설정 가이드

## 현재 오류

"General exception while processing" 오류가 발생했습니다.

## 올바른 URL 형식

사용자가 제공한 URL:
```
https://kyungshino365.sharepoint.com/:l:/r/sites/checksheet/Lists/List45?e=1l4N1w
```

이것은 **리스트 페이지 URL**입니다. `.env` 파일에는 **사이트 URL**을 입력해야 합니다:

### ✅ 올바른 사이트 URL:

```
SHAREPOINT_SITE_URL=https://kyungshino365.sharepoint.com/sites/checksheet
```

### ❌ 잘못된 형식:

- `https://kyungshino365.sharepoint.com/:l:/r/sites/checksheet/Lists/List45` (리스트 페이지 URL)
- `https://kyungshino365.sharepoint.com/:l:/r/sites/checksheet` (편집 모드 URL)

## 확인 방법

### 1. 사이트 URL 확인

SharePoint 사이트 메인 페이지로 이동:
1. SharePoint에서 사이트 홈으로 이동
2. 주소창의 URL 복사
3. `Lists/List45` 또는 `:l:` 같은 부분이 **없는** URL 사용

예:
- ✅ `https://kyungshino365.sharepoint.com/sites/checksheet`
- ❌ `https://kyungshino365.sharepoint.com/:l:/r/sites/checksheet`

### 2. .env 파일 확인

`backend/.env` 파일에서:

```env
SHAREPOINT_SITE_URL=https://kyungshino365.sharepoint.com/sites/checksheet
```

이 형식이 맞는지 확인하세요.

## 서버 재시작

URL을 수정했다면:

1. 서버 중지 (Ctrl+C)
2. 서버 재시작:
   ```bash
   npm run dev
   ```

3. 다시 테스트:
   ```
   http://localhost:3000/api/inspection/list-info
   ```

## 서버 콘솔 확인

서버 콘솔에 다음 로그가 출력됩니다:

```
🔍 사이트 URL 정규화 중... 원본 URL: ...
🔍 정규화된 URL: ...
🔍 파싱된 URL: { host: ..., sitePath: ... }
🔍 방법 1 시도 중...
```

이 로그를 확인하여 어떤 URL 형식이 시도되고 있는지 볼 수 있습니다.

## 다음 단계

1. `.env` 파일의 `SHAREPOINT_SITE_URL` 확인
2. 올바른 사이트 URL 형식인지 확인
3. 서버 재시작
4. `/api/inspection/list-info` 다시 테스트
5. 서버 콘솔 로그 확인



