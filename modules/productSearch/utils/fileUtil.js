"use strict";

var fs = require('fs');

exports.getFileSize = function (filename, options) {
	var stats = fs.statSync(filename);
	var bytes = stats["size"];

	if (!options) {
		// Return size in bytes
		return bytes;
	}

	if (options.unit === 'KB') {
		// return size in KB
		return bytes / 1000.0;
	} else {
		// return size in MB
		return bytes / 1000000.0;
	}
};
