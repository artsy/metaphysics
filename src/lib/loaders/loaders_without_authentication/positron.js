// @ts-check

import factories from "../api"

export default requestIDs => {
  const { positronLoaderWithoutAuthenticationFactory } = factories(requestIDs)
  const positronLoader = positronLoaderWithoutAuthenticationFactory

  return {
    articlesLoader: positronLoader("articles"),
    articleLoader: positronLoader(id => `articles/${id}`),
  }
}
