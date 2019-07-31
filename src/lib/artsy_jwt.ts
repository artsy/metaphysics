import jwt from "jwt-simple"
import config from "config"
const { HMAC_SECRET } = config

export const decodeArtsyJWT = (token: string) => {
  if (!token) {
    return null
  }
  return jwt.decode(token, HMAC_SECRET, true, "HS256")
}
