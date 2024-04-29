import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import specialistBiosData from "data/specialistBios.json"
import { ResolverContext } from "types/graphql"
import { ImageType } from "schema/v2/image"

interface specialistBio {
  bio: string
  email: string
  imageUrl: string
  jobTitle: string
  name: string
}

const SpecialistBioType = new GraphQLObjectType<specialistBio, ResolverContext>(
  {
    name: "SpecialistBio",
    fields: {
      bio: { type: GraphQLString },
      email: { type: GraphQLString },
      firstName: {
        type: GraphQLString,
        resolve: ({ name }) => {
          const names: string[] = (name || "").match(/[^\s,]+\.?/g) || []

          return names[0] || ""
        },
      },
      image: {
        type: ImageType,
        resolve: ({ imageUrl }) => {
          if (!imageUrl) return null

          return {
            image_url: imageUrl,
          }
        },
      },
      jobTitle: { type: GraphQLString },
      name: { type: GraphQLString },
    },
  }
)

export const SpecialistBios: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A list of specialists",
  type: new GraphQLList(SpecialistBioType),
  resolve: () => specialistBiosData,
}
