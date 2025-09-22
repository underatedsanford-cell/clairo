# One-liner to parse bot commands and start the website dev server
$ErrorActionPreference = 'Stop'

# Website files are in the project root

# Ensure dependencies are installed
npm install

# Parse Discord bot commands into the website command catalog
# npm run generate:commands # Temporarily disabled

# Start Next.js dev server
npm run dev