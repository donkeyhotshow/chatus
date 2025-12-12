<#
PowerShell cleanup script — запускать из корня репозитория
#>
Write-Host "Cleaning build artifacts and caches..."
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules, .next, out, build, .vercel, .firebase

Write-Host "To remove cached files from git run:"
Write-Host "git rm -r --cached node_modules .next out build .vercel .firebase"

Write-Host "See docs/SECRETS_HANDLING.md to remove secrets from history."
Write-Host "Done."

