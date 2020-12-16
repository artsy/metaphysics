export default {
  unique: {
    id: "unique",
    name: "Unique",
    info: "One of a kind piece",
    short_description: "This is a unique work",
    long_description: "One of a kind piece, created by the artist.",
    deprecated: false,
  },
  "limited edition": {
    id: "limited edition",
    name: "Limited edition",
    info: "Original works created in multiple",
    short_description: "This is part of a limited edition set",
    long_description: [
      "Original works created in multiple with direct involvement of the artist.",
      "Generally, less than 150 pieces total.",
    ].join(" "),
    deprecated: false,
  },
  "open edition": {
    id: "open edition",
    name: "Open edition",
    info: "The edition run is ongoing",
    short_description: "This edition run is still in production",
    long_description: [
      "The edition run is ongoing.",
      "New works are still being produced, which may be numbered.",
      "This includes made-to-order works.",
    ].join(" "),
    deprecated: false,
  },
  "unknown edition": {
    id: "unknown edition",
    name: "Unknown edition",
    info: "The edition run has ended",
    short_description: "This edition run has ended",
    long_description:
      "The edition run has ended; it is unclear how many works were produced.",
    deprecated: false,
  },
  "made-to-order": {
    id: "made-to-order",
    name: "Made-to-order",
    info: "A made-to-order piece",
    short_description: "This is a made-to-order piece",
    long_description:
      "A piece that is made-to-order, taking into account the collector’s preferences.",
    deprecated: true,
  },
  reproduction: {
    id: "reproduction",
    name: "Reproduction",
    info: "Reproduction authorized by artist’s studio or estate",
    short_description: "This work is a reproduction",
    long_description: [
      "Reproduction of an original work authorized by artist’s studio or estate.",
      "The artist was not directly involved in production.",
    ].join(" "),
    deprecated: true,
  },
  "editioned multiple": {
    id: "editioned multiple",
    name: "Editioned multiple",
    info: "High quantity editions, without direct artist involvement",
    short_description: "This is an editioned multiple",
    long_description: [
      "Pieces created in larger limited editions, authorized by the artist’s studio or estate.",
      "Not produced with direct involvement of the artist.",
    ].join(" "),
    deprecated: true,
  },
  "non-editioned multiple": {
    id: "non-editioned multiple",
    name: "Non-editioned multiple",
    info: "Works made in unlimited or unknown numbers of copies",
    short_description: "This is a non-editioned multiple",
    long_description: [
      "Works made in unlimited or unknown numbers of copies, authorized by the artist’s studio or estate.",
      "Not produced with direct involvement of the artist.",
    ].join(" "),
    deprecated: true,
  },
  ephemera: {
    id: "ephemera",
    name: "Ephemera",
    info: "Peripheral artifacts related to the artist",
    short_description: "This is ephemera, an artifact related to the artist",
    long_description: [
      "Items related to the artist, created or manufactured for a specific, limited use.",
      "This includes exhibition materials, memorabilia, autographs, etc.",
    ].join(" "),
    deprecated: true,
  },
}
