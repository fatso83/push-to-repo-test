#!/usr/bin/env node

/**
 * Skeleton deployment script for git transports
 *
 * Modify as needed.
 */

var colors = require('colors'),// loading the program changes String.prototype
    _ = require('lodash'),
    util = require('util'),
    winston = require('winston'),
    Promise = require('es6-promise').Promise,
    promisify = require('promisify-node'),
    exec = promisify(require('child_process').exec),
    spawn = require('child_process').spawn,
    fse = promisify(require('fs-extra')),
    mktemp = promisify(require('mktemp')),
    nodegit = require('nodegit'),
    path = require('path'),
    program = require('commander'),
    pkg = require(path.join(__dirname, 'package.json')),
    config = {
        interactive: !!process.stdin.isTTY,
        environment: {}
    },
    logger = new winston.Logger({
        transports: [
            new winston.transports.Console({level: 'debug'})
        ]
    }),
    verbosity = 0,
    available_envs,
    environmentConfig,
    tmpDir;


function loadConfig(path_to_configuration) {
    var userConfig;

    try {
        userConfig = fse.readJSONFileSync(path_to_configuration);
    } catch (error) {
        console.log('Did not find the configuration file: ' + path_to_configuration);
        console.log('Are you outside of a project directory, or is the config file missing?');
        process.exit(1);
    }

    _.extend(config, userConfig)
}

// Could not get nodekit to work for cloning repos.
// Therefore using git directly
// @see https://github.com/nodegit/nodegit/issues/372
function cloneRemoteRepoToTemporaryFolder(repoUrl, tmpFolder) {
    var execString = util.format('git clone %s %s', repoUrl, tmpFolder);

    logger.debug('Executing: ' + execString);

    return exec(execString);
}

function cloneLocalRepoToTempFolder(localFolder, tmpFolder) {
    var execString = util.format('git clone --local file://%s %s', localFolder, tmpFolder);
    logger.debug('Executing: ' + execString);

    return exec(execString);
}

function checkout(treeish, opts) {
    var s = 'git checkout ' + treeish;
    logger.debug('Executing: ' + s);
    return exec(s, opts);
}


function pushToRemoteRepo() {
    // push to remote repo

    // by inheriting the iostreams, we don't have to set up manual
    // listeners and forward the data to/from the child process
    var git = spawn('git', [
        'push',
        '-f',
        environmentConfig.dst.repo,
        environmentConfig.src.branch + ':' + environmentConfig.dst.branch
    ], {stdio: 'inherit', cwd: tmpDir});

    return new Promise(function (resolve, reject) {

        git.on('close', function (code) {
            if (code !== 0) {
                reject(new Error('git exited with non-zero status'));
            }
            else {
                resolve();
            }
        })
    });

}

function addRemote(repoRes) {
    return Promise.all(
        [
            repoRes.getHeadCommit()
            ,
            new Promise(function (resolve, reject) {
                repoRes.getRemote(config.remote_name, function (err, remote) {
                    if (err) {
                        var s = util.format(
                            'git remote add %s %s',
                            environmentConfig.dst.remote_name,
                            environmentConfig.dst.repo);

                        logger.info(util.format('Adding remote for push (%s)', environmentConfig.dst.remote_name));
                        logger.debug('Executing: ' + s);

                        // adding
                        exec(s, {cwd: tmpDir}).then(resolve, reject);
                    } else {
                        logger.debug('Existing remote named ' + remote + '. Not doing anything.');
                        resolve();
                    }
                });
            })
        ])
}

function promptUserIfNecessary() {
    if (!environmentConfig.warn) {
        return;
    }

    if (program.force) {
        return;
    }

    if (!config.interactive) {
        throw new Error('The program is not in interactive mode and '
        + ' --force is not specified. Cannot ask for user input');
    }

    console.log(util.format('Forcing push to remote repo [%s]', program.environment));
    // Write directly to stream to avoid automatic newline
    process.stdout.write('Are you sure you want to continue (Y/N)?: '.red);

    return new Promise(function (resolve, reject) {

        process.stdin.on('data', function tmp(chunk) {
            var buf = chunk.toString();

            process.stdin.pause();

            if (buf.trim() === 'Y') {
                resolve();
            } else {
                reject();
            }

            process.stdin.removeListener('data', tmp);
        });


    });
}


loadConfig('./deploy.conf');
available_envs = Object.keys(config.environment);

/*
 * Parse command line options
 * the options will be available as properties on the program variable
 */
program
    .version(pkg.version)
    .option('-e, --environment <env>', 'Available environments: ' + available_envs.join(' | '), function (env) {
        if (!(env in config.environment)) {
            console.log('Unknown deployment environment: ', env);
            process.exit(1);
        }
        environmentConfig = config.environment[env];
    })
    .option('-l, --local', 'will use the current directory as the git repo to use (default: GitHub)')
    .option('-f, --force', 'will not prompt for confirmation. Required for non-interactive shells')
    .option('-c, --commit <tree-ish>', 'Use the specified commit/tag/branch [default is environment specific]')
    .option('-v, --verbose', 'Increase logging output, apply twice for debug output', function () {
        verbosity++;
    })
    .parse(process.argv);

switch (verbosity) {
    case 0:
        logger.transports.console.level = 'warn';
        break;
    case 1:
        logger.transports.console.level = 'info';
        break;
    case 2:
        logger.transports.console.level = 'debug';
        break;
}

logger.debug("\nConfiguration:\n" + util.inspect(config, false, 3));


/*
 *  start as a CLI program if run directly from node
 **/
if (!program.environment) {
    program.help();
}


logger.info('Creating  temporary directory');

mktemp.createDir('.tmpXXXXXXX')
    .then(function (path) {

        tmpDir = path;

        if (program.local) {
            var localFolder = process.cwd();
            logger.info(util.format('Cloning local Git directory (%s)', localFolder));
            return cloneLocalRepoToTempFolder(localFolder, path);
        } else {
            var repoUrl = config.src_repo;
            logger.info(util.format('Cloning remote Git directory (%s)', repoUrl));
            return cloneRemoteRepoToTemporaryFolder(repoUrl, path);
        }
    })
    .then(function () {
        var treeish = program.commit || environmentConfig.src.branch;
        logger.info('Checking out ' + treeish);
        return checkout(treeish, {cwd: tmpDir});
    })
    .then(function () {
        logger.info('Opening repo ' + tmpDir);
        return nodegit.Repository.open(tmpDir);
    })
    .then(addRemote)
    .then(function (vals) {
        return vals[0];
    })
    .then(function (commit) {
        console.log('\nCommit info'.green);
        console.log('SHA1:', commit.sha());
        console.log('Author:', commit.author().name() + ' <' + commit.author().email() + '>');
        console.log('Date:', commit.date());
        console.log('\n    ' + commit.message());
    })
    .then(promptUserIfNecessary)
    .then(pushToRemoteRepo)
    .catch(function (err) {
        var msg = 'Abnormal exit. '.red;
        var errMsg = 'Unknown error';

        if (err !== undefined) {

            if (err.message) {
                errMsg = err.message;
            }
            else if (typeof err === 'string') {
                errMsg = err;
            }
            else {
                logger.debug(util.inspect(err));
            }
        }

        process.stderr.write(util.format('%s (%s)', msg, errMsg) + '\n');
    })
    .then(function () {
        if (tmpDir) {
            logger.info('Removing temporary directory');
            return fse.remove(tmpDir);
        }
    });
