import express from "express"
import { searchHotWheelsPrice } from "./services/ebayService"
import { calculateAverage, formatIDR, usdToIdr } from "./utils/priceUtils"

const app = express()
const PORT = 3000

app.get("/api/prices/hotwheels", async (req, res) => {
  try {
    const model = req.query.model as string

    if (!model) {
      return res.status(400).json({ error: "model query required" })
    }

    const prices = await searchHotWheelsPrice(model, 10)

    const avgUsd = calculateAverage(prices)
    const avgIdr = usdToIdr(avgUsd)
    const avgIdrFormatted = formatIDR(avgIdr)

    res.json({
      model,
      average_price_usd: avgUsd,
      average_price_idr: avgIdrFormatted,
      samples: prices.length,
      source: "eBay Browse API",
      last_updated: new Date().toISOString()
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch price data" })
  }
})

app.listen(PORT, () => {
  console.log(`🔥 HotForge backend running on http://localhost:${PORT}`)
})
