Write-Host "Удаление .next (PowerShell)"
if (Test-Path ".next") {
  Remove-Item -Recurse -Force .next
  Write-Host ".next удалён."
} else {
  Write-Host ".next не найден — ничего не делаем."
}

# PowerShell helper to remove .next from git index and ensure .gitignore contains .next
if (Test-Path -Path ".next") {
    Write-Host "Removing .next from git index..."
    try {
        git rm -r --cached .next
    } catch {
        Write-Host "git rm failed or .next not tracked: $($_.Exception.Message)"
    }
} else {
    Write-Host ".next directory not found in repo root"
}

$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $content = Get-Content $gitignorePath -Raw
    if ($content -notmatch '(^|[\r\n])\.next') {
        Add-Content $gitignorePath ".next"
        Write-Host "Added .next to .gitignore"
    } else {
        Write-Host ".next already present in .gitignore"
    }
} else {
    Set-Content $gitignorePath ".next"
    Write-Host "Created .gitignore and added .next"
}

Write-Host "Done. Commit the change: git add .gitignore; git commit -m 'Remove .next from repo and ignore build artifacts'"


