const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const token = core.getInput('token')

    core.setOutput('dependabot-alert-count', 1)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
