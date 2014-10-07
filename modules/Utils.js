function parseFrameworkVersion (versionString) {
	if (!versionString) {
		return {major : 0, minor : 0, bugfix : 0, beta : 0};
	}

	var ar = versionString.split('.');
	var major = parseInt(ar[0] || '0', 10);
	var minor = parseInt(ar[1] || '0', 10);
	var bugfix = 0;
	var beta = null;

	// detect beta version
	if (ar[2].indexOf('beta') > -1) {
		var parts = ar[2].split('-');
		bugfix = parseInt(parts[0] || '0', 10);
		beta = parseInt(parts[1].substr(4), 10);
	} else {
		bugfix = parseInt(ar[2] || '0', 10);
	}

	return {major : major, minor : minor, bugfix : bugfix, beta : beta};
}

function isMinimumRequiredVersion (versionString, requiredVersionString) {
	if (!versionString || !requiredVersionString) {
		return false;
	}

	var currentVersion = versionString;
	var requiredVersion = requiredVersionString;
	console.log('Comparing', currentVersion, "to", requiredVersion);

	if (typeof currentVersion === 'string') {
		try {
			currentVersion = parseFrameworkVersion(currentVersion);
		} catch (err) {
			return false;
		}
	}
	if (typeof requiredVersion === 'string') {
		try {
			requiredVersion = parseFrameworkVersion(requiredVersion);
		} catch (err) {
			return false;
		}
	}

	// Check if any of the semantic versions numbers are too old
	if (currentVersion.major < requiredVersion.major) {
		return false;
	}
	if (currentVersion.minor < requiredVersion.minor) {
		return false;
	}
	if (currentVersion.bugfix < requiredVersion.bugfix) {
		return false;
	}

	// If the current version is a beta, but the required
	// version is not, then the current version is too old
	if (currentVersion.beta && !requiredVersion.beta) {
		return false;
	}

	// If both are in beta
	if (currentVersion.beta && requiredVersion.beta) {
		// .. and the current version is too old
		if (currentVersion.beta < requiredVersion.beta) {
			return false;
		}
	}

	return true;
}

exports.parseFrameworkVersion = parseFrameworkVersion;
exports.isMinimumRequiredVersion = isMinimumRequiredVersion;