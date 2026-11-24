export default {
  unique: {
    id: "unique",
    name: "Unique",
    info: null,
    short_description: "Unique work",
    short_array_description: ["", "Unique work"],
    long_description: "One-of-a-kind piece.",
  },
  "limited edition": {
    id: "limited edition",
    name: "Limited edition",
    info: null,
    short_description: "Part of a limited edition set",
    short_array_description: ["Part of a", "limited edition set"],
    long_description:
      "The edition run has ended; the number of works produced is known and included in the listing.",
  },
  "open edition": {
    id: "open edition",
    name: "Open edition",
    info: null,
    short_description: "From an open edition",
    short_array_description: ["From an", "open edition"],
    long_description: [
      "The edition run is ongoing.",
      "New works are still being produced, which may be numbered.",
      "This includes made-to-order works.",
    ].join(" "),
  },
  "unknown edition": {
    id: "unknown edition",
    name: "Unknown edition",
    info: null,
    short_description: "From an unknown edition",
    short_array_description: ["From an", "unknown edition"],
    long_description:
      "The edition run has ended; it is unclear how many works were produced.",
  },
}
