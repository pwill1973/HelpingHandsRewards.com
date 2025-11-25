/**
 * Generate a random alphanumeric code
 */
export function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate username from email
 */
export function generateUsername(email: string): string {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
  const random = Math.floor(Math.random() * 1000)
  return `${base}${random}`.toLowerCase()
}

/**
 * Validate TON wallet address format
 * TON addresses are base64 encoded and typically start with EQ or UQ
 */
export function isValidTonAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  
  // TON addresses are 48 characters, base64 encoded, start with EQ or UQ
  const tonAddressRegex = /^[EU]Q[A-Za-z0-9_-]{46}$/
  return tonAddressRegex.test(address)
}

/**
 * Shorten TON address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'TON'): string {
  return `${amount.toFixed(2)} ${currency}`
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get position label for matrix display
 */
export function getPositionLabel(positionIndex: number): string {
  const labels: Record<number, string> = {
    1: 'L1-Left',
    2: 'L1-Right',
    3: 'L2-1',
    4: 'L2-2',
    5: 'L2-3',
    6: 'L2-4'
  }
  return labels[positionIndex] || `Position ${positionIndex}`
}
