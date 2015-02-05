#ng-rest-deploy
> Deployment script for the REST APIs for Norgesgruppen

## Installation

```
npm install -g
```

## Intended usage
From _any_ directory, you should be able to deploy by issuing

```
ng-rest-deploy --environment preproduction
```

This will then check out the preproduction branch from GitHub into a temporary folder
and push the latest commit (HEAD) into the Azure instance for preproduction.

## Other options

```
ng-rest-deploy --environment <ENV> [--force] [--local-repo] [commit hash]

ENV             development | preproduction | production
commit hash     the commit hash to use when pushing to Azure

Options:
--local-repo    will use the current directory as the git repo to use
--force         will not prompt the user before deploying. Required for non-interactive shells
```

