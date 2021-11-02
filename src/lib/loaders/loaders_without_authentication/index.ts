import deltaLoaders from "./delta"
import diffusionLoaders from "./diffusion"
import convectionLoaders from "./convection"
import galaxyLoaders from "./galaxy"
import geminiLoaders from "./gemini"
import geodataLoaders from "./geodata"
import gravityLoaders from "./gravity"
import positronLoaders from "./positron"

export const createLoadersWithoutAuthentication = (opts) => ({
  ...deltaLoaders(opts),
  ...diffusionLoaders(opts),
  ...convectionLoaders(opts),
  ...galaxyLoaders(opts),
  ...geminiLoaders(),
  ...gravityLoaders(opts),
  ...positronLoaders(opts),
  ...geodataLoaders(opts),
})

export type LoadersWithoutAuthentication = ReturnType<
  typeof createLoadersWithoutAuthentication
>
