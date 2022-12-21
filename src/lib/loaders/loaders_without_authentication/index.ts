import { convectionLoaders } from "./convection"
import deltaLoaders from "./delta"
import diffusionLoaders from "./diffusion"
import galaxyLoaders from "./galaxy"
import geminiLoaders from "./gemini"
import geodataLoaders from "./geodata"
import gravityLoaders from "./gravity"
import positronLoaders from "./positron"
import greenhouseLoaders from "./greenhouse"
import ipbaseLoaders from "./ipbase"
import vortexLoaders from "./vortex"

export const createLoadersWithoutAuthentication = (opts) => ({
  ...convectionLoaders(opts),
  ...deltaLoaders(opts),
  ...diffusionLoaders(opts),
  ...galaxyLoaders(opts),
  ...geminiLoaders(),
  ...gravityLoaders(opts),
  ...positronLoaders(opts),
  ...geodataLoaders(opts),
  ...greenhouseLoaders(opts),
  ...ipbaseLoaders(opts),
  ...vortexLoaders(opts),
})

export type LoadersWithoutAuthentication = ReturnType<
  typeof createLoadersWithoutAuthentication
>
