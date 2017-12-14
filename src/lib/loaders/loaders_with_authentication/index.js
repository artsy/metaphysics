import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"
import gravityLoaders from "./gravity"

export default (accessToken, userID, requestIDs) => ({
  ...gravityLoaders(accessToken, userID, requestIDs),
  ...convectionLoaders(accessToken, requestIDs),
  ...impulseLoaders(accessToken, userID, requestIDs),
})
