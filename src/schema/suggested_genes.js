import fetch from "../lib/apis/fetch"
import { GraphQLList } from "graphql"
import { GeneType } from "./gene"

// Takes our dummy data and makes sure that it conforms to the
// Gene's Node interface check (e.g. pass `isTypeOf` in `GeneType`.)

const suggestedGeneToGene = suggestedGene => {return {
  ...suggestedGene,
  browseable: true,
  published: true,
}}

const SUGGESTED_GENES_JSON =
  "https://s3.amazonaws.com/eigen-production/json/eigen_categories.json"

const SuggestedGenes = {
  type: new GraphQLList(GeneType),
  description: "List of curated genes with custom images",
  resolve: () =>
    {return fetch(SUGGESTED_GENES_JSON).then(({ body }) =>
      {return body.map(suggestedGeneToGene)}
    )},
}

export default SuggestedGenes
