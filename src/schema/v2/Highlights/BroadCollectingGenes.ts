import fetch from "lib/apis/fetch"
import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { GeneType } from "../gene"
import { ResolverContext } from "types/graphql"

// Takes our dummy data and makes sure that it conforms to the
// Gene's Node interface check (e.g. pass `isTypeOf` in `GeneType`.)

const suggestedGeneToGene = (suggestedGene) => ({
  ...suggestedGene,
  browseable: true,
  published: true,
})

const SUGGESTED_GENES_JSON =
  "https://s3.amazonaws.com/eigen-production/json/eigen_categories.json"

export const BroadCollectingGenesField: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: new GraphQLList(GeneType),
  description:
    "List of curated genes that are broad collecting. (Meant for e.g. suggestions in on-boarding.)",
  resolve: () =>
    // FIXME: Cache either at the file level or in the same cache store that
    //        dataloaders store data in.
    fetch(SUGGESTED_GENES_JSON).then(({ body }) =>
      body.map(suggestedGeneToGene)
    ),
}
