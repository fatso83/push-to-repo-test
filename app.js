var server,
    config = require('./modules/configuration-loader'),
    log4js = require('log4js');

console.log('#####################')
console.log('#####################')
console.log(require, JSON.stringify(require))
console.log('#####################')
console.log('#####################')

console.log('(require.main === module) ', (require.main === module));
console.log('(require.main) ', require.main);
console.log('(module) ', module);
