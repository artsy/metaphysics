import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import specialistBiosData from "./data.json"
import { ResolverContext } from "types/graphql"
import { ImageType } from "schema/v2/image"

interface specialistBio {
  bio: string
  email: string
  firstName: string
  imageUrl: string
  jobTitle: string
  name: string
  specialty: string
}

const SpecialistBioType = new GraphQLObjectType<specialistBio, ResolverContext>(
  {
    name: "SpecialistBio",
    fields: {
      bio: { type: GraphQLString },
      email: { type: GraphQLString },
      firstName: { type: GraphQLString },
      image: {
        type: ImageType,
        resolve: ({ imageUrl }) => {
          if (!imageUrl) return null

          return {
            image_url: imageUrl,
          }
        },
      },
      imageUrl: { type: GraphQLString },
      jobTitle: { type: GraphQLString },
      name: { type: GraphQLString },
      specialty: { type: GraphQLString },
    },
  }
)

export const SpecialistBios: GraphQLFieldConfig<void, ResolverContext> = {
  description: "Static set of SWA specialists",
  type: new GraphQLList(SpecialistBioType),
  resolve: () => specialistBiosData,
}
