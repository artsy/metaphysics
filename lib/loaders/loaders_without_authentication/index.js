// @ts-check

import gravityLoaders from "./gravity"
import positronLoaders from "./positron"
import geminiLoaders from "./gemini"
import diffusionLoaders from "./diffusion"

export default requestIDs => ({
  ...gravityLoaders(requestIDs),
  ...positronLoaders(requestIDs),
  ...geminiLoaders(),
  ...diffusionLoaders(requestID),
})
