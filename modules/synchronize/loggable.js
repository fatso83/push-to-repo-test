var _logger;

/**
 *  Turn on debug logging of arguments and result
 *
 * @param fn the function - has to have a name!
 * @param [opts] if not given, assume all options are set to true
 * @param [opts.args] - output arguments
 * @param [opts.res] - output res
 * @returns {Function}
 */
function loggable (fn, opts) {
	var outputArgs = opts ? opts.args : true;
	var outputResult = opts ? opts.res : true;

	return function () {
		var args = [].slice.call(arguments, 0),
			tmp = JSON.stringify(args),
			cleanArgsString = tmp.substring(1, tmp.length - 1);

		if (outputArgs && _logger.isDebugEnabled()) {
			_logger.debug(fn.name + '(' + cleanArgsString + ')');
		}
		var result = fn.apply(null, arguments);
		if (outputResult && _logger.isDebugEnabled()) { _logger.debug(fn.name + '(...)  ==> ' + JSON.stringify(result, null, "\t")); }
		return result;
	}
}

module.exports = function(logger){
	_logger = logger;
	return loggable;
};