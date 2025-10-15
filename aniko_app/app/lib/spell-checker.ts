/**
 * Spell Checker Utility for Agriculture Terms
 * Uses Levenshtein distance algorithm for fuzzy string matching
 */

// Calculate Levenshtein distance between two strings
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
    }
  }

  return matrix[len1][len2]
}

// Calculate similarity percentage between two strings
export function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100
}

// Common agriculture terms for spell checking
export const AGRICULTURE_TERMS = [
  // Farming activities
  "planting",
  "harvesting",
  "irrigation",
  "fertilizer",
  "pesticide",
  "cultivation",
  "transplanting",
  "pruning",
  "weeding",
  "composting",
  // Soil terms
  "soil",
  "nutrients",
  "nitrogen",
  "phosphorus",
  "potassium",
  "organic",
  "manure",
  "mulch",
  // Climate
  "climate",
  "weather",
  "rainfall",
  "drought",
  "season",
  "temperature",
  "humidity",
  // Crop types
  "vegetable",
  "fruit",
  "grain",
  "legume",
  "cereal",
  // Problems
  "pest",
  "disease",
  "fungus",
  "bacteria",
  "blight",
  "infestation",
]

export interface SpellCheckResult {
  original: string
  corrected: string
  confidence: number
  corrections: Array<{ word: string; similarity: number }>
}

/**
 * Find the best match for a potentially misspelled word
 * @param word - The word to check
 * @param dictionary - Array of correct words to match against
 * @param threshold - Minimum similarity percentage (default 60%)
 * @returns Best match or null if no good match found
 */
export function findBestMatch(
  word: string,
  dictionary: string[],
  threshold = 60,
): { match: string; similarity: number } | null {
  let bestMatch: string | null = null
  let bestSimilarity = 0

  for (const dictWord of dictionary) {
    const similarity = calculateSimilarity(word, dictWord)
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity
      bestMatch = dictWord
    }
  }

  return bestMatch ? { match: bestMatch, similarity: bestSimilarity } : null
}

/**
 * Spell check and correct a user message
 * @param message - User's input message
 * @param cropNames - Array of crop names from database
 * @returns Spell check result with corrections
 */
export function spellCheckMessage(message: string, cropNames: string[]): SpellCheckResult {
  const words = message.toLowerCase().split(/\s+/)
  const corrections: Array<{ word: string; similarity: number }> = []
  let correctedMessage = message
  let totalConfidence = 0
  let correctionCount = 0

  // Combine crop names and agriculture terms for comprehensive checking
  const fullDictionary = [...cropNames.map((c) => c.toLowerCase()), ...AGRICULTURE_TERMS]

  for (const word of words) {
    // Skip very short words and common words
    if (word.length <= 2) continue

    // Check if word exists in dictionary (exact match)
    const exactMatch = fullDictionary.some((dictWord) => dictWord === word)
    if (exactMatch) continue

    // Find best match for potentially misspelled word
    const bestMatch = findBestMatch(word, fullDictionary, 65)

    if (bestMatch && bestMatch.similarity < 100) {
      // Found a correction
      corrections.push({
        word: `${word} → ${bestMatch.match}`,
        similarity: bestMatch.similarity,
      })

      // Replace in message (case-insensitive)
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      correctedMessage = correctedMessage.replace(regex, bestMatch.match)

      totalConfidence += bestMatch.similarity
      correctionCount++
    }
  }

  const averageConfidence = correctionCount > 0 ? totalConfidence / correctionCount : 100

  return {
    original: message,
    corrected: correctedMessage,
    confidence: averageConfidence,
    corrections,
  }
}

/**
 * Generate a friendly correction message for the user
 */
export function generateCorrectionMessage(result: SpellCheckResult): string | null {
  if (result.corrections.length === 0) return null

  const correctionList = result.corrections.map((c) => c.word).join(", ")

  if (result.corrections.length === 1) {
    return `I noticed a typo and corrected "${result.corrections[0].word.split(" → ")[0]}" to "${result.corrections[0].word.split(" → ")[1]}". Here's what I found:`
  } else {
    return `I corrected some typos: ${correctionList}. Here's what I found:`
  }
}
