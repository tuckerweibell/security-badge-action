const core = require('@actions/core')
const github = require('@actions/github')
const chroma = require('chroma-js')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // Retrieve inputs from workflow
    const token = core.getInput('token')
    const gistID = core.getInput('gist-id')
    const cacheSeconds = core.getInput('cache-seconds')

    const dependabotMinimum = core.getInput('dependabot-minimum')
    const dependabotMaximum = core.getInput('dependabot-maximum')
    const dependabotBadgeName = core.getInput('dependabot-badge-name')

    const codeScanningMinimum = core.getInput('code-scanning-minimum')
    const codeScanningMaximum = core.getInput('code-scanning-maximum')
    const codeScanningBadgeName = core.getInput('code-scanning-badge-name')

    const secretScanningMinimum = core.getInput('secret-scanning-minimum')
    const secretScanningMaximum = core.getInput('secret-scanning-maximum')
    const secretScanningBadgeName = core.getInput('secret-scanning-badge-name')

    const enabledBadges = core
      .getInput('enabled-badges')
      .replace(/\s/g, '')
      .split('\n')
      .map(word => word.toLowerCase())

    const dependabotFileName = core.getInput('dependabot-filename')
    const codeScanningFileName = core.getInput('code-scanning-filename')
    const secretScanningFileName = core.getInput('secret-scanning-filename')

    // Retrieve required values to generate and use oktokit
    const context = github.context
    const octokit = github.getOctokit(token)

    // Generate array of dependabot alerts fully paginated
    const dependabot = await octokit.paginate(
      octokit.rest.dependabot.listAlertsForRepo,
      {
        ...context.repo.owner,
        ...context.repo,
        state: 'open'
      }
    )

    // Generate array of dependabot alerts fully paginated
    const codeql = await octokit.paginate(
      octokit.rest.codeScanning.listAlertsForRepo,
      {
        ...context.repo.owner,
        ...context.repo,
        state: 'open'
      }
    )

    // Generate array of secret scanning alerts fully paginated
    const secrets = await octokit.paginate(
      octokit.rest.secretScanning.listAlertsForRepo,
      {
        ...context.repo.owner,
        ...context.repo,
        state: 'open'
      }
    )

    // Calculate color grade based on min-max range for applicable bagdes

    // Generate color scale green, yellow, red (feel free to add additional scales)
    const green_yellow_red = chroma.scale(['#02a10a', '#e6d300', '#c90404'])

    // Calulate value on color scale for dependabot badge
    const dependabotScaleVal =
      (dependabot.length - dependabotMinimum) /
      (dependabotMaximum - dependabotMinimum)

    // Calulate value on color scale for code scanning badge
    const codeScanningScaleVal =
      (codeql.length - codeScanningMinimum) /
      (codeScanningMaximum - codeScanningMinimum)

    // Calulate value on color scale for secret scanning badge
    const secretScanningScaleVal =
      (secrets.length - secretScanningMinimum) /
      (secretScanningMaximum - secretScanningMinimum)

    // Generate hex value of calculated colors
    const dependabotColor = green_yellow_red(dependabotScaleVal)
      .hex()
      .replace('#', '')
    const codeScanningColor = green_yellow_red(codeScanningScaleVal)
      .hex()
      .replace('#', '')
    const secretScanningColor = green_yellow_red(secretScanningScaleVal)
      .hex()
      .replace('#', '')

    if (enabledBadges.includes('dependabot')) {
      await octokit.request('PATCH /gists/{gist_id}', {
        gist_id: gistID,
        files: {
          [dependabotFileName]: {
            content: `{"label":"${dependabotBadgeName}","message":"${dependabot.length}","namedLogo":"dependabot","schemaVersion":1,"color":"${dependabotColor}","cacheSeconds":${cacheSeconds}}`
          }
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }

    if (enabledBadges.includes('code-scanning')) {
      await octokit.request('PATCH /gists/{gist_id}', {
        gist_id: gistID,
        files: {
          [codeScanningFileName]: {
            content: `{"label":"${codeScanningBadgeName}","message":"${codeql.length}","namedLogo":"github","schemaVersion":1,"color":"${codeScanningColor}","cacheSeconds":${cacheSeconds}}`
          }
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }

    if (enabledBadges.includes('secret-scanning')) {
      await octokit.request('PATCH /gists/{gist_id}', {
        gist_id: gistID,
        files: {
          [secretScanningFileName]: {
            content: `{"label":"${secretScanningBadgeName}","message":"${secrets.length}","namedLogo":"github","schemaVersion":1,"color":"${secretScanningColor}","cacheSeconds":${cacheSeconds}}`
          }
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
