"use strict";

/**
 * Clones a group to avoid writing to the source
 * @param {Object} group The group to clone
 * @public
 * @returns {Object} The copy of the group
 */
exports.cloneGroup = function (group) {
	var keys = Object.keys(group);
	var out = {};

	keys.forEach(function (key) {
		out[key] = group[key];
	});
	return out;
};

/**
 * Sorts a result descending based on sortIndex or alphabetical on title
 * @param {Array} result The array of elements to sort
 * @public
 * @returns {Array} The sorted array
 */
exports.sortResult = function (result) {
	return result.sort(function (a, b) {
		if (parseInt(a.sortIndex, 10) === parseInt(b.sortIndex, 10)) {
			var as = a.title.toLowerCase();
			var bs = b.title.toLowerCase();
			if (as < bs) {
				return -1;
			}
			if (bs < as) {
				return 1;
			}
			return 0;
		}
		return b.sortIndex - a.sortIndex;
	});
};
