import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
const EBAY_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"

const clientId = process.env.EBAY_CLIENT_ID!
const clientSecret = process.env.EBAY_CLIENT_SECRET!

let cachedToken: string | null = null
let tokenExpiry = 0

const getAccessToken = async (): Promise<string> => {
  const now = Date.now()

  if (cachedToken && now < tokenExpiry) {
    return cachedToken
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await axios.post(
    EBAY_AUTH_URL,
    "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  )

  cachedToken = response.data.access_token
  tokenExpiry = now + response.data.expires_in * 1000

  if (!cachedToken) {
    throw new Error("Failed to retrieve eBay access token")
    }


  return cachedToken
}

export const searchHotWheelsPrice = async (keyword: string, limit = 10) => {
  const token = await getAccessToken()

  const response = await axios.get(EBAY_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params: {
      q: keyword,
      limit,
    //   filter: "itemLocationCountry:US"
    }
  })

  const items = response.data.itemSummaries || []

  const prices = items
  .map((item: any) => Number(item.price?.value))
  .filter((p: number) => !isNaN(p))


  return prices
}