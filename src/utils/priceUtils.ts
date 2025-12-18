export const calculateAverage = (prices: number[]): number => {
  if (!prices.length) return 0
  const sum = prices.reduce((a, b) => a + b, 0)
  return Number((sum / prices.length).toFixed(2))
}

export const usdToIdr = (usd: number): number => {
  const RATE = 15500
  return Math.round(usd * RATE)
}

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2
  }).format(amount)
}