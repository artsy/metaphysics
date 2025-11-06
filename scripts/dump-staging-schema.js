// @ts-check
const { execSync } = require("child_process")

function getStagingEnv() {
  const envString = execSync("hokusai staging env get").toString().trim()
  const result = {}

  for (const [key, value] of envString.split("\n").map((line) => {
    const equalsIndex = line.indexOf("=")
    return [line.slice(0, equalsIndex), line.slice(equalsIndex + 1)]
  })) {
    result[key] = value
  }

  return result
}

const env = {
  ...process.env,
  ...getStagingEnv(),
  SKIP_CONFIG_VALIDATION: "true",
}

execSync("yarn dump:local", { env })
