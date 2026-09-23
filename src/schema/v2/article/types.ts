// The minimal Positron article shape callers join on. `ArticleType` itself resolves
// against `any`, since Positron's real article payload is far larger than any one type pins down.
export interface PositronArticle {
  id: string
}
