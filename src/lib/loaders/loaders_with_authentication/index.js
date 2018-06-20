import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"
import gravityLoaders from "./gravity"
import stressLoaders from "./exchange"

export default (accessToken, userID, opts) => ({
  ...gravityLoaders(accessToken, userID, opts),
  ...convectionLoaders(accessToken, opts),
  ...impulseLoaders(accessToken, userID, opts),
  ...stressLoaders(accessToken, opts),
})
