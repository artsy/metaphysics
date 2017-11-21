// @ts-check

import gravityLoaders from "./gravity"
import positronLoaders from "./positron"
import geminiLoaders from "./gemini"
import diffusionLoaders from "./diffusion"

export default requestID => ({
  ...gravityLoaders(requestID),
  ...positronLoaders(requestID),
  ...geminiLoaders(),
  ...diffusionLoaders(requestID),
})
