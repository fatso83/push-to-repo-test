#deploy-by-push
> Deployment script for git transport based deploys. Basically a fancier way of 
> saying 
```
git push -f remote-deploy-repo localBranch:remoteBranch
```

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
and push the latest commit (HEAD) into your remote repo for preproduction.


```
deploy-by-push --environment preproduction --local --commit 5a7712la1
```
This will clone your local repo and push the specified commit to your preproduction branch

## Other options

```
$ deploy-by-push

  Usage: deploy-by-push [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -e, --environment <env>  Available environments: production | preproduction | development
    -l, --local              will use the current directory as the git repo to use (default: GitHub)
    -f, --force              will not prompt for confirmation. Required for non-interactive shells
    -c, --commit <tree-ish>  Use the specified commit/tag/branch [default is environment specific]
    -v, --verbose            Increase logging output, apply twice for debug output
```

