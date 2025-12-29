// Central flag utility for consistent flagcdn.com usage across the app

// Team name to ISO country code mapping for WK 2026
export const COUNTRY_CODES: Record<string, string> = {
  // North America
  "Verenigde Staten": "us", "VS": "us", "USA": "us",
  "Mexico": "mx", "Canada": "ca",
  
  // Europe
  "Nederland": "nl", "Duitsland": "de", "Frankrijk": "fr", "Spanje": "es",
  "Engeland": "gb-eng", "Italië": "it", "Portugal": "pt", "België": "be",
  "Kroatië": "hr", "Zwitserland": "ch", "Denemarken": "dk", "Polen": "pl",
  "Servië": "rs", "Oekraïne": "ua", "Oostenrijk": "at", "Tsjechië": "cz",
  "Wales": "gb-wls", "Schotland": "gb-sct", "Zweden": "se", "Noorwegen": "no",
  "Griekenland": "gr", "Turkije": "tr", "Roemenië": "ro", "Hongarije": "hu",
  "Slowakije": "sk", "Slovenië": "si", "Finland": "fi", "Ierland": "ie",
  
  // South America
  "Brazilië": "br", "Argentinië": "ar", "Uruguay": "uy", "Colombia": "co",
  "Chili": "cl", "Ecuador": "ec", "Peru": "pe", "Paraguay": "py",
  "Venezuela": "ve", "Bolivia": "bo",
  
  // Africa
  "Marokko": "ma", "Senegal": "sn", "Ghana": "gh", "Kameroen": "cm",
  "Nigeria": "ng", "Tunesië": "tn", "Egypte": "eg", "Algerije": "dz",
  "Zuid-Afrika": "za", "Ivoorkust": "ci", "Mali": "ml",
  
  // Asia & Oceania
  "Japan": "jp", "Zuid-Korea": "kr", "Australië": "au", "Saoedi-Arabië": "sa",
  "Iran": "ir", "Qatar": "qa", "China": "cn", "Indonesië": "id",
  "Bahrein": "bh", "Irak": "iq", "VAE": "ae", "Oman": "om", "Jordanië": "jo",
  "Oezbekistan": "uz", "Thailand": "th", "Vietnam": "vn", "India": "in",
  "Nieuw-Zeeland": "nz",
  
  // CONCACAF
  "Costa Rica": "cr", "Jamaica": "jm", "Honduras": "hn", "Panama": "pa",
  "El Salvador": "sv", "Guatemala": "gt", "Trinidad en Tobago": "tt",
  "Curaçao": "cw", "Haïti": "ht",
  
  // Additional countries
  "Kaapverdië": "cv",
  
  // English team names (for database entries that may use English names)
  "Netherlands": "nl", "Germany": "de", "France": "fr", "Spain": "es",
  "England": "gb-eng", "Italy": "it", "Belgium": "be", "Croatia": "hr",
  "Switzerland": "ch", "Denmark": "dk", "Poland": "pl", "Serbia": "rs",
  "Ukraine": "ua", "Austria": "at", "Czech Republic": "cz", "Czechia": "cz",
  "Sweden": "se", "Norway": "no", "Greece": "gr", "Romania": "ro",
  "Hungary": "hu", "Slovakia": "sk", "Slovenia": "si",
  "Brazil": "br", "Argentina": "ar", "Morocco": "ma",
  "Cameroon": "cm", "Tunisia": "tn", "Egypt": "eg", "Algeria": "dz",
  "South Africa": "za", "Ivory Coast": "ci", "South Korea": "kr",
  "Korea Republic": "kr", "Australia": "au", "Saudi Arabia": "sa",
  "New Zealand": "nz", "United States": "us",
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
