const {
  requireEnv,
  subdomainFor,
  findRecord,
  createRecord,
} = require("./lib/cloudflare-review-app-dns")

const BRANCH_NAME = process.env.CIRCLE_BRANCH

async function addCnameRecord() {
  requireEnv({ CIRCLE_BRANCH: BRANCH_NAME })

  const subdomain = subdomainFor(BRANCH_NAME)

  // Idempotent: the update path re-runs this job, so skip if the record exists.
  const existing = await findRecord(subdomain)
  if (existing) {
    console.log(
      `CNAME record already exists for ${subdomain}.artsy.net, skipping.`
    )
    return
  }

  const result = await createRecord(subdomain)
  console.log("CNAME record created:", result)
}
;(async () => {
  try {
    await addCnameRecord()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
