const {
  requireEnv,
  subdomainFor,
  findRecord,
  deleteRecord,
} = require("./lib/cloudflare-review-app-dns")

// Name without the review-app- prefix, e.g. "foo".
const NAME = process.argv[2]

async function removeCnameRecord() {
  requireEnv({ "review app name argument": NAME })

  const subdomain = subdomainFor(NAME)

  const existing = await findRecord(subdomain)
  if (!existing) {
    console.log(
      `No CNAME record found for ${subdomain}.artsy.net, nothing to delete.`
    )
    return
  }

  await deleteRecord(existing.id)
  console.log(`CNAME record deleted for ${subdomain}.artsy.net.`)
}
;(async () => {
  try {
    await removeCnameRecord()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
