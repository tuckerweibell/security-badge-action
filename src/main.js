const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const token = core.getInput('token')
    const owner = github.context.repo.owner
    const repo = github.context.repo

    const octokit = github.getOctokit(token)

    const response = await octokit.request(
      'GET /repos/{owner}/{repo}/dependabot/alerts',
      {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    core.setOutput('dependabot-alert-count', response.data.length)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
