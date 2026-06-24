const fs = require('fs');
const path = require('path');

const extractedPath = path.join(__dirname, 'extracted_products.json');
const imgDir = path.join(__dirname, '..', 'client', 'public', 'burgerking');

if (!fs.existsSync(extractedPath)) {
    console.error("extracted_products.json not found!");
    process.exit(1);
}

// Romanian text OCR cleaning function (copied from update_code_files.cjs for parity)
function cleanOcrText(text) {
    if (!text) return "";
    
    const exactDrinks = {
        "Pepsi 0,331": "Pepsi 0,33l",
        "Pepsi Max 0,331": "Pepsi Max 0,33l",
        "Pepsi Twist 0,331": "Pepsi Twist 0,33l",
        "7Up 0331": "7Up 0,33l",
        "7Up 0,331": "7Up 0,33l",
        "Mirinda Orange 0,331": "Mirinda Orange 0,33l",
        "Lipton IceTea lämåie 0,51": "Lipton IceTea lămâie 0,5l",
        "Lipton IceTea lämäie 0,51": "Lipton IceTea lămâie 0,5l",
        "Lipton IceTea piersicä 0,51": "Lipton IceTea piersică 0,5l",
        "Lipton IceTea green original 0,51": "Lipton IceTea green original 0,5l",
        "Prigat Portocalä 0,51": "Prigat Portocală 0,5l",
        "Prigat Piersicä 0,51": "Prigat Piersică 0,5l",
        "Apä platä Aqua Carpatica 0,51": "Apă plată Aqua Carpatica 0,5l",
        "Apä mineralä Aqua Carpatica 0,51": "Apă minerală Aqua Carpatica 0,5l"
    };

    let cleaned = text.trim();
    
    for (const [key, value] of Object.entries(exactDrinks)) {
        if (cleaned.toLowerCase() === key.toLowerCase()) {
            return value;
        }
        cleaned = cleaned.replace(new RegExp(escapeRegExp(key), 'gi'), value);
    }
    
    const reps = {
        "ä": "ă", "å": "ă", "ï": "i", "îi": "și", "ii": "și",
        "ro$i": "roșii", "ro$ii": "roșii", "ro$": "roș",
        "ceapä": "ceapă", "ceapå": "ceapă", "brånzä": "brânză",
        "branzä": "brânză", "brânzä": "brânză", "branză": "brânză",
        "maionezä": "maioneză", "chiflä": "chiflă", "präjiti": "prăjiți",
        "präjiCi": "prăjiți", "cartofi präjiti": "cartofi prăjiți",
        "räcoritoare": "răcoritoare", "bäutură": "băutură", "bäuturä": "băutură",
        "lämåie": "lămâie", "lämäie": "lămâie", "piersicä": "piersică",
        "apä": "apă", "platä": "plată", "făcut": "făcut", "făcută": "făcută",
        "gratăr": "grătar", "grätar": "grătar", "inveli>": "înveliș",
        "acelea$": "aceleași", "mu$ar": "muștar", "mu$tar": "muștar",
        "magann": "magazin", "acesea": "acestea", "apärea": "apărea",
        "alcl": "aici", "Adaugä": "Adaugă", "suptimentarä": "suplimentară",
        "Intormatii": "Informații", "mncare": "mâncare", "mancare": "mâncare",
        "gogoa$ä": "gogoașă", "gogosa": "gogoașă", "jalapefios": "jalapenos",
        "jalapefio": "jalapeno", "bacon ro$i": "bacon roșii", "înveli>": "înveliș",
        "aläturi": "alături", "0,51": "0,5l", "0331": "0,33l", "0,331": "0,33l"
    };

    for (const [key, value] of Object.entries(reps)) {
        cleaned = cleaned.replace(new RegExp(escapeRegExp(key), 'g'), value);
    }

    cleaned = cleaned
        .replace(/ dublu ii bacon/gi, " dublu și bacon")
        .replace(/ceapä ii/gi, "ceapă și")
        .replace(/branzä ii salatä/gi, "brânză și salată")
        .replace(/ketchup ii mu\$ar/gi, "ketchup și muștar")
        .replace(/ketchup și mu\$ar/gi, "ketchup și muștar")
        .replace(/ii/g, "și")
        .replace(/ ii /g, " și ")
        .replace(/\s+/g, " ");

    return cleaned.trim();
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Normalize name for fuzzy matching
function normalize(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // remove all non-alphanumeric characters
        .replace(/s$/g, '');       // ignore trailing 's' for plural/possessive fuzzy matching
}

const rawProducts = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
const webpFiles = fs.readdirSync(imgDir).filter(f => f.endsWith('.webp'));

console.log(`Found ${rawProducts.length} raw products and ${webpFiles.length} webp files.`);

const mappings = [];
const unmatched = [];

rawProducts.forEach(p => {
    const cleanedName = cleanOcrText(p.rawName);
    
    // 1. Look for exact match
    let match = webpFiles.find(f => {
        const base = path.basename(f, '.webp');
        return base.toLowerCase() === cleanedName.toLowerCase();
    });
    
    // 2. Fuzzy match based on normalized strings
    if (!match) {
        const normCleaned = normalize(cleanedName);
        match = webpFiles.find(f => {
            const base = path.basename(f, '.webp');
            return normalize(base) === normCleaned;
        });
    }
    
    // 3. Fallback check for special replacements (like Whopper Meal -> Whopper® Meal)
    if (!match) {
        const normCleaned = normalize(cleanedName);
        match = webpFiles.find(f => {
            const base = path.basename(f, '.webp');
            const normBase = normalize(base).replace('whopper', 'whopper');
            return normBase.includes(normCleaned) || normCleaned.includes(normBase);
        });
    }

    if (match) {
        mappings.push({
            id: p.id,
            cleanedName: cleanedName,
            webpFile: match
        });
    } else {
        unmatched.push({
            id: p.id,
            cleanedName: cleanedName
        });
    }
});

console.log(`\nSuccessfully mapped: ${mappings.length} / ${rawProducts.length}`);
console.log(`Unmatched: ${unmatched.length}`);

if (unmatched.length > 0) {
    console.log("\nUnmatched details:");
    unmatched.forEach(u => console.log(`  - ID: ${u.id} | Cleaned Name: "${u.cleanedName}"`));
}
