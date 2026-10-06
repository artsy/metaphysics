// Shared Cloudflare DNS helpers for review apps.
// Used by create-review-app-subdomain.js and delete-review-app-subdomain.js.

const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4"
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

function requireEnv(extra = {}) {
  const missing = []
  if (!CLOUDFLARE_ZONE_ID) missing.push("CLOUDFLARE_ZONE_ID")
  if (!CLOUDFLARE_API_TOKEN) missing.push("CLOUDFLARE_API_TOKEN")
  Object.entries(extra).forEach(([name, value]) => {
    if (!value) missing.push(name)
  })

  if (missing.length) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`)
  }
}

const headers = () => ({
  Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  "Content-Type": "application/json",
})

// Review app host, e.g. "review-app-foo" -> "metaphysics-foo". Must match the
// ingress host set in rewrite_review_app_yaml.sh.
const subdomainFor = (branchOrName) =>
  `metaphysics-${branchOrName.replace("review-app-", "")}`

async function findRecord(subdomain) {
  const url = `${CLOUDFLARE_API_URL}/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${subdomain}.artsy.net`
  const response = await fetch(url, { headers: headers() })
  const data = await response.json()

  if (!data.success) {
    throw new Error(
      `Error looking up CNAME record: ${JSON.stringify(data.errors)}`
    )
  }

  return data.result[0]
}

async function createRecord(subdomain) {
  const response = await fetch(
    `${CLOUDFLARE_API_URL}/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        type: "CNAME",
        name: subdomain,
        content: "nginx-staging-2025.artsy.net",
        ttl: 1, // Corresponds to "Auto" in the Cloudflare UI
        proxied: true,
        tags: ["source:review-app"],
      }),
    }
  )
  const data = await response.json()

  if (!data.success) {
    throw new Error(
      `Error creating CNAME record: ${JSON.stringify(data.errors)}`
    )
  }

  return data.result
}

async function deleteRecord(id) {
  const response = await fetch(
    `${CLOUDFLARE_API_URL}/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${id}`,
    { method: "DELETE", headers: headers() }
  )
  const data = await response.json()

  if (!data.success) {
    throw new Error(
      `Error deleting CNAME record: ${JSON.stringify(data.errors)}`
    )
  }
}

module.exports = {
  requireEnv,
  subdomainFor,
  findRecord,
  createRecord,
  deleteRecord,
}
