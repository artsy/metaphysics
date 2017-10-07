import gravityLoaders from "./gravity"
import positronLoaders from "./positron"
import geminiLoaders from "./gemini"

export default requestID => ({
  ...gravityLoaders(requestID),
  ...positronLoaders(requestID),
  ...geminiLoaders(),
})
