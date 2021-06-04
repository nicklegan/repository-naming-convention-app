# GitHub Repository Naming Convention App

>A GitHub App that opens an issue and sends a notification to the repository creator if a repository is created with a name not matching a set regex string.

This GitHub App is optimized to be deployed as an [Azure Function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview)

## Regex examples

Regex example 1: `####-####` (2 fixed groups separated by a dash).

- `^([a-z0-9]+)-([a-z0-9]+)$`

Regex example 2: `prefix-####-####-*` (3 groups separated by dashes starting with a prefix).
- `^(prefix)-([a-z0-9]+)-([a-z0-9]+)`

Regex example 3: `####-####-####-*` (3 groups containing names and numbers divided by dashes).

- `^([a-z0-9]+)-([a-z0-9]+)-([a-z0-9]+)`

As a default the `i` flag is recommended to allow matches to be case-insensitive

:bulb: For more info about regular expressions visit [Regular-Expressions.info](https://www.regular-expressions.info)

## Installation

Clone the repository and deploy the code to Azure by creating a new Function App in your preferred region and download a [Publish Profile](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions?tabs=javascript) for which the content has to be set as a GitHub secret. For additional setup instructions have a look [here](https://github.com/marketplace/actions/azure-functions-action#using-publish-profile-as-deployment-credential-recommended) also.

### GitHub Secrets

Create a GitHub [encrypted secret](https://docs.github.com/en/actions/reference/encrypted-secrets) with the `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` name to store your downloaded Publish Profile.

| Name                                | Value                                                                    | Required |
| :-----------------------------------| :----------------------------------------------------------------------- | :------- |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | An Azure Function App [Publish Profile] `<publishData>***</publishData>` | `true`   |
| `ACTIONS_STEP_DEBUG`                | `true` [Enables diagnostic logging]                                      | `false`  |

### Deployment

As there is already a [workflow](.github/workflows/main.yml) file for the [Azure Function Action](https://github.com/Azure/functions-action) configured, deployment will run on every `push` or manual [workflow_dispatch](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow) event when the Publish Profile is set as a GitHub secret.

```yml
name: Deploy Node.js project to Azure Function App

on:
  [push]

# CONFIGURATION
# For help, go to https://github.com/Azure/Actions
#
# 1. Set up the following secrets in your repository:
#   AZURE_FUNCTIONAPP_PUBLISH_PROFILE
#
# 2. Change these variables for your configuration:
env:
  AZURE_FUNCTIONAPP_NAME: RepoNamingConvention    # set this to your application's name
  AZURE_FUNCTIONAPP_PACKAGE_PATH: '.'             # set this to the path to your web app project, defaults to the repository root
  NODE_VERSION: '14.x'                            # set this to the node version to use (supports 8.x, 10.x, 12.x)

jobs:
  build-and-deploy:
    runs-on: windows-latest
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@master

    - name: Setup Node ${{ env.NODE_VERSION }} Environment
      uses: actions/setup-node@v1
      with:
        node-version: ${{ env.NODE_VERSION }}

    - name: 'Resolve Project Dependencies Using Npm'
      shell: pwsh
      run: |
        pushd './${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}'
        npm install
        npm run build --if-present
        npm run test --if-present
        popd
    - name: 'Run Azure Functions Action'
      uses: Azure/functions-action@v1
      id: fa
      with:
        app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
        package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

### Create a GitHub App

- Create a new GitHub App under your organization:
  - Decide on a `GitHub App name`
  - Set your Azure `Function App URL` as your GitHub App homepage: `https://<YOUR_APP_NAME>.azurewebsites.net`
  - Set your `Function URL` as your GitHub Webhook URL: `https://<YOUR_APP_NAME>.azurewebsites.net/api/<YOUR_FUNCTION>`
  - Generate and note down a [webhook secret](https://docs.github.com/en/developers/webhooks-and-events/securing-your-webhooks)
  - Only set the following `Repository permissions`: `Issues: Read & write`
  - Subscribe to following webhook events: `Repository`
  - `Create GitHub App`
  - Generate and download the GitHub App `Private Key .PEM` file
  - Note down the GitHub App `App ID`
  - Install the created GitHub App in your organization by navigating to `Install App` in the menu
  - Note down your GitHub App `Installation ID`: `https://github.com/organizations/<YOUR-ORG>/settings/installations/<INSTALLATION-ID>`
  
### Azure Function App application settings

[Login](https://portal.azure.com) to your Azure Function App and go to configuration settings and then to `Application settings` and setup the below variables.

Make sure you convert your `PRIVATE_KEY` into a single line with only two `\n` line breaks before and after the string, exactly as in the table example below.

After the GitHub App is all setup and working decide on an appropriate regex format string by using the `REGEX` and `FLAGS` variables to suit your repository naming convention needs.


| Name                                | Value                                                                                                | Required |
| :-----------------------------------| :--------------------------------------------------------------------------------------------------- | :------- |
| `INSTALLATION_ID`                   | `https://github.com/organizations/your-org/settings/installations/->INSTALLATION-ID<-` (only the ID) | `true`   |
| `APP_ID`                            | You can find the `App ID` at the top of the `About` section of the GitHub App settings               | `true`   |
| `PRIVATE_KEY`                       | `-----BEGIN PRIVATE KEY-----\nLONG_STRING_HERE\n-----END PRIVATE KEY-----`                           | `true`   |
| `GITHUB_WEBHOOK_SECRET`             | [Setting your secret token]                                                                          | `true`   |
| `REGEX`                             |`^([a-z0-9]+)-([a-z0-9]+)$` (example string)                                                          | `true`   |
| `FLAGS`                             | `i`                                                                                                  | `false`  |


[Enables diagnostic logging]: https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging#enabling-runner-diagnostic-logging 'Enabling runner diagnostic logging'

[Publish Profile]: https://github.com/Azure/functions-action#using-publish-profile-as-deployment-credential-recommended 'Azure Publish Profile'

[Setting your secret token]: https://docs.github.com/en/developers/webhooks-and-events/securing-your-webhooks#setting-your-secret-token 'Setting your secret token'
