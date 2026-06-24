const fs = require('fs');
const path = require('path');

const extractedPath = path.join(__dirname, 'extracted_products.json');
const dbPath = path.join(__dirname, '..', 'data', 'restaurant-menus.json');
const clientDataPath = path.join(__dirname, '..', 'client', 'src', 'lib', 'data.ts');

if (!fs.existsSync(extractedPath)) {
    console.error(`Error: Extracted products file not found at ${extractedPath}`);
    process.exit(1);
}

// Read raw extracted products
let jsonStr = fs.readFileSync(extractedPath, 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const rawProducts = JSON.parse(jsonStr);

// Romanian text OCR cleaning function
function cleanOcrText(text) {
    if (!text) return "";
    
    // 1. Exact drinks matching first (handles diacritics and formatting completely and perfectly)
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
        "Apä mineralä Aqua Carpatica 0,51": "Apă minerală Aqua Carpatica 0,5l",
        // Also support clean matches in case some of them are partially cleaned or already have clean letters but wrong suffix
        "Pepsi 0,33l": "Pepsi 0,33l",
        "Pepsi Max 0,33l": "Pepsi Max 0,33l",
        "Pepsi Twist 0,33l": "Pepsi Twist 0,33l",
        "7Up 0,33l": "7Up 0,33l",
        "Mirinda Orange 0,33l": "Mirinda Orange 0,33l",
        "Lipton IceTea lămâie 0,5l": "Lipton IceTea lămâie 0,5l",
        "Lipton IceTea piersică 0,5l": "Lipton IceTea piersică 0,5l",
        "Lipton IceTea green original 0,5l": "Lipton IceTea green original 0,5l",
        "Prigat Portocală 0,5l": "Prigat Portocală 0,5l",
        "Prigat Piersică 0,5l": "Prigat Piersică 0,5l",
        "Apă plată Aqua Carpatica 0,5l": "Apă plată Aqua Carpatica 0,5l",
        "Apă minerală Aqua Carpatica 0,5l": "Apă minerală Aqua Carpatica 0,5l"
    };

    let cleaned = text.trim();
    
    // Check for exact drink matches (case-insensitive)
    for (const [key, value] of Object.entries(exactDrinks)) {
        if (cleaned.toLowerCase() === key.toLowerCase()) {
            return value;
        }
        // Also replace within the string if it is part of a longer description
        cleaned = cleaned.replace(new RegExp(escapeRegExp(key), 'gi'), value);
    }
    
    // General replacements dictionary for regular menu items (excluding conflicting drink/word stems)
    const reps = {
        "ä": "ă",
        "å": "ă",
        "ï": "i",
        "îi": "și",
        "ii": "și",
        "ro$i": "roșii",
        "ro$ii": "roșii",
        "ro$": "roș",
        "ceapä": "ceapă",
        "ceapå": "ceapă",
        "brånzä": "brânză",
        "branzä": "brânză",
        "brânzä": "brânză",
        "branză": "brânză",
        "maionezä": "maioneză",
        "chiflä": "chiflă",
        "präjiti": "prăjiți",
        "präjiCi": "prăjiți",
        "cartofi präjiti": "cartofi prăjiți",
        "räcoritoare": "răcoritoare",
        "bäutură": "băutură",
        "bäuturä": "băutură",
        "lämåie": "lămâie",
        "lämäie": "lămâie",
        "piersicä": "piersică",
        "apä": "apă",
        "platä": "plată",
        "făcut": "făcut",
        "făcută": "făcută",
        "gratăr": "grătar",
        "grätar": "grătar",
        "inveli>": "înveliș",
        "acelea$": "aceleași",
        "mu$ar": "muștar",
        "mu$tar": "muștar",
        "magann": "magazin",
        "acesea": "acestea",
        "apärea": "apărea",
        "alcl": "aici",
        "Adaugä": "Adaugă",
        "suptimentarä": "suplimentară",
        "Intormatii": "Informații",
        "mncare": "mâncare",
        "mancare": "mâncare",
        "gogoa$ä": "gogoașă",
        "gogosa": "gogoașă",
        "jalapefios": "jalapenos",
        "jalapefio": "jalapeno",
        "bacon ro$i": "bacon roșii",
        "înveli>": "înveliș",
        "aläturi": "alături",
        "0,51": "0,5l",
        "0331": "0,33l",
        "0,331": "0,33l"
    };

    for (const [key, value] of Object.entries(reps)) {
        cleaned = cleaned.replace(new RegExp(escapeRegExp(key), 'g'), value);
    }

    // specific common multi-word fixes
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

// Unified category classifier matching shared/restaurant-menus.ts
function getUnifiedCategory(name, desc) {
    const n = name.toLowerCase();
    const d = desc.toLowerCase();
    
    if (n.includes("pizza") || n.includes("paste") || n.includes("spaghetti")) {
        return "Pizza și Paste";
    }
    if (n.includes("meniu") || n.includes("bucket") || n.includes("box") || n.includes("combo") || n.includes("family") || n.includes("smart") || n.includes("loaded meals")) {
        return "Meniuri și Buckets";
    }
    if (n.includes("cola") || n.includes("sprite") || n.includes("fanta") || n.includes("pepsi") || n.includes("7up") || n.includes("mirinda") || n.includes("lipton") || n.includes("fuzetea") || n.includes("suc") || n.includes("băutură") || n.includes("bautura") || n.includes("nectar") || n.includes("shake") || n.includes("apa") || n.includes("apă") || n.includes("water") || n.includes("schweppes") || n.includes("prigat")) {
        return "Băuturi";
    }
    if (n.includes("churros") || n.includes("plăcintă") || n.includes("placinta") || n.includes("înghețată") || n.includes("inghetata") || n.includes("cookie") || n.includes("sundae") || n.includes("donut") || n.includes("desert") || n.includes("cheesecake") || n.includes("prajitura") || n.includes("prăjitură")) {
        return "Deserturi";
    }
    if (n.includes("cartofi") || n.includes("fries") || n.includes("sos") || n.includes("sauce") || n.includes("ketchup") || n.includes("barbeque") || n.includes("bbq") || n.includes("muștar") || n.includes("mustar") || n.includes("dip") || n.includes("maioneza") || n.includes("maioneză") || n.includes("usturoi") || n.includes("inele de ceap") || n.includes("criss cut") || n.includes("chili cheese nuggets") || n.includes("onion rings")) {
        return "Cartofi și sosuri";
    }
    return "Burgeri și Pui";
}

// Scan and match webp images
const imgDir = path.join(__dirname, '..', 'client', 'public', 'burgerking');
let webpFiles = [];
if (fs.existsSync(imgDir)) {
    webpFiles = fs.readdirSync(imgDir).filter(f => f.endsWith('.webp'));
}

function normalizeNameForFuzzy(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/s$/g, '');
}

function findWebpImage(cleanedName) {
    // Exact mapping overrides for OCR anomalies
    const overrides = {
        "Cartofi prăjiCi portie XXL": "Cartofi prăjiți porție XXL.webp",
        "Cartofi prăjiCi portie medie": "Cartofi prăjiți porție medie.webp",
        "Sos muitar cu miere": "Sos muștar cu miere.webp",
        "Sos dulce-acripr": "Sos dulce-acrișor.webp",
        "Choco Shake O,3L": "Choco Shake 0,3L.webp",
        "Caramel Shake O,3L": "Caramel Shake 0,3L.webp"
    };

    if (overrides[cleanedName]) {
        return overrides[cleanedName];
    }

    // 1. Look for exact match
    let match = webpFiles.find(f => {
        const base = path.basename(f, '.webp');
        return base.toLowerCase() === cleanedName.toLowerCase();
    });
    
    // 2. Fuzzy match based on normalized strings
    if (!match) {
        const normCleaned = normalizeNameForFuzzy(cleanedName);
        match = webpFiles.find(f => {
            const base = path.basename(f, '.webp');
            return normalizeNameForFuzzy(base) === normCleaned;
        });
    }
    
    // 3. Substring match
    if (!match) {
        const normCleaned = normalizeNameForFuzzy(cleanedName);
        match = webpFiles.find(f => {
            const base = path.basename(f, '.webp');
            const normBase = normalizeNameForFuzzy(base);
            return normBase.includes(normCleaned) || normCleaned.includes(normBase);
        });
    }

    return match;
}

// Map raw products to finalized MenuItems
const menuItems = rawProducts.map(p => {
    const cleanedName = cleanOcrText(p.rawName);
    const cleanedDesc = cleanOcrText(p.rawDescription);
    const category = getUnifiedCategory(cleanedName, cleanedDesc);
    
    // Resolve WebP image path
    const webpImage = findWebpImage(cleanedName);
    const resolvedImgUrl = webpImage ? `/burgerking/${webpImage}` : p.imageUrl;
    
    return {
        id: p.id,
        name: cleanedName,
        description: cleanedDesc,
        category: category,
        imageUrl: resolvedImgUrl,
        prices: [
            {
                platform: "glovo",
                available: true,
                price: p.price,
                deepLink: "https://glovoapp.com/ro/ro/constanta/stores/burger-king-cta"
            }
        ]
    };
});

console.log(`Formatted ${menuItems.length} menu items cleanly!`);

// 1. Update restaurant-menus.json
if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.menus["burgerking-constanta"] = menuItems;
    db.updatedAt = new Date().toISOString();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 4), 'utf8');
    console.log(`Successfully merged ${menuItems.length} items into data/restaurant-menus.json!`);
} else {
    console.error(`Warning: Database not found at ${dbPath}`);
}

// 2. Update client/src/lib/data.ts
if (fs.existsSync(clientDataPath)) {
    let dataContent = fs.readFileSync(clientDataPath, 'utf8');
    
    // Find the burgerking-constanta block
    const targetRestIndex = dataContent.indexOf('id: "burgerking-constanta",');
    if (targetRestIndex === -1) {
        console.error("Error: Could not find id: 'burgerking-constanta' in data.ts!");
        process.exit(1);
    }
    
    // Find the next menu: [] in the file after the index
    const menuIndex = dataContent.indexOf('menu: []', targetRestIndex);
    if (menuIndex === -1) {
        console.error("Error: Could not find menu: [] under burgerking-constanta in data.ts!");
        process.exit(1);
    }
    
    // Construct the formatted TS menu array string
    const formattedMenuStr = "menu: " + JSON.stringify(menuItems, null, 6)
        .replace(/"([^"]+)":/g, '$1:'); // convert object keys to unquoted in standard TS style
        
    // Replace the menu: [] with the new formatted array
    const updatedContent = dataContent.slice(0, menuIndex) + formattedMenuStr + dataContent.slice(menuIndex + 'menu: []'.length);
    fs.writeFileSync(clientDataPath, updatedContent, 'utf8');
    console.log(`Successfully updated static menu in client/src/lib/data.ts!`);
} else {
    console.error(`Error: client/src/lib/data.ts not found at ${clientDataPath}`);
}
