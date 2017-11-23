// @ts-check

import gravityLoaders from "./gravity"
import positronLoaders from "./positron"
import geminiLoaders from "./gemini"

export default requestIDs => ({
  ...gravityLoaders(requestIDs),
  ...positronLoaders(requestIDs),
  ...geminiLoaders(),
})
