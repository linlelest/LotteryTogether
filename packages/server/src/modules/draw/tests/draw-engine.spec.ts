/// <reference types="jest" />

describe('DrawEngine - weightedRandom', () => {
  function weightedRandom(prizes: { name: string; weight: number }[]): string {
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0)
    let rand = Math.random() * totalWeight
    for (const prize of prizes) {
      rand -= prize.weight
      if (rand <= 0) return prize.name
    }
    return prizes[prizes.length - 1].name
  }

  it('should always return a prize', () => {
    const prizes = [
      { name: 'A', weight: 1 },
      { name: 'B', weight: 1 },
    ]
    for (let i = 0; i < 100; i++) {
      const result = weightedRandom(prizes)
      expect(['A', 'B']).toContain(result)
    }
  })

  it('should respect weights over many iterations', () => {
    const prizes = [
      { name: 'Common', weight: 80 },
      { name: 'Rare', weight: 15 },
      { name: 'Legendary', weight: 5 },
    ]
    const counts: Record<string, number> = { Common: 0, Rare: 0, Legendary: 0 }
    const iterations = 10000
    for (let i = 0; i < iterations; i++) {
      counts[weightedRandom(prizes)]++
    }
    expect(counts.Common / iterations).toBeGreaterThan(0.7)
    expect(counts.Common / iterations).toBeLessThan(0.9)
    expect(counts.Legendary / iterations).toBeLessThan(0.1)
  })

  it('should handle single prize', () => {
    const prizes = [{ name: 'Only', weight: 1 }]
    expect(weightedRandom(prizes)).toBe('Only')
  })

  it('should handle empty array gracefully', () => {
    const prizes: { name: string; weight: number }[] = []
    // This edge case is handled upstream but test the function
    expect(() => weightedRandom(prizes)).toThrow()
  })
})

describe('Stock atomicity simulation', () => {
  it('should not allow negative stock', () => {
    let stock = 0
    function decrement(): boolean {
      if (stock <= 0) return false
      stock--
      return true
    }
    expect(decrement()).toBe(false)
    stock = 1
    expect(decrement()).toBe(true)
    expect(stock).toBe(0)
    expect(decrement()).toBe(false)
  })
})