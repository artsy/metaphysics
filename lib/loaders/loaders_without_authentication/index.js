import {
  gravityLoaderWithoutAuthenticationFactory as gravityLoader,
  positronLoaderWithoutAuthenticationFactory as positronLoader,
} from "../api"

export default requestID => ({
  articlesLoader: positronLoader("articles"),
  articleLoader: positronLoader(id => `articles/${id}`),
  artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`, {}, { requestID }),
  artistLoader: gravityLoader(id => `artist/${id}`, {}, { requestID }),
  artworkLoader: gravityLoader(id => `artwork/${id}`, {}, { requestID }),
  fairsLoader: gravityLoader("fairs", {}, { requestID }),
  geneFamiliesLoader: gravityLoader("gene_families", {}, { requestID }),
  partnerArtistsLoader: gravityLoader(id => `artist/${id}/partner_artists`, {}, { requestID }),
  partnerLoader: gravityLoader(id => `partner/${id}`, {}, { requestID }),
  partnerShowImagesLoader: gravityLoader(id => `partner_show/${id}/images`, {}, { requestID }),
  relatedArtworksLoader: gravityLoader("related/artworks", {}, { requestID }),
  relatedContemporaryArtistsLoader: gravityLoader("related/layer/contemporary/artists", {}, { requestID }),
  relatedFairsLoader: gravityLoader("related/fairs", {}, { requestID }),
  relatedMainArtistsLoader: gravityLoader("related/layer/main/artists", {}, { requestID }),
  relatedSalesLoader: gravityLoader("related/sales", {}, { requestID }),
  relatedShowsLoader: gravityLoader("related/shows", {}, { requestID }),
  saleLoader: gravityLoader(id => `sale/${id}`, {}, { requestID }),
  salesLoader: gravityLoader("sales", {}, { requestID }),
})
