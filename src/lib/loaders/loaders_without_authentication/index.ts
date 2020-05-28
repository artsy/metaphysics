import deltaLoaders from "./delta"
import diffusionLoaders from "./diffusion"
import galaxyLoaders from "./galaxy"
import geminiLoaders from "./gemini"
import gravityLoaders from "./gravity"
import positronLoaders from "./positron"

export const createLoadersWithoutAuthentication = (opts) => ({
  ...deltaLoaders(opts),
  ...diffusionLoaders(opts),
  ...galaxyLoaders(opts),
  ...geminiLoaders(),
  ...gravityLoaders(opts),
  ...positronLoaders(opts),
})

export type LoadersWithoutAuthentication = ReturnType<
  typeof createLoadersWithoutAuthentication
>
