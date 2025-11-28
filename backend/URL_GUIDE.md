# 올바른 URL 형식 가이드

## ⚠️ 주의: 전체 URL을 사용해야 합니다!

브라우저 주소창에 **전체 URL**을 입력해야 합니다.

## ❌ 잘못된 방법
```
api/inspection/test
```
→ 이렇게 입력하면 DNS 오류 발생!

## ✅ 올바른 방법

### 로컬 개발 환경 (PC에서)
```
http://localhost:3000/api/inspection/test
```

### 스마트폰에서 접속 시
```
http://[컴퓨터IP주소]:3000/api/inspection/test
```
예: `http://192.168.0.100:3000/api/inspection/test`

## 테스트할 URL 목록

### 1. 기본 Health Check
```
http://localhost:3000/api/health
```

### 2. 간단한 테스트
```
http://localhost:3000/api/inspection/test
```

### 3. 진단 엔드포인트
```
http://localhost:3000/api/inspection/health-check
```

### 4. 리스트 정보
```
http://localhost:3000/api/inspection/list-info
```

## URL 구성 요소 설명

```
http://localhost:3000/api/inspection/test
│    │         │    │   │           │
│    │         │    │   │           └─ 엔드포인트 이름
│    │         │    │   └─ 라우터 경로
│    │         │    └─ API 경로
│    │         └─ 포트 번호
│    └─ 호스트 (로컬)
└─ 프로토콜
```

## 빠른 복사

브라우저 주소창에 **전체 URL**을 복사해서 붙여넣으세요:

```
http://localhost:3000/api/inspection/test
```




