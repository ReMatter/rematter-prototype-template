// ID generation service

export const idService = {
  generate(prefix?: string): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return prefix ? `${prefix}-${id}` : id
  },

  // Generate sequential IDs like SO-0001, PO-0001, etc.
  generateSequential(prefix: string, currentMax: number): string {
    const nextNum = currentMax + 1
    return `${prefix}-${nextNum.toString().padStart(4, '0')}`
  },

  // Helper to get next sequential from existing order numbers
  nextSequential(prefix: string, existingOrderNumbers: string[]): string {
    const maxNum = existingOrderNumbers.reduce((max, orderNum) => {
      const match = orderNum.match(new RegExp(`^${prefix}-(\\d+)$`))
      if (match) {
        return Math.max(max, parseInt(match[1], 10))
      }
      return max
    }, 0)
    return this.generateSequential(prefix, maxNum)
  },
}
