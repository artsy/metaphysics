import { GraphQLEnumType } from "graphql"

export const ArtworkCreatedSurfaceEnumValues = {
  OS: "OS",
  CMS: "CMS",
}

export const ArtworkCreatedSurface = new GraphQLEnumType({
  name: "ArtworkCreatedSurface",
  description: "The surface an artwork was created from.",
  values: {
    OS: { value: ArtworkCreatedSurfaceEnumValues.OS },
    CMS: { value: ArtworkCreatedSurfaceEnumValues.CMS },
  },
})
