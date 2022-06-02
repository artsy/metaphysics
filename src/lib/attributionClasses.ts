export default {
  unique: {
    id: "unique",
    name: "Unique",
    info: null,
    short_description: "This is a unique work",
    short_array_description: ["This is", "a unique work"],
    long_description: "One-of-a-kind piece.",
  },
  "limited edition": {
    id: "limited edition",
    name: "Limited edition",
    info: null,
    short_description: "This work is part of a limited edition set",
    short_array_description: ["This work is part of", "a limited edition set"],
    long_description:
      "The edition run has ended; the number of works produced is known and included in the listing.",
  },
  "open edition": {
    id: "open edition",
    name: "Open edition",
    info: null,
    short_description: "This work is from an open edition",
    short_array_description: ["This work is from", "an open edition"],
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
    short_description: "This work is from an edition of unknown size",
    short_array_description: [
      "This work is from",
      "an edition of unknown size",
    ],
    long_description:
      "The edition run has ended; it is unclear how many works were produced.",
  },
}
