import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"
import gravityLoaders from "./gravity"

export default (accessToken, userID, opts) => {return {
  ...gravityLoaders(accessToken, userID, opts),
  ...convectionLoaders(accessToken, opts),
  ...impulseLoaders(accessToken, userID, opts),
}}
