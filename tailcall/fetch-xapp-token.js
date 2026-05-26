import { loadEnvs } from "@artsy/multienv"
import xapp from "@artsy/xapp"

loadEnvs("../.env.shared", "../.env")
const { env } = process

const xappConfig = {
  url: env.GRAVITY_API_URL,
  id: env.GRAVITY_ID,
  secret: env.GRAVITY_SECRET,
}

xapp.init(xappConfig, (_, token) => {
  console.log(token)
  process.exit(0)
})
