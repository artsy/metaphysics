import deltaLoaders from "./delta"
import diffusionLoaders from "./diffusion"
import galaxyLoaders from "./galaxy"
import geminiLoaders from "./gemini"
import geodataLoaders from "./geodata"
import gravityLoaders from "./gravity"
import positronLoaders from "./positron"
import greenhouseLoaders from "./greenhouse"
import vortexLoaders from "./vortex"

export const createLoadersWithoutAuthentication = (opts) => ({
  ...deltaLoaders(opts),
  ...diffusionLoaders(opts),
  ...galaxyLoaders(opts),
  ...geminiLoaders(),
  ...gravityLoaders(opts),
  ...positronLoaders(opts),
  ...geodataLoaders(opts),
  ...greenhouseLoaders(opts),
  ...vortexLoaders(opts),
})

export type LoadersWithoutAuthentication = ReturnType<
  typeof createLoadersWithoutAuthentication
>
