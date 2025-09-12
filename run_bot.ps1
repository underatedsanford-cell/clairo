# Quick start script to run the Discord bot in the virtual environment
$ErrorActionPreference = 'Stop'

# Ensure we operate from the repo root regardless of where the script is invoked
$root = $PSScriptRoot
Set-Location $root

$venv = Join-Path $root '.venv'
$python = Join-Path $venv 'Scripts\python.exe'
$pip = Join-Path $venv 'Scripts\pip.exe'

if (-not (Test-Path $python)) {
  Write-Host 'Virtual environment not found. Creating...'
  python -m venv $venv
}

# Upgrade pip and install requirements
& $python -m pip install -U pip
& $pip install -r (Join-Path $root 'requirements.txt')

# Run bot (launch in background and write the Python process PID)
Write-Host 'Starting Discord bot...'
$botScript = Join-Path $root 'sales_agent\discord_bot.py'
$pidFile = Join-Path $root 'discord_bot.pid'

# Run the bot directly in the foreground to see output
& $python $botScript