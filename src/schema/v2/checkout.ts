import {
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLObjectType,
  graphql,
  GraphQLBoolean,
  GraphQLList,
} from "graphql"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"
import { schema } from "schema/v2"

const CheckoutStageType: GraphQLObjectType = new GraphQLObjectType({
  name: "CheckoutStage",
  fields: {
    stage: {
      type: GraphQLString,
      description: "The stage of the checkout",
      resolve: (stage) => {
        return stage.stage
      },
    },
    knownRequired: {
      type: GraphQLBoolean,
      description:
        "Indicates if the stage is known to be required based on current order data",
      resolve: (stage) => {
        return stage.knownRequired
      },
    },
    savedValues: {
      type: GraphQLString,
      description: "The currently saved values for the stage",
      resolve: (stage) => {
        return JSON.stringify(stage.savedValues)
      },
    },
    options: {
      type: GraphQLString,
      description: "The options for the stage",
      resolve: (stage) => {
        return JSON.stringify(stage.options)
      },
    },
  },
})

const CheckoutType: GraphQLObjectType = new GraphQLObjectType({
  name: "Checkout",
  fields: {
    orderId: {
      type: GraphQLString,
      description: "The ID of the order",
      resolve: (checkout) => {
        return checkout.order.internalID
      },
    },
    helloOrder: {
      type: GraphQLString,
      description: "Hello to the order",
      resolve: (checkout) => {
        return "Hello " + checkout.order?.state
      },
    },
    stages: {
      type: GraphQLList(CheckoutStageType),
      description: "The stages of the checkout",
      resolve: (checkout) => {
        return checkout.checkoutStages
      },
    },
    featuredImageUrl: {
      type: GraphQLString,
      description: "The cover image URL for the stage",
      resolve: (checkout) => {
        return checkout.featuredImageUrl
      },
    },
  },
})

export const Checkout: GraphQLFieldConfig<any, ResolverContext> = {
  type: CheckoutType,
  description: "Checkout flow",
  args: {
    orderId: {
      type: GraphQLString,
    },
  },

  resolve: async (_root, args, context) => {
    const { userID, exchangeGraphQLLoader } = context
    const { orderId } = args

    if (!(userID && exchangeGraphQLLoader)) {
      return null
    }

    try {
      const [orderData, userData] = await Promise.all([
        fetchOrder(orderId, context),
        fetchUser(context),
      ])
      return orderData && userData
        ? new CheckoutPresenter(orderData, userData)
        : null
    } catch (error) {
      console.error("Error fetching order", error)
    }

    return null
  },
}

class CheckoutPresenter {
  private order: OrderData
  private user?: UserData // move to presenter model

  constructor(order: OrderData, userData: UserData) {
    this.order = order
    this.user = userData
  }

  get orderID(): string {
    return this.order.internalID
  }

  get featuredImageUrl(): string {
    return this.firstArtwork.imageUrl
  }

  get checkoutStages(): any[] {
    const stages: OrderStage[] = []
    if (this.order.state === "PENDING") {
      if (this.order.mode === "OFFER") {
        stages.push({
          stage: "OFFER_AMOUNT",
          knownRequired: true,
          savedValues: this.savedOfferValues,
        })
      }

      stages.push({
        stage: "FULFILLMENT_DETAILS",
        knownRequired: true,
        savedValues: this.savedFulfillmentValues,
        options: {
          pickupAvailable: this.firstLineItem.artwork.pickupAvailable,
          shippingAvailability: this.shippingAvailability,
          savedAddresses: this.user?.addressList,
        },
      })

      if (this.shippingAvailability.artsyShippingCountries.length > 0) {
        const includeStage =
          !this.savedFulfillmentValues || this.isArtsyShipping
        console.log({ includeStage })
        includeStage &&
          stages.push({
            stage: "ARTSY_SHIPPING",
            knownRequired: this.isArtsyShipping,
            savedValues: this.savedArtsyShippingValues,
            options: this.firstLineItem.shippingQuotes ?? [
              "QUOTE",
              "ANOTHER_QUOTE",
            ],
          })
      }

      stages.push({
        stage: "PAYMENT",
        knownRequired: true,
        savedValues: this.savedPaymentValues,
        options: {
          availablePaymentMethods: [
            "CREDIT_CARD",
            "US_BANK_ACCOUNT",
            "DUBLOONS",
          ],
        },
      })
    }

    return stages
  }

  get shippingAvailability() {
    const {
      artsyShippingInternational,
      processWithArtsyShippingDomestic,
      shippingCountry,
      onlyShipsDomestically,
      euShippingOrigin,
    } = this.firstArtwork

    const lockShippingCountryTo = onlyShipsDomestically
      ? euShippingOrigin
        ? "EU"
        : shippingCountry
      : null

    const availableShippingCountries = !lockShippingCountryTo
      ? ["ALL_COUNTRY_CODES_TODO"]
      : lockShippingCountryTo === "EU"
      ? ["EU_COUNTRY_CODES_TODO"]
      : [lockShippingCountryTo]
    const artsyShippingCountries: string[] = []
    if (artsyShippingInternational) {
      artsyShippingCountries.push("ALL_COUNTRY_CODES_TODO")
    }
    if (processWithArtsyShippingDomestic) {
      artsyShippingCountries.push(
        euShippingOrigin ? "EU_COUNTRY_CODES_TODO" : shippingCountry
      )
    }
    return {
      availableShippingCountries,
      artsyShippingCountries,
    }
  }

  get firstLineItem(): any {
    return this.order.lineItems.edges[0]?.node
  }

  private get firstArtwork() {
    return this.firstLineItem?.artwork
  }

  private get isArtsyShipping(): boolean {
    return this.order.requestedFulfillment?.__typename === "CommerceShipArta"
  }

  private get savedOfferValues() {
    return this.order.myLastOffer
  }

  private get savedFulfillmentValues(): any {
    const requestedFulfillment = this.order.requestedFulfillment
    if (!requestedFulfillment) {
      return null
    }

    const fulfillmentTypeValue = ["CommerceShip", "CommerceShipArta"].includes(
      requestedFulfillment.__typeName
    )
      ? "SHIP"
      : "PICKUP"

    return {
      ...requestedFulfillment,
      fulfillmentType: fulfillmentTypeValue,
    }
  }

  private get savedArtsyShippingValues(): any {
    return null
  }

  private get savedPaymentValues(): any {
    return null
  }
}

interface UserData {
  addressList: Array<any>
}

interface OrderStage {
  stage: string
  // Some stages may not be required depending on previous selections (eg artsy shipping)
  knownRequired: boolean
  savedValues?: any
  options?: any
}
interface OrderData {
  internalID: string
  state: string
  mode: string
  requestedFulfillment: any
  myLastOffer?: any
  lineItems: {
    edges: Array<{
      node: {
        artwork: {
          id: string
          title: string
          artistNames: string
          date: string
          image: {
            url: string
          }
        }
      }
    }>
  }
}

const fetchOrder = async (orderID: string, context) => {
  try {
    const result = await graphql({
      schema: schema,
      source: checkoutOrderQuery,
      variableValues: { orderID },
      contextValue: context,
    })
    return result.data?.commerceOrder
  } catch (error) {
    console.error("Error fetching order", error)
    return null
  }
}

const fetchUser = async (context) => {
  const result = await graphql({
    schema,
    contextValue: context,
    source: gql`
      query {
        me {
          addressConnection {
            edges {
              node {
                id
                internalID
                name
                addressLine1
                addressLine2
                city
                region
                postalCode
                phoneNumber
                isDefault
              }
            }
          }
        }
      }
    `,
  })

  const me = result.data?.me
  if (!me?.addressConnection?.edges) {
    return null
  }

  const addressList = me?.addressConnection?.edges.map((edge) => edge.node)
  return { addressList }
}

const checkoutOrderQuery = gql`
  query CheckoutOrderQuery($orderID: ID!) {
    commerceOrder(id: $orderID) {
      internalID
      state
      mode
      ... on CommerceOfferOrder {
        myLastOffer {
          amount
          note
        }
      }
      requestedFulfillment {
        __typename
        ... on CommercePickup {
          phoneNumber
        }
        ... on CommerceShip {
          name
          addressLine1
          addressLine2
          city
          region
          country
          postalCode
          phoneNumber
        }
        ... on CommerceShipArta {
          name
          addressLine1
          addressLine2
          city
          region
          country
          postalCode
          phoneNumber
        }
      }
      lineItems {
        edges {
          node {
            shippingQuoteOptions {
              edges {
                node {
                  id
                  isSelected
                }
              }
            }
            artwork {
              processWithArtsyShippingDomestic
              artsyShippingInternational
              onlyShipsDomestically
              euShippingOrigin
              shippingCountry
              imageUrl
            }
          }
        }
      }
    }
  }
`
