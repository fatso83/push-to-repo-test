#deploy-by-push
> Deployment script for git transport based deploys
> Basically a fancier way of saying `git push -f remote-deploy-repo localBranch:remoteBranch`

## Installation

```
npm install -g
```
This will put a binary in your $PATH called `deploy-by-push`. When called it needs to have
a file called `deploy.conf` in your current working directory. An example file is included.

## Intended usage
From the directory you have `deploy.conf`, you should be able to deploy by issuing

```
deploy-by-push --environment preproduction
```

This will then check out the preproduction branch from your remote repo into a temporary folder
and push the latest commit (HEAD) into the Azure instance for preproduction.

## Other options

```
```

