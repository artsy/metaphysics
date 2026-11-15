const EITHER_DESCRIPTION = "Either option works for you."

export interface ResaleShippingPreferenceOption {
  description: string
  label: string
  value: string
}

export interface ResaleShippingPreferenceQuestion {
  field: "courierHandoff" | "packaging" | "packer"
  options: ResaleShippingPreferenceOption[]
  prompt: string
}

export const resaleShippingPreferenceQuestions: ResaleShippingPreferenceQuestion[] = [
  {
    field: "packaging",
    prompt: "How will this be packed?",
    options: [
      {
        value: "framed",
        label: "Framed",
        description: "Sold and shipped framed.",
      },
      {
        value: "rolled",
        label: "Rolled",
        description: "Removed from the frame and shipped in a tube.",
      },
      {
        value: "no_preference",
        label: "Open to both",
        description: EITHER_DESCRIPTION,
      },
    ],
  },
  {
    field: "packer",
    prompt: "Who will be packing the work?",
    options: [
      {
        value: "seller",
        label: "I’ll pack it",
        description: "You pack the work securely.",
      },
      {
        value: "courier",
        label: "Courier packs",
        description: "The courier packs the work for you.",
      },
      {
        value: "no_preference",
        label: "Open to both",
        description: EITHER_DESCRIPTION,
      },
    ],
  },
  {
    field: "courierHandoff",
    prompt: "How will the work get to its buyer?",
    options: [
      {
        value: "seller_dropoff",
        label: "I’ll drop off to courier",
        description: "Bring the packed work to a courier.",
      },
      {
        value: "courier_pickup",
        label: "Courier needs to collect",
        description: "A courier collects the artwork from your location.",
      },
      {
        value: "no_preference",
        label: "Open to both",
        description: EITHER_DESCRIPTION,
      },
    ],
  },
]
