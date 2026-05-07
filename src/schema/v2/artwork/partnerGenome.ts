import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArray } from "graphql-relay"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"

export type PartnerGenomeGene = {
  name: string
  value: number
}

export const PartnerGenomeGeneType = new GraphQLObjectType<
  PartnerGenomeGene,
  ResolverContext
>({
  name: "PartnerGenomeGene",
  description: "A gene from the partner genome with its associated value",
  fields: {
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: "The name of the gene category",
      resolve: ({ name }) => name,
    },
    geneValue: {
      type: GraphQLNonNull(GraphQLInt),
      description: "The value/score for this gene (typically 0-100)",
      resolve: ({ value }) => value,
    },
  },
})

const GenesConnectionType = connectionWithCursorInfo({
  nodeType: PartnerGenomeGeneType,
  name: "PartnerGenomeGenesConnection",
  connectionFields: {
    totalCount: {
      type: GraphQLInt,
      description: "Total number of genes in the genome",
      resolve: ({ totalCount }) => totalCount,
    },
  },
}).connectionType

export const PartnerGenomeType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerGenome",
  description: "Partner genome data for an artwork",
  fields: {
    genesConnection: {
      type: GenesConnectionType,
      args: pageable({}),
      description: "A connection of genes with their values",
      resolve: (genomeData, args) => {
        if (!genomeData || !genomeData.genes) {
          return {
            ...connectionFromArray([], args),
            totalCount: 0,
          }
        }

        // Convert the genes object to an array of gene entries
        const genesArray: PartnerGenomeGene[] = Object.entries(
          genomeData.genes
        ).map(([name, value]) => ({
          name,
          value: value as number,
        }))

        return {
          ...connectionFromArray(genesArray, args),
          totalCount: genesArray.length,
        }
      },
    },
  },
})
