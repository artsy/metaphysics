import jwt from "jwt-simple"

export const decodeArtsyJWT = (token: string, validate: boolean = true) => {
  if (!token) {
    return null
  }

  return jwt.decode(token, "", !validate, "HS256")
}
