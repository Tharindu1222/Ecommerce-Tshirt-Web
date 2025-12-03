# PowerShell script to setup database tables
Write-Host "`n🔧 Setting up database tables...`n" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create a .env file with your database credentials`n" -ForegroundColor Yellow
    exit 1
}

# Read .env file
$envContent = Get-Content ".env" | Where-Object { $_ -match "^\s*[^#]" }
$dbName = ($envContent | Where-Object { $_ -match "DB_NAME" }) -replace ".*=", "" -replace "\s", ""
$dbUser = ($envContent | Where-Object { $_ -match "DB_USER" }) -replace ".*=", "" -replace "\s", ""
$dbPass = ($envContent | Where-Object { $_ -match "DB_PASSWORD" }) -replace ".*=", "" -replace "\s", ""

if (-not $dbName) {
    $dbName = "tshirt_store"
}

Write-Host "Database: $dbName" -ForegroundColor Green
Write-Host "User: $dbUser`n" -ForegroundColor Green

# Run Node.js setup script
Write-Host "Running setup script...`n" -ForegroundColor Yellow
node setup-database-simple.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Setup complete! Restart your server now.`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Setup failed. Check the error messages above.`n" -ForegroundColor Red
}

