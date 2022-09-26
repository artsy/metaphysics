import { causalityLoaders } from "./causality"
import convectionLoaders from "./convection"
import diffusionLoaders from "./diffusion"
import impulseLoaders from "./impulse"
import gravityLoaders from "./gravity"
import { exchangeLoaders } from "./exchange"
import vortexLoaders from "./vortex"
import { unleashLoaders } from "./unleash"

export const createLoadersWithAuthentication = (accessToken, userID, opts) => ({
  ...causalityLoaders(accessToken, userID),
  ...convectionLoaders(accessToken, opts),
  ...diffusionLoaders(accessToken, opts),
  ...exchangeLoaders(accessToken, opts),
  ...gravityLoaders(accessToken, userID, opts),
  ...impulseLoaders(accessToken, userID, opts),
  ...unleashLoaders(accessToken, opts),
  ...vortexLoaders(accessToken, opts),
})

export type LoadersWithAuthentication = ReturnType<
  typeof createLoadersWithAuthentication
>
