# 서버 시작 스크립트
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "백엔드 서버 시작 중..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 현재 디렉토리 확인
$currentDir = Get-Location
Write-Host "현재 디렉토리: $currentDir" -ForegroundColor Gray

# .env 파일 확인
if (Test-Path ".env") {
    Write-Host "✅ .env 파일 발견" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env 파일이 없습니다!" -ForegroundColor Yellow
    Write-Host "   backend 폴더에 .env 파일이 필요합니다." -ForegroundColor Yellow
}

# node_modules 확인
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules 폴더 발견" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules 폴더가 없습니다!" -ForegroundColor Red
    Write-Host "   npm install을 먼저 실행하세요." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "서버 시작 중..." -ForegroundColor Yellow
Write-Host ""

# 서버 시작
npm run dev


