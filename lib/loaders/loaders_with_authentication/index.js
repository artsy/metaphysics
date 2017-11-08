import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"
import gravityLoaders from "./gravity"

export default (accessToken, userID, requestID) => ({
  ...gravityLoaders(accessToken, userID, requestID),
  ...convectionLoaders(accessToken, requestID),
  ...impulseLoaders(accessToken, userID, requestID),
})
