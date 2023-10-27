const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const token = core.getInput('token')
    const context = github.context

    const octokit = github.getOctokit(token)

    const response = await octokit.rest.dependabot.listAlertsForRepo({
      ...context.repo.owner,
      ...context.repo
    })

    core.setOutput('dependabot-alert-count', response.data.length)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
