import fs from 'fs';

const chunks = JSON.parse(fs.readFileSync('scratch/chunks.json', 'utf8'));
const chunk43 = chunks[43];

const payload = chunk43[1];
console.log("Chunk 43 payload length:", payload.length);
console.log("Payload starts with:", payload.slice(0, 100));

// Find the colon index
const colonIndex = payload.indexOf(':');
if (colonIndex > -1) {
  const prefix = payload.slice(0, colonIndex);
  const jsonText = payload.slice(colonIndex + 1);
  console.log("Prefix:", prefix);
  console.log("JsonText starts with:", jsonText.slice(0, 100));
  
  try {
    const data = JSON.parse(jsonText);
    fs.writeFileSync('scratch/rsc_decoded.json', JSON.stringify(data, null, 2), 'utf8');
    console.log("Successfully parsed JSON and saved to scratch/rsc_decoded.json!");
  } catch (e) {
    console.error("Failed to parse JSON directly:", e.message);
    // Let's try to extract any JSON-like substring
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > -1) {
      // Find the last brace matching
      const cleanJson = jsonText.slice(firstBrace);
      try {
        const data = JSON.parse(cleanJson);
        fs.writeFileSync('scratch/rsc_decoded.json', JSON.stringify(data, null, 2), 'utf8');
        console.log("Successfully parsed JSON after trimming prefix and saved!");
      } catch (err) {
        console.error("Trimmed JSON parse failed too:", err.message);
        // Let's write the raw jsonText to file to see what it is
        fs.writeFileSync('scratch/rsc_raw_text.txt', jsonText, 'utf8');
      }
    }
  }
}
