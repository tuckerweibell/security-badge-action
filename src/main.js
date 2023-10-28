const core = require('@actions/core')
const github = require('@actions/github')
const chroma = require('chroma-js')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const color_scale = chroma.scale(['#00e604', 'yellow', 'red'])
    const token = core.getInput('token')
    const dependabotMinimum = core.getInput('dependabot-minimum')
    const dependabotMaximum = core.getInput('dependabot-maximum')
    const dependabotBadgeName = core.getInput('dependabot-badge-name')

    const context = github.context
    const octokit = github.getOctokit(token)
    const dependabot = await octokit.paginate(
      octokit.rest.dependabot.listAlertsForRepo,
      {
        ...context.repo.owner,
        ...context.repo,
        state: 'open'
      }
    )
    core.setOutput('dependabot-alert-count', dependabot.length)

    const codeql = await octokit.paginate(
      octokit.rest.codeScanning.listAlertsForRepo,
      {
        ...context.repo.owner,
        ...context.repo,
        state: 'open'
      }
    )
    core.setOutput('code-scanning-alert-count', codeql.length)

    const secrets = await octokit.paginate(
      octokit.rest.secretScanning.listAlertsForRepo,
      {
        ...context.repo.owner,
        ...context.repo,
        state: 'open'
      }
    )
    core.setOutput('secret-scanning-alert-count', secrets.length)

    const dependabotScale =
      (dependabot.length - dependabotMinimum) /
      (dependabotMaximum - dependabotMinimum)
    const dependabotColor = color_scale(dependabotScale).hex().replace('#', '')
    const dependabotUrl = `https://flat.badgen.net/badge/${dependabotBadgeName}/${dependabot.length}/${dependabotColor}`

    core.setOutput('dependabot-svg-url', dependabotUrl)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
