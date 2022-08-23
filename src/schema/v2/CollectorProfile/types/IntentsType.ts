import { GraphQLEnumType } from "graphql"

export const IntentsType = new GraphQLEnumType({
  name: "Intents",
  values: {
    BUY_ART_AND_DESIGN: {
      value: "buy art & design",
    },
    SELL_ART_AND_DESIGN: {
      value: "sell art & design",
    },
    RESEARCH_ART_PRICES: {
      value: "research art prices",
    },
    LEARN_ABOUT_ART: {
      value: "learn about art",
    },
    FIND_ART_EXHIBITS: {
      value: "find out about new exhibitions",
    },
    READ_ART_MARKET_NEWS: {
      value: "read art market news",
    },
  },
})
