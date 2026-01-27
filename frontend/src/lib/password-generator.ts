const LOWERCASE = "abcdefghijklmnopqrstuvwxyz"
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const NUMBERS = "0123456789"
const SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?"

export function generateSecurePassword(length: number = 16): string {
  const allChars = LOWERCASE + UPPERCASE + NUMBERS + SPECIAL

  // Ensure at least one of each required type
  let password = ""
  password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]
  password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]
  password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
  password += SPECIAL[Math.floor(Math.random() * SPECIAL.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("")
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
