// Allows JSON importing
declare module "*.json" {
  const value: any
  export default value
}

declare module "" {
  global {
    const __TEST__: boolean
  }
}
