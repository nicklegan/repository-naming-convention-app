const { Octokit } = require('@octokit/rest')
const Crypto = require('crypto')
const { createAppAuth } = require('@octokit/auth-app')
const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    installationId: process.env.INSTALLATION_ID
  }
})

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.')

  const b = req.body
  const hmac = Crypto.createHmac('sha256', process.env['GITHUB_WEBHOOK_SECRET'])
  const signature = hmac.update(JSON.stringify(b)).digest('hex')
  const shaSignature = `sha256=${signature}`
  const gitHubSignature = req.headers['x-hub-signature-256']
  const regex = process.env['REGEX']
  const flags = process.env['FLAGS']
  const re = new RegExp(regex, flags)

  if (!shaSignature.localeCompare(gitHubSignature)) {
    if ((b.action === 'created' || b.action === 'renamed') && b.repository && re.test(b.repository.name) === false) {
      const org_name = b.repository.owner.login
      const repo_name = b.repository.name
      const mention = b.sender.login
      octokit.issues.create({
        owner: org_name,
        repo: repo_name,
        title: `Incorrect repository name for ${org_name} / ${repo_name}`,
        body: `The repository name for [${org_name} / ${repo_name}](https://github.com/${org_name}/${repo_name}/) is incorrect.<br>Please consult the naming convention rules for the ${org_name} organization and rename the repository.<br>
                Repository created by: @${mention}<br>Expected regex format: ${regex}`
      })

      context.res = {
        status: 201,
        body: 'Incorrect repository naming convention found'
      }
    } else {
      context.res = {
        status: 200,
        body: 'No incorrect repository naming convention found'
      }
    }
  } else {
    context.res = {
      status: 401,
      body: "Signatures don't match"
    }
  }
}
