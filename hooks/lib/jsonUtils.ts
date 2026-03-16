// Utility function to safely parse JSON with fallbacks
export function tryParseJsonLoose(input: unknown): unknown {
  // Handles: object, array, stringified JSON, double-stringified JSON
  let v: any = input
  for (let i = 0; i < 3; i++) {
    if (typeof v !== "string") return v
    const s = v.trim()
    if (!s) return null
    try {
      v = JSON.parse(s)
    } catch {
      return v
    }
  }
  return v
}
