$TOKEN = (Get-Content "$PSScriptRoot\.env.local" | Where-Object { $_ -match "^GITHUB_TOKEN=" }) -replace "^GITHUB_TOKEN=",""
$OWNER = "Takubon1202103-hash"
$REPO = "budget-react"
$WORKFLOW = "build-ios.yml"
$OUTPUT_DIR = Join-Path ([Environment]::GetFolderPath("Desktop")) "App\budget"

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "Starting build..." -ForegroundColor Cyan
$body = '{"ref":"main"}'
Invoke-RestMethod -Uri "https://api.github.com/repos/$OWNER/$REPO/actions/workflows/$WORKFLOW/dispatches" -Method POST -Headers $headers -Body $body -ContentType "application/json"

Start-Sleep -Seconds 8
Write-Host "Waiting for build (15-20 min)..." -ForegroundColor Yellow

$run = $null
while ($true) {
    $runs = Invoke-RestMethod -Uri "https://api.github.com/repos/$OWNER/$REPO/actions/runs?per_page=5" -Headers $headers
    $run = $runs.workflow_runs | Where-Object { $_.name -eq "Build iOS IPA" } | Select-Object -First 1
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "[$time] $($run.status) / $($run.conclusion)"
    if ($run.status -eq "completed") {
        if ($run.conclusion -eq "success") {
            Write-Host "Build succeeded!" -ForegroundColor Green
            break
        } else {
            Write-Host "Build failed: $($run.conclusion)" -ForegroundColor Red
            exit 1
        }
    }
    Start-Sleep -Seconds 30
}

$artifacts = Invoke-RestMethod -Uri "https://api.github.com/repos/$OWNER/$REPO/actions/runs/$($run.id)/artifacts" -Headers $headers
$artifact = $artifacts.artifacts | Where-Object { $_.name -eq "budget-ipa" } | Select-Object -First 1

if (-not $artifact) {
    Write-Host "Artifact not found" -ForegroundColor Red
    exit 1
}

Write-Host "Downloading IPA..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force $OUTPUT_DIR | Out-Null
$zipPath = Join-Path $OUTPUT_DIR "budget-ipa.zip"

Invoke-WebRequest -Uri $artifact.archive_download_url -Headers $headers -OutFile $zipPath

Write-Host "Extracting..." -ForegroundColor Cyan
$tmpDir = Join-Path $OUTPUT_DIR "_tmp"
Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force
Remove-Item $zipPath

$ipa = Get-ChildItem -Path $tmpDir -Filter "*.ipa" -Recurse | Select-Object -First 1
$newName = "budget-$(Get-Date -Format 'yyyyMMdd-HHmm').ipa"
$dest = Join-Path $OUTPUT_DIR $newName
Move-Item -Path $ipa.FullName -Destination $dest -Force
Remove-Item $tmpDir -Recurse -Force

Write-Host ""
Write-Host "Done! IPA saved at:" -ForegroundColor Green
Write-Host $dest
