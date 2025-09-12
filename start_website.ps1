# One-liner to parse bot commands and start the website dev server
$ErrorActionPreference = 'Stop'

# Go to website directory
Set-Location -Path "c:\Users\Admin\Desktop\sales agent\sales_agent_website"

# Ensure dependencies are installed
npm install

# Parse Discord bot commands into the website command catalog
npm run generate:commands

# Start Next.js dev server
npm run dev