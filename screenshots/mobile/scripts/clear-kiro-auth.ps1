# Script to clear Kiro IDE authentication data
# This allows you to log in with a different account and get fresh free requests

Write-Host "=== Clearing Kiro IDE Authentication Data ===" -ForegroundColor Yellow
Write-Host "IMPORTANT: Close Kiro IDE before running this script!" -ForegroundColor Red

# Show what will be cleared
Write-Host "`nThis script will clear the following data:" -ForegroundColor Cyan
Write-Host "- Cookies and network data" -ForegroundColor White
Write-Host "- Session storage" -ForegroundColor White
Write-Host "- State database and cached tokens" -ForegroundColor White
Write-Host "- Workspace authentication data" -ForegroundColor White
Write-Host "- Cache and temporary files" -ForegroundColor White

$confirmation = Read-Host "`nAre you sure you want to clear authentication data? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

# Kiro folder paths
$kiroRoaming = "$env:APPDATA\Kiro"
$kiroLocal = "$env:LOCALAPPDATA\Kiro"

Write-Host "`nClearing authentication data..." -ForegroundColor Green
Write-Host "Please wait, this may take a few seconds..." -ForegroundColor Yellow

# 1. Clear cookies and network data
$networkPath = "$kiroRoaming\Network"
if (Test-Path $networkPath) {
    Write-Host "Removing cookies and network data..." -ForegroundColor Cyan
    Remove-Item "$networkPath\Cookies" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Cookies-journal" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Network Persistent State" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Trust Tokens" -ErrorAction SilentlyContinue
    Remove-Item "$networkPath\Trust Tokens-journal" -ErrorAction SilentlyContinue
    Write-Host "Cookies and network data removed" -ForegroundColor Green
}

# 2. Clear session storage
$sessionPath = "$kiroRoaming\Session Storage"
if (Test-Path $sessionPath) {
    Write-Host "Removing session data..." -ForegroundColor Cyan
    Remove-Item $sessionPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Session data removed" -ForegroundColor Green
}

# 3. Clear state database (may contain tokens)
$globalStoragePath = "$kiroRoaming\User\globalStorage"
if (Test-Path $globalStoragePath) {
    Write-Host "Removing state database..." -ForegroundColor Cyan
    Remove-Item "$globalStoragePath\state.vscdb" -ErrorAction SilentlyContinue
    Remove-Item "$globalStoragePath\state.vscdb.backup" -ErrorAction SilentlyContinue
    # Clean storage.json of potential tokens
    $storageJson = "$globalStoragePath\storage.json"
    if (Test-Path $storageJson) {
        try {
            $content = Get-Content $storageJson -Raw | ConvertFrom-Json
            # Remove potentially sensitive data
            if ($content.PSObject.Properties.Name -contains 'kiro.authToken') {
                $content.PSObject.Properties.Remove('kiro.authToken')
            }
            if ($content.PSObject.Properties.Name -contains 'kiro.sessionToken') {
                $content.PSObject.Properties.Remove('kiro.sessionToken')
            }
            $content | ConvertTo-Json -Depth 10 | Set-Content $storageJson
            Write-Host "Sensitive data from storage.json removed" -ForegroundColor Green
        } catch {
            Write-Host "Failed to process storage.json" -ForegroundColor Yellow
        }
    }
    Write-Host "State database cleared" -ForegroundColor Green
}

# 4. Clear workspace storage (may contain cached data)
$workspaceStoragePath = "$kiroRoaming\User\workspaceStorage"
if (Test-Path $workspaceStoragePath) {
    Write-Host "Removing workspace storage..." -ForegroundColor Cyan
    # Remove only specific workspaces related to authentication
    Get-ChildItem $workspaceStoragePath -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $workspaceFile = "$($_.FullName)\workspace.json"
        if (Test-Path $workspaceFile) {
            try {
                $workspaceData = Get-Content $workspaceFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($workspaceData -and $workspaceData.PSObject.Properties.Name -contains 'configuration' -and
                    $workspaceData.configuration -like "*kiro*auth*") {
                    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    Write-Host "Workspace $($_.Name) removed (contained authentication data)" -ForegroundColor Green
                }
            } catch {
                # Ignore parsing errors
            }
        }
    }
}

# 5. Clear local data (if exists)
if (Test-Path $kiroLocal) {
    Write-Host "Removing local data..." -ForegroundColor Cyan
    Remove-Item $kiroLocal -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Local data removed" -ForegroundColor Green
}

# 6. Clear cache and temporary files
$cachePath = "$kiroRoaming\Cache"
if (Test-Path $cachePath) {
    Write-Host "Removing cache..." -ForegroundColor Cyan
    Remove-Item $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache removed" -ForegroundColor Green
}

# 7. Clear Code Cache (GPU cache)
$codeCachePath = "$kiroRoaming\Code Cache"
if (Test-Path $codeCachePath) {
    Write-Host "Removing GPU cache..." -ForegroundColor Cyan
    Remove-Item $codeCachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "GPU cache removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Cleanup completed! ===" -ForegroundColor Green
Write-Host "Now you can launch Kiro IDE and log in with a different account." -ForegroundColor White
Write-Host "Free requests will be available for the new account." -ForegroundColor White
Write-Host ""
Write-Host "Note: Your settings and extensions will be preserved," -ForegroundColor Yellow
Write-Host "only authentication and session data will be removed." -ForegroundColor Yellow

Read-Host "Press Enter to exit"
