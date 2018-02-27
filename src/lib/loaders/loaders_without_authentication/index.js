// @ts-check

import deltaLoaders from "./delta"
import diffusionLoaders from "./diffusion"
import galaxyLoaders from "./galaxy"
import geminiLoaders from "./gemini"
import gravityLoaders from "./gravity"
import positronLoaders from "./positron"

export default requestIDs => ({
  ...deltaLoaders(requestIDs),
  ...diffusionLoaders(requestIDs),
  ...galaxyLoaders(requestIDs),
  ...geminiLoaders(),
  ...gravityLoaders(requestIDs),
  ...positronLoaders(requestIDs),
})
