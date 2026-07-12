$NodeDir = Join-Path $PSScriptRoot ".node"
$NodeExe = Join-Path $NodeDir "node.exe"
$NpmCmd = Join-Path $NodeDir "npm.cmd"

if (-not (Test-Path $NodeExe)) {
    Write-Host "Node.js not found. Downloading portable Node.js v20.12.2..." -ForegroundColor Cyan
    $ZipPath = Join-Path $PSScriptRoot "node.zip"
    $TempDir = Join-Path $PSScriptRoot ".node-temp"
    
    # Download
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip" -OutFile $ZipPath
    
    Write-Host "Extracting Node.js..." -ForegroundColor Cyan
    if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
    Expand-Archive -Path $ZipPath -DestinationPath $TempDir
    
    # Move files to .node
    if (Test-Path $NodeDir) { Remove-Item -Recurse -Force $NodeDir }
    Move-Item -Path (Join-Path $TempDir "node-v20.12.2-win-x64") -Destination $NodeDir
    
    # Clean up temp files
    Remove-Item -Force $ZipPath
    Remove-Item -Recurse -Force $TempDir
    Write-Host "Node.js setup completed!" -ForegroundColor Green
}

# Update PATH for the current session to prioritize our local Node.js
$env:PATH = "$NodeDir;" + $env:PATH

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules"))) {
    Write-Host "Installing dependencies (npm install)..." -ForegroundColor Cyan
    & $NpmCmd install
}

# Run the dev server
Write-Host "Starting Vite development server..." -ForegroundColor Green
& $NpmCmd run dev
