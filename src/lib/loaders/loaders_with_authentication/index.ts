import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"
import gravityLoaders from "./gravity"
import exchangeLoaders from "./exchange"
import vortexLoaders from "./vortex"

export const createLoadersWithAuthentication = (accessToken, userID, opts) => ({
  ...gravityLoaders(accessToken, userID, opts),
  ...convectionLoaders(accessToken, opts),
  ...impulseLoaders(accessToken, userID, opts),
  ...exchangeLoaders(accessToken, opts),
  ...vortexLoaders(accessToken, opts),
})

export type LoadersWithAuthentication = ReturnType<
  typeof createLoadersWithAuthentication
>
