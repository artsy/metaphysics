// @ts-check
const { execSync } = require("child_process")

function getStagingEnv() {
  let envString
  try {
    envString = execSync("hokusai staging env get").toString().trim()
  } catch (/** @type {any} */ error) {
    const stderr = error.stderr?.toString() || ""
    const stdout = error.stdout?.toString() || ""

    console.error("Error running hokusai command:")
    console.error(error.message)
    console.error("stderr:", stderr)
    console.error("stdout:", stdout)

    if (stderr.includes("AccessDenied") || stdout.includes("AccessDenied")) {
      console.error("\nHint: Try setting AWS_PROFILE environment variable")
    }

    process.exit(1)
  }
  /** @type {Record<string, string>} */
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
