/**
 * Convert any string to Title Case
 * "react native" → "React Native"
 * "DATA STRUCTURES" → "Data Structures"
 * "mern stack" → "Mern Stack"
 */
export function toTitleCase(str) {
    if (!str) return str;
    return str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
