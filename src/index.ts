import express from "express"
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import { searchHotWheelsPrice } from "./services/ebayService"
import { calculateAverage, formatIDR, usdToIdr } from "./utils/priceUtils"

const app = express()
const PORT = process.env.PORT || 3000
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));


async function getNyckelToken() {
  try {
    const response = await axios.post(
      "https://www.nyckel.com/connect/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.NYCKEL_CLIENT_ID || "<clientId>",
        client_secret: process.env.NYCKEL_CLIENT_SECRET || "<clientSecret>"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    return response.data.access_token; // Ini yang bakal kita pakai di Bearer
  } catch (err) {
    console.error("Failed to get Nyckel token:", err);
    throw err;
  }
}

async function invokeNyckelFunction(token: string, imageUrl: string) {
  try {
    const response = await axios.post(
      "https://www.nyckel.com/v1/functions/hot-wheels-car/invoke",
      { data: imageUrl },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to invoke Nyckel function:",  error);
    throw error;
  }
}

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

app.post("/scan-hotwheels", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

    // ambil token Nyckel
    const token = await getNyckelToken();
    const nyckelResult = await invokeNyckelFunction(token, `data:image/jpeg;base64,${imageUrl}`);
    console.log("Nyckel Result:", nyckelResult);
    // return hasil langsung ke frontend
    res.json(nyckelResult);
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.error("Axios error response:", err.response?.data);
    } else {
      console.error("Other error:", err);
    }
    res.status(500).json({ error: "Failed to scan image" });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 HotForge backend running on http://localhost:${PORT}`)
})
