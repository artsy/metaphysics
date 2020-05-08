import { GraphQLEnumType } from "graphql"

export type FeatureImageVersion = {
  key: string
  maxWidth: number | null
  maxHeight: number | null
}

export const FEATURE_IMAGE_VERSIONS = {
  LARGE_RECTANGLE: {
    value: {
      key: "large_rectangle",
      maxWidth: 640,
      maxHeight: 480,
    },
  },
  WIDE: {
    value: {
      key: "wide",
      maxWidth: 2000,
      maxHeight: null,
    },
  },
  SQUARE: {
    value: {
      key: "square",
      maxWidth: 230,
      maxHeight: 230,
    },
  },
  SOURCE: {
    value: {
      key: "source",
      maxWidth: 1920,
      maxHeight: 1920,
    },
  },
} as const

export const FeatureImageVersionEnum = new GraphQLEnumType({
  name: "FeatureImageVersion",
  values: FEATURE_IMAGE_VERSIONS,
})
