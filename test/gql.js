// This is a template string function, which returns the original string
// It's based on https://github.com/lleaff/tagged-template-noop
// Which is MIT licensed to lleaff
//
export default (strings, ...keys) => {
  const lastIndex = strings.length - 1
  return strings.slice(0, lastIndex).reduce((p, s, i) => p + s + keys[i], "") + strings[lastIndex]
}
