import jwt from "jwt-simple"

export const decodeUnverifiedJWT = (token: string) => {
  if (!token) {
    return null
  }

  // NOTE: We don't verify the token when decoding here
  return jwt.decode(token, "", true, "HS256")
}
