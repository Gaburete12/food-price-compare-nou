import fs from 'fs';

function fixFileIfInvalid(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  try {
    JSON.parse(originalContent);
    console.log(`${filePath} is already valid JSON!`);
    return;
  } catch (e) {
    console.log(`${filePath} is invalid. Attempting to fix...`);
  }

  let content = originalContent.trim();
  while (content.length > 0) {
    try {
      JSON.parse(content);
      console.log(`Successfully fixed and validated JSON for ${filePath}!`);
      fs.writeFileSync(filePath, content, 'utf8');
      return;
    } catch (e) {
      if (e.message.includes('Unexpected non-whitespace character') || e.message.includes('Unexpected token')) {
        const trimmed = content.trimEnd();
        if (trimmed.length === content.length) {
          content = content.slice(0, -1);
        } else {
          content = trimmed;
        }
      } else {
        console.error(`Could not fix ${filePath} due to parse error:`, e.message);
        return;
      }
    }
  }
}

fixFileIfInvalid('data/restaurant-menus.json');
fixFileIfInvalid('data/delivery-fees.json');
