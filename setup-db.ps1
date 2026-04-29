# HostelMS – Database Setup Script
# Run this in PowerShell to create the MySQL database automatically
# Usage: Right-click → "Run with PowerShell"
# OR in terminal: .\setup-db.ps1

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   HostelMS - MySQL Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check mysql.exe exists
if (-Not (Test-Path $mysqlExe)) {
    # Try searching
    $found = Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter "mysql.exe" -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notlike "*Workbench*" } |
             Select-Object -First 1 -ExpandProperty FullName
    if ($found) { $mysqlExe = $found }
    else {
        Write-Host "ERROR: mysql.exe not found." -ForegroundColor Red
        Write-Host "Make sure MySQL Server 8.0+ is installed." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Found MySQL at: $mysqlExe" -ForegroundColor Green
Write-Host ""

# Prompt for MySQL root password
$password = Read-Host "Enter your MySQL root password (leave blank if none)" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$schemaPath = Join-Path $PSScriptRoot "backend\schema.sql"

Write-Host ""
Write-Host "Running schema.sql..." -ForegroundColor Yellow

# Build the mysql command arguments
if ($plainPassword -eq "") {
    $result = & $mysqlExe -u root --execute="SOURCE $schemaPath" 2>&1
} else {
    $result = & $mysqlExe -u root --password=$plainPassword --execute="SOURCE $schemaPath" 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Database 'hostel_db' created with all tables and seed data." -ForegroundColor Green
    Write-Host ""

    # Update .env file automatically
    $envPath = Join-Path $PSScriptRoot "backend\.env"
    $envContent = Get-Content $envPath -Raw
    if ($plainPassword -ne "") {
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$plainPassword"
        Set-Content $envPath $envContent
        Write-Host "Updated backend\.env with your DB password." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Open a terminal in 'backend' folder" -ForegroundColor White
    Write-Host "  2. Run: npm start" -ForegroundColor White
    Write-Host "  3. Open: http://localhost:5000/pages/login.html" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERROR running schema.sql:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  - Check your MySQL root password" -ForegroundColor White
    Write-Host "  - Make sure MySQL Server service is running" -ForegroundColor White
    Write-Host "  - Open MySQL Workbench and run backend\schema.sql manually" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
