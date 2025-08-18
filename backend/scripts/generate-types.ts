import fs from 'fs';
import path from 'path';

// Read configuration
const configPath = path.join(__dirname, 'type-gen-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Get the source types
const sourcePath = path.join(__dirname, '..', config.sourcePath);
const sharedTypes = fs.readFileSync(sourcePath, 'utf8');

// Generate types for each frontend path
config.frontendPaths.forEach((frontendPath: string) => {
  const outputPath = path.join(__dirname, '..', frontendPath);
  const outputDir = path.dirname(outputPath);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate the output content
  const outputContent = `// This file is auto-generated. Do not edit directly.
// Generated from backend shared types.
// Last generated: ${new Date().toISOString()}

${sharedTypes}
`;

  // Write the output file
  try {
    fs.writeFileSync(outputPath, outputContent);
    console.log(`Successfully generated types at: ${outputPath}`);
  } catch (error) {
    console.error(`Error writing to ${outputPath}:`, error);
  }
}); 