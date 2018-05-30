import { times, concat, clone } from "lodash"

// see https://github.com/artsy/force/issues/4705
export const params = [
  {
    id: "geometric",
    gene_id: "geometric",
    title: "Geometric",
  },
  {
    id: "landscape",
    gene_id: "landscape",
    title: "Landscape",
  },
  {
    id: "emerging-art-painting",
    gene_id: "emerging-art",
    medium: "painting",
    price_range: "50-10000",
    title: "Emerging Painting",
  },
  {
    id: "emerging-art-photography",
    gene_id: "emerging-art",
    medium: "photography",
    price_range: "50-10000",
    title: "Emerging Photography",
  },
  {
    id: "graffiti-slash-street-art",
    gene_id: "graffiti-slash-street-art",
    price_range: "50-5000",
    title: "Street Art",
  },
  {
    id: "contemporary-pop",
    gene_id: "contemporary-pop",
    medium: "prints",
    price_range: "50-5000",
    title: "Pop Prints & Multiples",
  },
  {
    id: "black-and-white",
    gene_id: "black-and-white",
    medium: "photography",
    price_range: "50-10000",
    title: "Black & White Photography",
  },
  {
    id: "abstract-art",
    gene_id: "abstract-art",
    medium: "painting",
    price_range: "50-10000",
    title: "Abstract Painting",
  },
  {
    id: "figurative-painting",
    gene_id: "figurative-painting",
    medium: "painting",
    price_range: "50-10000",
    title: "Figurative Painting",
  },
  {
    id: "collage",
    gene_id: "collage",
    medium: "work-on-paper",
    price_range: "50-5000",
    title: "Collage / Works on Paper",
  },
]

export default modules => {
  const clonedParams = clone(params)
  return concat(
    modules,
    times(10, () => {
      const index = Math.floor(Math.random() * clonedParams.length)
      const moduleParams = clonedParams[index]
      clonedParams.splice(index, 1)
      return {
        key: "generic_gene",
        display: true,
        params: moduleParams,
      }
    })
  )
}
