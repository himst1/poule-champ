// Central flag utility for consistent flagcdn.com usage across the app

// Team name to ISO country code mapping for WK 2026
export const COUNTRY_CODES: Record<string, string> = {
  // North America (Host countries)
  "Verenigde Staten": "us", "VS": "us", "USA": "us", "United States": "us",
  "Mexico": "mx", "México": "mx",
  "Canada": "ca",
  
  // Europe - Dutch names
  "Nederland": "nl", "Duitsland": "de", "Frankrijk": "fr", "Spanje": "es",
  "Engeland": "gb-eng", "Italië": "it", "Portugal": "pt", "België": "be",
  "Kroatië": "hr", "Zwitserland": "ch", "Denemarken": "dk", "Polen": "pl",
  "Servië": "rs", "Oekraïne": "ua", "Oostenrijk": "at", "Tsjechië": "cz",
  "Wales": "gb-wls", "Schotland": "gb-sct", "Zweden": "se", "Noorwegen": "no",
  "Griekenland": "gr", "Turkije": "tr", "Roemenië": "ro", "Hongarije": "hu",
  "Slowakije": "sk", "Slovenië": "si", "Finland": "fi", "Ierland": "ie",
  "IJsland": "is", "Albanië": "al", "Noord-Macedonië": "mk", "Montenegro": "me",
  "Bosnië en Herzegovina": "ba", "Luxemburg": "lu", "Georgië": "ge",
  "Armenië": "am", "Azerbeidzjan": "az", "Kazachstan": "kz", "Cyprus": "cy",
  "Estland": "ee", "Letland": "lv", "Litouwen": "lt", "Malta": "mt",
  "Moldavië": "md", "Belarus": "by", "Kosovo": "xk", "Wit-Rusland": "by",
  
  // Europe - English names
  "Netherlands": "nl", "Germany": "de", "France": "fr", "Spain": "es",
  "England": "gb-eng", "Italy": "it", "Belgium": "be", "Croatia": "hr",
  "Switzerland": "ch", "Denmark": "dk", "Poland": "pl", "Serbia": "rs",
  "Ukraine": "ua", "Austria": "at", "Czech Republic": "cz", "Czechia": "cz",
  "Sweden": "se", "Norway": "no", "Greece": "gr", "Romania": "ro",
  "Hungary": "hu", "Slovakia": "sk", "Slovenia": "si", "Ireland": "ie",
  "Iceland": "is", "Albania": "al", "North Macedonia": "mk",
  "Bosnia and Herzegovina": "ba", "Georgia": "ge", "Turkey": "tr", "Türkiye": "tr",
  
  // South America - Dutch names
  "Brazilië": "br", "Argentinië": "ar", "Uruguay": "uy", "Colombia": "co",
  "Chili": "cl", "Ecuador": "ec", "Peru": "pe", "Paraguay": "py",
  "Venezuela": "ve", "Bolivia": "bo",
  
  // South America - English names
  "Brazil": "br", "Argentina": "ar", "Chile": "cl",
  
  // Africa - Dutch names
  "Marokko": "ma", "Senegal": "sn", "Ghana": "gh", "Kameroen": "cm",
  "Nigeria": "ng", "Tunesië": "tn", "Egypte": "eg", "Algerije": "dz",
  "Zuid-Afrika": "za", "Ivoorkust": "ci", "Mali": "ml", "Burkina Faso": "bf",
  "Guinee": "gn", "Gabon": "ga", "Congo": "cg", "DR Congo": "cd",
  "Zambia": "zm", "Zimbabwe": "zw", "Oeganda": "ug", "Kenia": "ke",
  "Tanzania": "tz", "Angola": "ao", "Mozambique": "mz", "Namibië": "na",
  "Botswana": "bw", "Ethiopië": "et", "Soedan": "sd", "Libië": "ly",
  "Mauritanië": "mr", "Benin": "bj", "Togo": "tg", "Niger": "ne",
  "Equatoriaal-Guinea": "gq", "Kaapverdië": "cv", "Gambia": "gm",
  "Sierra Leone": "sl", "Liberia": "lr", "Centraal-Afrikaanse Republiek": "cf",
  "Rwanda": "rw", "Burundi": "bi", "Mauritius": "mu", "Comoren": "km",
  "Madagaskar": "mg", "Lesotho": "ls", "Eswatini": "sz",
  
  // Africa - English names
  "Morocco": "ma", "Cameroon": "cm", "Tunisia": "tn", "Egypt": "eg",
  "Algeria": "dz", "South Africa": "za", "Ivory Coast": "ci",
  "Guinea": "gn", "Kenya": "ke", "Ethiopia": "et", "Sudan": "sd",
  "Libya": "ly", "Cape Verde": "cv",
  
  // Asia & Oceania - Dutch names
  "Japan": "jp", "Zuid-Korea": "kr", "Australië": "au", "Saoedi-Arabië": "sa",
  "Iran": "ir", "Qatar": "qa", "China": "cn", "Indonesië": "id",
  "Bahrein": "bh", "Irak": "iq", "VAE": "ae", "Oman": "om", "Jordanië": "jo",
  "Oezbekistan": "uz", "Thailand": "th", "Vietnam": "vn", "India": "in",
  "Nieuw-Zeeland": "nz", "Koeweit": "kw", "Syrië": "sy", "Palestina": "ps",
  "Libanon": "lb", "Jemen": "ye", "Afghanistan": "af", "Nepal": "np",
  "Maleisië": "my", "Singapore": "sg", "Filipijnen": "ph", "Myanmar": "mm",
  "Cambodja": "kh", "Laos": "la", "Mongolië": "mn", "Tadzjikistan": "tj",
  "Kirgizië": "kg", "Turkmenistan": "tm", "Noord-Korea": "kp",
  "Hongkong": "hk", "Taiwan": "tw", "Macau": "mo",
  
  // Asia & Oceania - English names
  "South Korea": "kr", "Korea Republic": "kr", "Australia": "au",
  "Saudi Arabia": "sa", "New Zealand": "nz", "United Arab Emirates": "ae",
  "UAE": "ae", "Iraq": "iq", "Uzbekistan": "uz", "Malaysia": "my",
  "Philippines": "ph", "Kyrgyzstan": "kg", "North Korea": "kp",
  
  // CONCACAF - Dutch & English names
  "Costa Rica": "cr", "Jamaica": "jm", "Honduras": "hn", "Panama": "pa",
  "El Salvador": "sv", "Guatemala": "gt", "Trinidad en Tobago": "tt",
  "Trinidad and Tobago": "tt", "Curaçao": "cw", "Haïti": "ht", "Haiti": "ht",
  "Nicaragua": "ni", "Belize": "bz", "Suriname": "sr", "Guyana": "gy",
  "Barbados": "bb", "Bermuda": "bm", "Antigua en Barbuda": "ag",
  "Saint Kitts en Nevis": "kn", "Dominica": "dm", "Grenada": "gd",
  "Saint Lucia": "lc", "Saint Vincent": "vc", "Dominicaanse Republiek": "do",
  "Dominican Republic": "do", "Cuba": "cu", "Puerto Rico": "pr",
  "Aruba": "aw", "Bonaire": "bq", "Martinique": "mq", "Guadeloupe": "gp",
  
  // Oceania
  "Fiji": "fj", "Papoea-Nieuw-Guinea": "pg", "Papua New Guinea": "pg",
  "Salomonseilanden": "sb", "Solomon Islands": "sb", "Vanuatu": "vu",
  "Nieuw-Caledonië": "nc", "New Caledonia": "nc", "Tahiti": "pf",
  "Samoa": "ws", "Tonga": "to", "Cookeilanden": "ck", "Cook Islands": "ck",
};

// Normalize string for comparison (handles Unicode variations)
const normalizeString = (str: string): string => {
  return str.normalize('NFC').trim();
};

// Create a normalized lookup map for faster matching
const normalizedCodes: Record<string, string> = {};
Object.entries(COUNTRY_CODES).forEach(([name, code]) => {
  normalizedCodes[normalizeString(name)] = code;
});

// Get all unique country names (excluding duplicates like "VS", "USA")
export const ALL_COUNTRIES = Object.keys(COUNTRY_CODES).filter(
  name => !["VS", "USA"].includes(name)
).sort((a, b) => a.localeCompare(b, 'nl'));

/**
 * Get flag image URL from flagcdn.com
 * @param teamName - The team/country name to get the flag for
 * @param width - The width of the flag image (default: 40)
 * @returns The URL to the flag image, or null if not found
 */
export const getFlagUrl = (teamName: string | null, width: number = 40): string | null => {
  if (!teamName) return null;
  
  // Try direct lookup first
  let code = COUNTRY_CODES[teamName];
  
  // If not found, try normalized lookup
  if (!code) {
    const normalized = normalizeString(teamName);
    code = normalizedCodes[normalized];
  }
  
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
};

/**
 * Get the ISO country code for a team name
 * @param teamName - The team/country name
 * @returns The ISO country code, or null if not found
 */
export const getCountryCode = (teamName: string | null): string | null => {
  if (!teamName) return null;
  
  // Try direct lookup first
  let code = COUNTRY_CODES[teamName];
  
  // If not found, try normalized lookup
  if (!code) {
    const normalized = normalizeString(teamName);
    code = normalizedCodes[normalized];
  }
  
  return code || null;
};
