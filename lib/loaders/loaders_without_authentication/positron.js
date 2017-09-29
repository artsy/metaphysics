import { positronLoaderWithoutAuthenticationFactory as positronLoader } from "../api"

export default {
  articlesLoader: positronLoader("articles"),
  articleLoader: positronLoader(id => `articles/${id}`),
}
