$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $backendPython)) {
    Write-Warning "Could not find .venv python at '$backendPython'. Falling back to 'python'."
    $backendCommand = "python -m backend.app"
} else {
    $backendCommand = "& `"$backendPython`" -m backend.app"
}

$backendStart = "Set-Location `"$repoRoot`"; $backendCommand"
$frontendStart = "Set-Location `"$repoRoot\frontend`"; npm run dev"

Write-Host "Starting backend in a new PowerShell window..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendStart
)

Write-Host "Starting frontend in a new PowerShell window..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $frontendStart
)

Write-Host "Both dev servers launched."
