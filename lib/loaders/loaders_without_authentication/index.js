// @ts-check

import deltaLoaders from "./delta"
import diffusionLoaders from "./diffusion"
import geminiLoaders from "./gemini"
import gravityLoaders from "./gravity"
import positronLoaders from "./positron"

export default requestIDs => ({
  ...deltaLoaders(requestIDs),
  ...diffusionLoaders(requestIDs),
  ...geminiLoaders(),
  ...gravityLoaders(requestIDs),
  ...positronLoaders(requestIDs),
})
