# Complete deployment setup after GitHub upload
# Run this script AFTER successfully uploading the project to GitHub

Write-Host "🚀 Complete ChatForUs deployment setup" -ForegroundColor Green
Write-Host "This script should be run AFTER uploading to GitHub!" -ForegroundColor Yellow
Write-Host ""

# Check GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "❌ GH_TOKEN not set!" -ForegroundColor Red
    Write-Host "First run: `$env:GH_TOKEN = 'your_github_token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GH_TOKEN found" -ForegroundColor Green

# Run secrets setup
Write-Host "🔑 Setting up GitHub secrets..." -ForegroundColor Cyan
try {
    & ".\setup-github-secrets.ps1"
} catch {
    Write-Host "❌ Secrets setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to your GitHub repository" -ForegroundColor White
Write-Host "2. Open the Actions tab" -ForegroundColor White
Write-Host "3. Select workflow Deploy Firebase and Vercel" -ForegroundColor White
Write-Host "4. Click Run workflow -> Run workflow" -ForegroundColor White
Write-Host ""
Write-Host "OR push to main branch:" -ForegroundColor Yellow
Write-Host "git checkout main" -ForegroundColor White
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m ""Deploy to Firebase and Vercel""" -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "`n🔗 After deployment:" -ForegroundColor Green
Write-Host "- Vercel: https://chatforus.vercel.app" -ForegroundColor Cyan
Write-Host "- Firebase: Backend API will work automatically" -ForegroundColor Cyan


