const fs = require('fs');
const path = require('path');

// Path to the Discord bot Python file
const DISCORD_BOT_PATH = path.resolve(__dirname, '../../sales_agent/discord_bot.py');
const COMMANDS_DATA_PATH = path.resolve(__dirname, '../app/commands/data.ts');

// Helper function to convert snake_case to Title Case
function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to create slug from command name
function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/_+/g, '-').replace(/^-+|-+$/g, '');
}

// Helper function to determine category from command name and description
function categorizeCommand(name, description) {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerName.includes('email') || lowerName.includes('send') || lowerName.includes('outreach') || lowerName.includes('drip')) {
    return 'Communication';
  }
  if (lowerName.includes('trend') || lowerName.includes('insight') || lowerName.includes('predict') || lowerName.includes('analytics')) {
    return 'Analytics';
  }
  if (lowerName.includes('lead') || lowerName.includes('score') || lowerName.includes('qualify')) {
    return 'Lead Management';
  }
  if (lowerName.includes('call') || lowerName.includes('book') || lowerName.includes('schedule')) {
    return 'Scheduling';
  }
  if (lowerName.includes('dashboard') || lowerName.includes('report') || lowerName.includes('status')) {
    return 'Reporting';
  }
  if (lowerName.includes('partner') || lowerName.includes('upsell') || lowerName.includes('cross')) {
    return 'Business Development';
  }
  if (lowerName.includes('bot') || lowerName.includes('stop') || lowerName.includes('help') || lowerName.includes('list')) {
    return 'System';
  }
  return 'General';
}

// Helper function to extract usage examples from docstrings
function extractUsageExample(docstring) {
  const usageMatch = docstring.match(/Usage:\s*([^\n]+)/);
  const exampleMatch = docstring.match(/Example:\s*([^\n]+)/);
  
  if (exampleMatch) {
    return exampleMatch[1].trim();
  }
  if (usageMatch) {
    return usageMatch[1].trim();
  }
  return null;
}

// Safely wrap text in a template literal for multi-line content
function toTemplateLiteral(text) {
  const safe = String(text || '')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return '`' + safe + '`';
}

// Parse the Discord bot file to extract command information
function parseDiscordBot() {
  if (!fs.existsSync(DISCORD_BOT_PATH)) {
    console.error(`Discord bot file not found at: ${DISCORD_BOT_PATH}`);
    return [];
  }

  const content = fs.readFileSync(DISCORD_BOT_PATH, 'utf-8');
  const commandMap = new Map(); // Use map to prevent duplicate command names

  // Parse slash commands (@bot.tree.command)
  const slashCommandRegex = /@bot\.tree\.command\(name="([^"]+)",\s*description="([^"]+)"\)[\s\S]*?async def (\w+)\(([^)]*)\):\s*"""([\s\S]*?)"""/g;
  let match;

  while ((match = slashCommandRegex.exec(content)) !== null) {
    const [, name, description, functionName, params, docstring] = match;
    
    // Skip if command name already exists to avoid duplicates
    if (commandMap.has(name)) {
      console.log(`Skipping duplicate command: ${name} (slash version)`);
      continue;
    }
    
    const command = {
      name,
      slug: createSlug(name),
      title: toTitleCase(name),
      description: description.trim(),
      longDescription: (docstring || description).trim(),
      category: categorizeCommand(name, description),
      example: extractUsageExample(docstring) || `/${name}`,
      steps: [`Execute the /${name} command in Discord`, 'Review the generated results', 'Take action based on the output'],
      ctaText: 'Try Command in Discord',
      ctaLink: 'https://discord.gg/your-bot-invite',
      permissions: ['Discord Bot Access'],
      tags: [name.replace(/_/g, ' '), categorizeCommand(name, description).toLowerCase()],
      websitePath: name === 'dashboard' ? '/analytics' : name === 'trends' ? '/trending-niches' : null
    };

    commandMap.set(name, command);
  }

  // Parse prefix commands (@bot.command)
  const prefixCommandRegex = /@bot\.command\(name="([^"]+)"(?:,\s*description="([^"]+)")?\)[\s\S]*?async def (\w+)\(([^)]*)\):\s*"""([\s\S]*?)"""/g;
  
  while ((match = prefixCommandRegex.exec(content)) !== null) {
    const [, name, description, functionName, params, docstring] = match;
    
    // Skip if command name already exists to avoid duplicates (prefer slash commands)
    if (commandMap.has(name)) {
      console.log(`Skipping duplicate command: ${name} (prefix version - keeping slash)`);
      continue;
    }
    
    // Extract description from docstring if not provided in decorator
    const finalDescription = description || docstring.split('\n')[0].trim() || `Execute ${name} command`;
    
    const command = {
      name,
      slug: createSlug(name),
      title: toTitleCase(name),
      description: finalDescription,
      longDescription: (docstring || finalDescription).trim(),
      category: categorizeCommand(name, finalDescription),
      example: extractUsageExample(docstring) || `!${name}`,
      steps: [`Execute the !${name} command in Discord`, 'Review the generated results', 'Take action based on the output'],
      ctaText: 'Try Command in Discord',
      ctaLink: 'https://discord.gg/your-bot-invite',
      permissions: ['Discord Bot Access'],
      tags: [name.replace(/_/g, ' '), categorizeCommand(name, finalDescription).toLowerCase()],
      websitePath: name === 'analytics' ? '/analytics' : name === 'trendingniches' ? '/trending-niches' : null
    };

    commandMap.set(name, command);
  }

  return Array.from(commandMap.values());
}

// Generate TypeScript command data file
function generateCommandsDataFile(parsedCommands) {
  const existingContent = fs.readFileSync(COMMANDS_DATA_PATH, 'utf-8');
  
  // Build the auto-generated commands array using template literals for longDescription
  let generatedCommands = '';
  parsedCommands.forEach((cmd, index) => {
    generatedCommands += `  {\n`;
    generatedCommands += `    slug: '${cmd.slug}',\n`;
    generatedCommands += `    title: '${cmd.title}',\n`;
    generatedCommands += `    description: '${String(cmd.description || '').replace(/'/g, "\\'")}',\n`;
    generatedCommands += `    longDescription: ${toTemplateLiteral(cmd.longDescription)},\n`;
    generatedCommands += `    category: '${cmd.category}',\n`;
    generatedCommands += `    example: '${cmd.example}',\n`;
    generatedCommands += `    steps: [\n`;
    cmd.steps.forEach(step => {
      generatedCommands += `      '${String(step).replace(/'/g, "\\'")}',\n`;
    });
    generatedCommands += `    ],\n`;
    generatedCommands += `    ctaText: '${cmd.ctaText}',\n`;
    generatedCommands += `    ctaLink: '${cmd.ctaLink}',\n`;
    generatedCommands += `    permissions: [\n`;
    cmd.permissions.forEach(perm => {
      generatedCommands += `      '${String(perm).replace(/'/g, "\\'")}',\n`;
    });
    generatedCommands += `    ],\n`;
    generatedCommands += `    tags: [\n`;
    cmd.tags.forEach(tag => {
      generatedCommands += `      '${String(tag).replace(/'/g, "\\'")}',\n`;
    });
    generatedCommands += `    ],\n`;
    if (cmd.websitePath) {
      generatedCommands += `    websitePath: '${cmd.websitePath}',\n`;
    }
    generatedCommands += `  }${index < parsedCommands.length - 1 ? ',' : ''}\n`;
  });

  const autoGeneratedSection = `
// Auto-generated commands from Discord bot
export const autoGeneratedCommands: CommandMeta[] = [
${generatedCommands}
];`;

  // Remove all existing autoGeneratedCommands blocks
  const autoGenRegexGlobal = /export const autoGeneratedCommands: CommandMeta\[\] = \[[\s\S]*?\];/gm;
  let newContent = existingContent.replace(autoGenRegexGlobal, '');

  // If allCommands export exists, insert the autoGeneratedSection immediately before it
  const allCommandsRegex = /export const allCommands\s*=\s*\[[\s\S]*?\];/m;
  if (allCommandsRegex.test(newContent)) {
    newContent = newContent.replace(allCommandsRegex, (match) => `${autoGeneratedSection}\n\n${match}`);
  } else {
    // Otherwise append the auto-generated section to the end
    newContent += `\n\n${autoGeneratedSection}\n`;
  }

  // If allCommands is completely missing, add the simple concatenation (the project may already define a custom one)
  if (!/export const allCommands\s*=/.test(newContent)) {
    newContent += '\nexport const allCommands = [...commands, ...additionalCommands, ...autoGeneratedCommands];\n';
  }

  return newContent;
}

// Main execution
function main() {
  console.log('Parsing Discord bot commands...');
  
  const parsedCommands = parseDiscordBot();
  
  if (parsedCommands.length === 0) {
    console.log('No commands found in the Discord bot file.');
    return;
  }
  
  console.log(`Found ${parsedCommands.length} commands:`);
  parsedCommands.forEach(cmd => {
    console.log(`  - ${cmd.title} (${cmd.category})`);
  });
  
  console.log('\nGenerating updated commands data file...');
  
  const newContent = generateCommandsDataFile(parsedCommands);
  
  // Backup the original file
  const backupPath = COMMANDS_DATA_PATH + '.backup';
  fs.copyFileSync(COMMANDS_DATA_PATH, backupPath);
  console.log(`Backup created at: ${backupPath}`);
  
  // Write the new content
  fs.writeFileSync(COMMANDS_DATA_PATH, newContent);
  console.log(`Updated commands data file: ${COMMANDS_DATA_PATH}`);
  
  console.log('\nCommand auto-generation completed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { parseDiscordBot, generateCommandsDataFile };