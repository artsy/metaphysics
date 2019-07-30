import jwt from "jwt-simple"
import config from "config"
const { HMAC_SECRET } = config

export const decodeArtsyJWT = token => {
  return jwt.decode(token as string, HMAC_SECRET, true, "HS256")
}
