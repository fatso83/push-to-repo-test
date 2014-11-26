"use strict";

var dataUtils = require('./utils/dataUtil');

var sortWeight = 100;

/**
 * Searches a search string for a word and weights the result
 * @param {String} searchString The string to search in
 * @param {String} word The needle to look for
 * @param {Boolean} includePartialMatches If true the «word» can be a part a word in the search string
 * @returns {{} | Boolean} Returns either a result object or false if no match at all
 */
var stringContainsWord = function (searchString, word, includePartialMatches) {
	// Set the default weight
	var weight = sortWeight;
	// Normalize the search string
	var normalizedSearchString = searchString.toLowerCase();
	// Normalize the search needle (word)
	var needle = word.toLowerCase();
	// Split any words in the search string into an array
	var words = normalizedSearchString.split(" ");

	// Search for a complete match for the word
	var res = words.indexOf(needle);
	// If a complete word match is found
	if (res > -1) {
		// the index (weight) is calculated in the following way
		// # the default weight minus the position of the match in the search string
		// .. if the matched word is closer to the start of the string, less is subtracted..
		// minus the length of the search string itself
		// .. the longer the word, the less close it is to the needle..
		return {index : (weight - res - normalizedSearchString.length)};
	}

	// Search for a partial match of the word
	if (includePartialMatches) {
		// Do a string search including parts of words
		var p_res = normalizedSearchString.indexOf(needle);
		if (p_res > -1) {
			// Partial matches are rates half as important as exact matches
			// Besides that the weight calculation is the same
			return {index : ((weight * 0.5) - p_res - normalizedSearchString.length)};
		}
	}

	return false;
};

/**
 * Searches for groups containing the given title
 * @param {String} groupTitle The title to search for (the needle)
 * @param {Object} collection The chain collection to search in
 * @param {Boolean} exactMatch If true an exact match is required
 * @param {Boolean} includePartialMatches If true the «needle» can be a part a word in the group title
 * @returns {Array}
 */
var findGroupsByTitle = function (groupTitle, collection, exactMatch, includePartialMatches) {
	var matches = [];
	// Grab the categories array for this collection
	var categories = collection.categoriesstore;
	var j, i = categories.length;
	// Loop trough the categories
	while (i--) {
		// Grab the groups for this category
		var groups = categories[i].shoppinglistgroups;
		j = groups.length;
		// Iterate trough the groups
		while (j--) {
			// Use the string search to search for the needle in the current group title
			var res = stringContainsWord(groups[j].title, groupTitle, includePartialMatches);
			// If a match is found
			if (res) {
				var group;
				// .. and it is not an exact match
				if (!exactMatch) {
					// Grab a clone of the current group
					group = dataUtils.cloneGroup(groups[j]);
				} else if (groups[j].title.toLowerCase() === groupTitle.toLowerCase()) {
					// Exact match required and tested for
					// If the title of the group matches the needle exactly
					group = dataUtils.cloneGroup(groups[j]);
				}
				// If a group was found
				if (group) {
					// Set its weight
					group.sortIndex = res.index;
					// Remember it
					matches.push(group);
				}
			}
		}
	}
	// Return the sorted result
	return dataUtils.sortResult(matches);
};

/**
 * Searches for products matching the query string
 * @param {String} query The search needle
 * @param {Object} collection The chain specific collection to use as a basis for the search
 * @param {Boolean} includePartialMatches If true the «needle» can be a part a word in the product title
 * @param {Boolean} shouldCombineSimilarProducts If true products with the same title will be combined under the first product with that title
 * @returns {Array}
 */
exports.findProductsContainingTitle = function (query, collection, includePartialMatches, shouldCombineSimilarProducts) {
	// Setup the output array
	var output = [];
	// Grab the correct data set
	var productCollection = collection.productstore;
	// Find groups which matches the needle exactly
	// Finds groups with the exact same name as the needle
	var matchingGroups = findGroupsByTitle(query, collection, true, false);

	// Verify that the product collection has data
	if (productCollection && productCollection.length > 1) {
		// For each product
		productCollection.forEach(function (product) {
			// search the current product
			var res = stringContainsWord(product.title, query, includePartialMatches);

			// If a match was found
			if (res) {
				// Check to see if this match has a corresponding group match
				if ((matchingGroups.length > 0) && (parseInt(matchingGroups[0].groupid) === parseInt(product.groupid))) {
					// if so, increase the sort weight
					res.index += sortWeight;
				}
				// if not, use the calculated sort weight
				product.sortIndex = res.index;
				// Remember the product
				output.push(product);
			}
		});
	}
	// If similar (same title) products should be joined
	if (shouldCombineSimilarProducts) {
		// Temp output holder
		var combinedOutput = [];
		// For each of the products found above
		while (output.length > 0) {
			// Grab the top most products
			var product = dataUtils.cloneGroup(output.shift());
			// Create a similar array for this product
			product.similar = [];
			// Remember the product
			combinedOutput.push(product);

			// Now look for products similar to the current one
			var prod, index = output.length;
			while (index--) {
				// Grab a product
				prod = output[index];
				// If the title of this product is the same as the current one
				if (product.title.toLowerCase().trim() === prod.title.toLowerCase().trim()) {
					// Add the similar product to the current products similar array
					product.similar.push(prod);
					// Remove the similar product from the original array
					output.splice(index, 1);
				}
			}
		}
		// Return the combined products
		return dataUtils.sortResult(combinedOutput);
	}
	// return the non combined products
	return dataUtils.sortResult(output);
};

/**
 * Externally exposed method to search for groups containing title
 * @param {String} groupTitle The title to search for (the needle)
 * @param {Object} collection The chain collection to search in
 * @param {Boolean} exactMatch If true an exact match is required
 * @param {Boolean} includePartialMatches If true the «needle» can be a part a word in the group title
 * @returns {Array}
 */
exports.findGroupsContainingTitle = function (groupTitle, collection, exactMatch, includePartialMatches) {
	return findGroupsByTitle(groupTitle, collection, exactMatch, includePartialMatches);
};
