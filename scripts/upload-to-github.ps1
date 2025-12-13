#Requires -Version 5.1

Write-Host "🚀 Starting ChatForUs upload to GitHub..." -ForegroundColor Green

# Check for GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "❌ Error: GH_TOKEN environment variable not set!" -ForegroundColor Red
    Write-Host "Create a Personal Access Token at https://github.com/settings/tokens" -ForegroundColor Yellow
    Write-Host "Then run: `$env:GH_TOKEN = 'your_token_here'" -ForegroundColor Yellow
    exit 1
}

# Check for GitHub CLI
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI not installed. Install from https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Create repository
Write-Host "📦 Creating ChatForUs repository..." -ForegroundColor Cyan
try {
    gh repo create ChatForUs --public --description "A real-time chat application with collaborative features - Next.js, Firebase, multiplayer games" --source . --remote origin --push
    Write-Host "✅ Repository created and code uploaded!" -ForegroundColor Green
} catch {
    Write-Host "❌ Repository creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Settings > Secrets and variables > Actions" -ForegroundColor White
Write-Host "2. Add secrets: FIREBASE_TOKEN, FIREBASE_PROJECT_ID, VERCEL_TOKEN, etc." -ForegroundColor White
Write-Host "3. First push will trigger CI/CD pipeline" -ForegroundColor White


