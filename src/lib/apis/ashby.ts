import urljoin from "url-join"
import fetch from "node-fetch"

export const ashby = async (path: string, { body = {} } = {}) => {
  const response = await fetch(urljoin("https://api.ashbyhq.com", path), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Basic ${Buffer.from(
        process.env.ASHBY_API_KEY + ":" + process.env.ASHBY_API_KEY
      ).toString("base64")}`,
    },
    body: JSON.stringify(body),
  })

  return response.json()
}
