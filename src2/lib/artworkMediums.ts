const artworkCategories = {
  Architecture: {
    id: "Architecture",
    long_description:
      "Includes architectural models; buildings (e.g., house, temple).",
    name: "Architecture",
    mediumFilterGeneSlug: "architecture-1",
    internalID: "4f99da92d8f65a0001000732",
  },
  "Books and Portfolios": {
    id: "Books and Portfolios",
    long_description:
      "Includes albums; artist books; illustrated manuscripts; portfolios (i.e., a group of works such as photographs or prints).",
    name: "Books and Portfolios",
    mediumFilterGeneSlug: "books-and-portfolios",
    internalID: "55b7f49d726169038500018e",
  },
  "Design/Decorative Art": {
    id: "Design/Decorative Art",
    long_description: [
      "Objects that are primarily functional.",
      "Includes containers (e.g., basket, bowl, box, vase); furniture (e.g., cabinet, chair, table); lighting; mirrors; tableware (e.g., flatware, plates).",
    ].join(" "),
    name: "Design/Decorative Art",
    mediumFilterGeneSlug: "design",
    internalID: "4ddbbd3c4027ac0001001962",
  },
  "Digital Art": {
    id: "Digital Art",
    long_description: [
      "A general category for works created using digital technology.",
      "whether in the form of tangible hardware, such as computer monitors or electronics, or software, such as graphics editors, websites, and programming languages.",
    ].join(" "),
    name: "Digital Art",
    mediumFilterGeneSlug: "digital-art",
    internalID: "5577512c7261690a6500046f",
  },
  "Drawing, Collage or other Work on Paper": {
    id: "Drawing, Collage or other Work on Paper",
    long_description: [
      "Includes collages; drawings; figure drawing; pen and ink; sketch.",
      "This also includes paintings where paper is the support.",
    ].join(" "),
    name: "Drawing, Collage or other Work on Paper",
    mediumFilterGeneSlug: "work-on-paper",
    internalID: "4d90d18fdcdd5f44a5000016",
  },
  "Ephemera or Merchandise": {
    id: "Ephemera or Merchandise",
    long_description: [
      "Items related to the artist, created for a specific use.",
      "This includes exhibition materials, memorabilia, autographs, skateboards, toys, and other items made with branded collaborators.",
    ].join(" "),
    name: "Ephemera or Merchandise",
    mediumFilterGeneSlug: "ephemera-or-merchandise",
    internalID: "601091be3cdb0b000649b1de",
  },
  "Fashion Design and Wearable Art": {
    id: "Fashion Design and Wearable Art",
    long_description: "Includes costumes; garments (e.g., dress, jacket).",
    name: "Fashion Design and Wearable Art",
    mediumFilterGeneSlug: "fashion-design-and-wearable-art",
    internalID: "52d9a3c41a1e868f320000f5",
  },
  Installation: {
    id: "Installation",
    long_description: "Includes land art; installation art; site-specific art.",
    name: "Installation",
    mediumFilterGeneSlug: "installation",
    internalID: "4d90d18edcdd5f44a500000e",
  },
  Jewelry: {
    id: "Jewelry",
    long_description:
      "Includes bracelets; brooches; earrings; necklaces; rings; costume accessories.",
    name: "Jewelry",
    mediumFilterGeneSlug: "jewelry",
    internalID: "507c4d4ab5f0450002001b6b",
  },
  "Mixed Media": {
    id: "Mixed Media",
    long_description:
      "Intermedia; Multimedia work that does not fall into another category.",
    name: "Mixed Media",
    mediumFilterGeneSlug: "mixed-media",
    internalID: "4d90d18edcdd5f44a500000f",
  },
  NFT: {
    id: "NFT",
    long_description:
      "Non-fungible token. Indicates that the primary medium of the work is the NFT.",
    name: "NFT",
    mediumFilterGeneSlug: "nft",
    internalID: "61df19193df532000dc9c888",
  },
  Other: {
    id: "Other",
    long_description:
      "Includes items that do not fall into any other categories (e.g., armor; musical instruments; tools).",
    name: "Other",
    mediumFilterGeneSlug: null,
    internalID: null,
  },
  Painting: {
    id: "Painting",
    long_description:
      "Includes gouache; fresco; ink and wash; oil painting; screen painting; scroll painting; tempera; watercolor.",
    name: "Painting",
    mediumFilterGeneSlug: "painting",
    internalID: "4d90d18edcdd5f44a5000010",
  },
  "Performance Art": {
    id: "Performance Art",
    long_description: "Includes body art; endurance art; live performance.",
    name: "Performance Art",
    mediumFilterGeneSlug: "performance-art",
    internalID: "4d90d18edcdd5f44a5000011",
  },
  Photography: {
    id: "Photography",
    long_description:
      "Includes chromogenic color prints (c-prints); polaroids; silver gelatin prints; photograms.",
    name: "Photography",
    mediumFilterGeneSlug: "photography",
    internalID: "4d90d18edcdd5f44a5000012",
  },
  Posters: {
    id: "Posters",
    long_description: [
      "Includes advertisements; offset lithograph posters.",
      "Please note that this does not include exhibition posters (see “Ephemera or Merchandise”).",
    ].join(" "),
    name: "Posters",
    mediumFilterGeneSlug: "poster",
    internalID: "507c6812f1a2ab0002000309",
  },
  Print: {
    id: "Print",
    long_description:
      "Includes etchings; engravings; lithographs; monoprints; screen prints; woodcuts.",
    name: "Print",
    mediumFilterGeneSlug: "prints",
    internalID: "5058f057d0c2eb4f3200030d",
  },
  Reproduction: {
    id: "Reproduction",
    long_description: [
      "Reproduction of an original work authorized by the artist or the artist's studio/estate.",
      "This includes plates from illustrated books, museum replicas, etc.",
      "Please note that the artist may not have been directly involved in the work’s production.",
    ].join(" "),
    name: "Reproduction",
    mediumFilterGeneSlug: "reproduction",
    internalID: "601091813cdb0b000649b1db",
  },
  Sculpture: {
    id: "Sculpture",
    long_description: [
      "Includes assemblage; bas-relief; carvings; figurines; masks; mosaics; statues; wall pieces.",
      "For figurines made with branded collaborators (e.g., BE@RBRICK, Medicom), please see “Ephemera or Merchandise.”",
    ].join(" "),
    name: "Sculpture",
    mediumFilterGeneSlug: "sculpture",
    internalID: "4d90d18edcdd5f44a5000013",
  },
  "Textile Arts": {
    id: "Textile Arts",
    long_description:
      "Includes banners; carpets; rugs; samplers; tapestries; weavings.",
    name: "Textile Arts",
    mediumFilterGeneSlug: "textile-arts",
    internalID: "509d1e40d0c2eb4507002a7c",
  },
  "Video/Film/Animation": {
    id: "Video/Film/Animation",
    long_description:
      "Includes 16mm film; computer animation; video recordings.",
    name: "Video/Film/Animation",
    mediumFilterGeneSlug: "film-slash-video",
    internalID: "4e2480a52f6b870001007a10",
  },
}

export default artworkCategories
