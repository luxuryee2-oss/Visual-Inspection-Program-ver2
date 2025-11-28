# 서버 상태 확인 스크립트
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "서버 상태 확인" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 포트 3000 확인
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "✅ 포트 3000이 사용 중입니다" -ForegroundColor Green
    Write-Host "   프로세스 ID: $($port3000.OwningProcess)" -ForegroundColor Gray
    
    $process = Get-Process -Id $port3000.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   프로세스 이름: $($process.ProcessName)" -ForegroundColor Gray
        Write-Host "   프로세스 경로: $($process.Path)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ 포트 3000이 사용되지 않고 있습니다" -ForegroundColor Red
    Write-Host "   서버가 실행 중이 아닙니다." -ForegroundColor Yellow
}

Write-Host ""

# 서버 응답 테스트
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ 서버가 응답합니다!" -ForegroundColor Green
    Write-Host "   상태 코드: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   응답 내용: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 서버가 응답하지 않습니다" -ForegroundColor Red
    Write-Host "   오류: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""


