"use strict";

var chainDataModel = require('./model');
var titleSearch = require('./titleSearch');
var dataUtils = require('./utils/dataUtil');

var log4js = require('log4js');
var logger = log4js.getLogger('/productSearch/searchUtil');

if(process.env.NODE_ENV === 'production') {
	logger.setLevel(log4js.levels.OFF);
} else {
	logger.setLevel(log4js.levels.DEBUG);
}

var createEmptyOutput = function () {
	return [
		{
			title              : "Generic category",
			shoppinglistgroups : [
				{
					groupid   : 0,
					synonyms  : [],
					title     : "Generic group",
					products  : [],
					sortIndex : 0
				}
			]
		}

	];
};

// Loads the data
exports.loadData = function () {
	chainDataModel.loadData();
};

exports.updateData = function() {
	chainDataModel.updateStorageData();
};

exports.getProductById = function(productId, chainid) {
	var collection = chainDataModel.getDataCollectionByChainId(chainid);

	var prods = collection.productstore;
	var i = prods.length;

	while(i--) {
		if(parseInt(prods[i].id, 10) === parseInt(productId, 10)) {
			var out = createEmptyOutput();
			out[0].shoppinglistgroups[0].products.push(prods[i]);
			return out;
		}
	}
	return false;
};

/**
 * Returns an array of all the categories with its sub groups
 * @param {Number} chainid The id of the chain
 * @returns {Array<Category> | boolean} An array containing all categories
 */
exports.getAllCategories = function(chainid) {
	var collection = chainDataModel.getDataCollectionByChainId(chainid);
	return collection.categoriesstore;
};

/**
 * Returns all the products for the supplied group
 * @param {Number | String} query The is of the group to find
 * @param {Number} chainid The id of the chain
 * @returns {Array<Category> | boolean} An array containing a generic category with the groups and the products
 */
exports.getProductsForGroup = function (query, chainid) {
	var collection = chainDataModel.getDataCollectionByChainId(chainid);

	if (!collection) {
		return false;
	}

	if (collection.productstore.length < 1) {
		return createEmptyOutput();
	}

	var col = {
		title              : "Generic category",
		shoppinglistgroups : []
	};

	var groupID = parseInt(query, 10);
	var group = chainDataModel.fetchGroupById(query, collection);
	if (!group.groupid) {
		return col;
	}
	group.products = [];

	collection.productstore.forEach(function (product) {
		if (product.groupid === groupID) {
			group.products.push(product);
		}
	});

	col.shoppinglistgroups.push(group);
	return [col];
};

/**
 * Searches for groups containing with the title supplied in the query
 * @param {String} query The string to search for
 * @param {Number} chainid The id of the chain
 * @param {Object} [config] Configuration
 * @param {Boolean} [config.includePartialMatches=false] Should the search include partial matches
 * @param {Number} [config.maxNumberOfGroups=10] The max number of groups within each category to output
 * @returns {Array<Categories> | boolean}
 */
exports.getGroupsByTitle = function (query, chainid, config) {
	// get the correct data for this chain
	var collection = chainDataModel.getDataCollectionByChainId(chainid);

	if (!collection) {
		return false;
	}

	// Set config
	var includePartialMatches = config && config.includePartialMatches || false;
	var maxNumberOfGroups = config && parseInt(config.maxNumberOfGroups || 10, 10);

	// Kick off a title search for groups
	var res = titleSearch.findGroupsContainingTitle(query, collection, false, includePartialMatches);

	// return the max number of groups set in config
	return [
		{title : "Generic category", shoppinglistgroups : res.slice(0, maxNumberOfGroups)}
	];
};

/**
 * Searches for products containing the title supplied in the query
 * @param {String} query The product title to search for
 * @param {Number} chainid The id of the chain
 * @param {Object} [config] Configuration
 * @param {Boolean} [config.includePartialMatches=false] Should the search include partial matches
 * @param {Boolean} [config.groupProductsElements=false] Should the products be grouped into product groups
 * @param {Boolean} [config.categorizeGroups=false] Should the product groups be returned categorized
 * @param {Boolean} [config.combineSimilarProducts=false] Should products with the same title be combined
 * @param {Number} [config.maxNumberOfGroups=10] The max number of groups within each category to output
 * @param {Number} [config.maxNumberOfProducts=10] The max number of products within each group to output
 * @returns {Array<Categories> | boolean}
 */
exports.getProductsByTitle = function (query, chainid, config) {
	// get the correct data for this chain
	var collection = chainDataModel.getDataCollectionByChainId(chainid);

	if (!collection) {
		return false;
	}

	// If there are no products (major fuckup)
	if (collection.productstore.length < 1) {
		// return an empty output
		return createEmptyOutput();
	}

	// Set config
	var includePartialMatches = config && config.includePartialMatches || false;
	var shouldGroupProducts = config && config.groupProductsElements || false;
	var shouldCategorizeGroups = config && config.categorizeGroups || false;
	var shouldCombineSimilarProducts = config && config.combineSimilarProducts;
	var maxNumberOfGroups = config && parseInt(config.maxNumberOfGroups || 10, 10);
	var maxNumberOfProducts = config && parseInt(config.maxNumberOfProducts || 10, 10);

	// Find all products matching the query and the set config
	var result = titleSearch.findProductsContainingTitle(query, collection, includePartialMatches, shouldCombineSimilarProducts);

	// If the output should NOT be grouped
	if (!shouldGroupProducts) {
		// ..return a generic category with a generic group containing the result products
		return [
			{
				title              : "Generic category",
				shoppinglistgroups : [
					{
						groupid   : 0,
						synonyms  : [],
						title     : "Generic group",
						products  : result.slice(0, maxNumberOfProducts),
						sortIndex : 0
					}
				]
			}
		];
	}

	// At this stage the products should be placed inside of the
	// group it belongs to and the group inside the category it belongs to

	// First grab all the group id's from the resulting
	// product search. This is so we can later quickly identify
	// if we are at the correct group. This is also used to maintain
	// the sort order since this array is sorted by relevance already
	var groupIds = [];
	result.forEach(function (product) {
		if (groupIds.indexOf(product.groupid) < 0) {
			groupIds.push(product.groupid);
		}
	});

	var i, j, p, currentGroupID, categories, groups, generatedCategory, generatedGroup, output, maxGroupIndex, genCategory;
	output = [];

	// This is used when a list of non categorized groups is requested
	genCategory = {
		title              : "Generic category",
		shoppinglistgroups : []
	};

	// For each category
	categories = collection.categoriesstore;
	i = categories.length;
	while (i--) {
		// ..set up an empty category
		generatedCategory = {
			title : categories[i].title,
			id: categories[i].id,
			sortIndex: categories[i].sortIndex,
			shoppinglistgroups : []
		};
		groups = categories[i].shoppinglistgroups;
		j = groups.length;
		// reset the max group index
		// this is used to determine the sorting of the categories
		maxGroupIndex = 0;
		// for each group
		while (j--) {
			// get the current group id
			currentGroupID = parseInt(groups[j].groupid, 10);
			// if the current group id is found in the search result
			if (groupIds.indexOf(currentGroupID) > -1) {
				// clone the group and set it up to receive products
				generatedGroup = dataUtils.cloneGroup(groups[j]);
				generatedGroup.products = [];
				// the sort index is set based on the order from the product search
				generatedGroup.sortIndex = 100 - (groupIds.indexOf(parseInt(groups[j].groupid, 10)));
				// remember the max group value to use for the parent category
				maxGroupIndex = Math.max(maxGroupIndex, generatedGroup.sortIndex);
				// insert the products from the result matching this group
				p = result.length;
				while (p--) {
					if (parseInt(result[p].groupid, 10) === currentGroupID) {
						// unshift them from the top of the stack to maintain
						// the original sort order
						generatedGroup.products.unshift(result[p]);
					}
				}
				// limit to the max number of products pr group
				generatedGroup.products = generatedGroup.products.slice(0, maxNumberOfProducts);
				// remember the group
				generatedCategory.shoppinglistgroups.push(generatedGroup);
			}
		}
		// If the category has any groups
		if (generatedCategory.shoppinglistgroups.length > 0) {
			// Add this set of groups to the generic category in case a flat list is requested
			genCategory.shoppinglistgroups = genCategory.shoppinglistgroups.concat(generatedCategory.shoppinglistgroups);

			// Sort the groups based on the sort order defined in the product search
			generatedCategory.shoppinglistgroups = dataUtils.sortResult(generatedCategory.shoppinglistgroups);
			// limit groups to the max number of groups pr category
			generatedCategory.shoppinglistgroups = generatedCategory.shoppinglistgroups.slice(0, maxNumberOfGroups);
			// set the sort index of the category based on the containing groups
			generatedCategory.sortIndex = maxGroupIndex;
			// remember the category
			output.push(generatedCategory);
		}
	}

	// If the groups should be categorized
	if (shouldCategorizeGroups) {
		// .. sort the categories and save the result
		output = dataUtils.sortResult(output);
	} else {
		// .. use the flat group array, sort it and save the result
		genCategory.shoppinglistgroups = dataUtils.sortResult(genCategory.shoppinglistgroups).slice(0, maxNumberOfGroups);
		output = [genCategory];
	}

	// return the data to be output
	return output;
};

/**
 * Searches for groups and products containing the title supplied in the query.
 * Note that a group will not be returned unless it too matches the query, even if the grouped option is on
 * @param {String} query The product title to search for
 * @param {Number} chainid The id of the chain
 * @param {Object} [config] Configuration
 * @param {Boolean} [config.includePartialMatches=false] Should the search include partial matches
 * @param {Boolean} [config.groupProductsElements=false] Should the products be grouped into product groups
 * @param {Boolean} [config.categorizeGroups=false] Should the product groups be returned categorized
 * @param {Boolean} [config.combineSimilarProducts=false] Should products with the same title be combined
 * @param {Number} [config.maxNumberOfGroups=10] The max number of groups within each category to output
 * @param {Number} [config.maxNumberOfProducts=10] The max number of products within each group to output
 * @returns {Array<Categories> | boolean}
 */
exports.combinedSearch = function (query, chainid, config) {
	var collection = chainDataModel.getDataCollectionByChainId(chainid);

	if (!collection) {
		return false;
	}

	// This operation requires both data sources
	if (collection.productstore.length < 1) {
		return createEmptyOutput();
	}

	// Configuration
	var includePartialMatches = config && config.includePartialMatches || false;
	var shouldCategorizeGroups = config && config.categorizeGroups || false;
	var maxNumberOfGroups = config && parseInt(config.maxNumberOfGroups || 10, 10);
	var maxNumberOfProducts = config && parseInt(config.maxNumberOfProducts || 10, 10);
	var shouldCombineSimilarProducts = config && config.combineSimilarProducts;

	// Get all groups matching the query
	var res_groups = titleSearch.findGroupsContainingTitle(query, collection, false, includePartialMatches);
	// Get all products matching the query
	var res_products = titleSearch.findProductsContainingTitle(query, collection, includePartialMatches, shouldCombineSimilarProducts);

	// Create an "otherGroup" to hold matched products which does not have a corresponding matching group
	var otherGroup = {groupid : 0, synonyms : [], title : "Other", products : [], sortIndex : 0};

	// Now we organize the results
	// This includes putting the matching products into the matched groups
	// Note that not all matched products will have a matching group since
	// both the product name and the group name will need to match the query
	// In the case of "dangling" products, these are put into an "other" group
	var prod, didFindGroup;
	// For each of the matching products
	while (res_products.length > 0) {
		// shift the first one (highest weight) out of the result array
		prod = res_products.shift();
		// reset the var which remembers if this product has a matching group
		didFindGroup = false;

		var group, i, len = res_groups.length;
		// Now loop trough the groups
		for (i = 0; i < len; i++) {
			// The current group
			group = res_groups[i];
			// If the id of the current group matches the groupid of the current product
			if (parseInt(group.groupid, 10) === parseInt(prod.groupid, 10)) {
				// set a flag that this product belongs in a group
				// which was also a match for the query
				didFindGroup = true;
				// If this is the first product added to this group
				// we need to create the product array
				if (!group.products) {
					group.products = [];
				}
				// If the maximum number of allowed products pr group has not been exceeded
				if (group.products.length < maxNumberOfProducts) {
					// .. push the product on to the correct group
					group.products.push(prod);
				}
				// No need to look at the other groups at this point,
				// so stop looping and go to the next product
				break;
			}
		}

		// If the current product does not belong in any of the groups
		// from the search result and the other group hasn't exceeded it's
		// maximum allowed number of products
		if (!didFindGroup && otherGroup.products.length < maxNumberOfProducts) {
			// .. add this "dangler" to the other group
			otherGroup.products.push(prod);
		}
	}

	// If the other group has any products
	if (otherGroup.products.length > 0) {
		// .. append it to the result group
		res_groups = res_groups.concat(otherGroup);
	}

	// Return the result grouped but not categorized
	// Strip away any groups exceeding the max number of allowed groups
	if (!shouldCategorizeGroups) {
		return [
			{title : "Generic category", shoppinglistgroups : res_groups.slice(0, maxNumberOfGroups)}
		];
	}

	// If we get here the the above result should also be categorized
	// This includes finding matching categories for all the groups
	// in the result above. Most groups does belong in a category, however
	// the "other groups" does not and will hence need an "Other" category

	// Define a function to get the correct category given a the id of a group
	function getCategoryForGroup (groupID) {
		var categories, groups, i, j, output, inputID;
		// Make sure that the input id is a number
		inputID = parseInt(groupID, 10);
		// Grab all the categories
		categories = collection.categoriesstore;
		i = categories.length;
		// Loop trough the categories
		while (i--) {
			// Alle the groups for this category
			groups = categories[i].shoppinglistgroups;
			j = groups.length;
			// Loop trough the groups in this category
			while (j--) {
				// If the current group id matches the input id
				if (parseInt(groups[j].groupid, 10) === inputID) {
					// Create an output category object
					output = {
						title : categories[i].title,
						id: categories[i].id,
						sortIndex: categories[i].sortIndex,
						shoppinglistgroups : []
					};
					// Add an array of group ids to the output category
					// to facilitate later checking for group existence
					output.groupIDs = groups.map(function (group) {
						return parseInt(group.groupid, 10);
					});
					// Return the category
					return output;
				}
			}
		}
		// No category containing that group exists
		// This is true for the "other group" case
		return false;
	}

	// Define some vars
	// currentGroup is the first group for each pass of the algorithm
	// currentCategory is the category containing a group matching the currentGroup
	// outputCategories is the array of categories which will be the result
	// uncategorizedGroups contains any groups without categories (again..the "other" group)
	// otherGroups is a buffer variable used to temporarily contain the groups in the same category
	// .. as the currentGroup
	var currentGroup, currentCategory, i, outputCategories = [], uncategorizedGroups = [], otherGroups = [];

	while (res_groups.length > 0) {
		// Shift the top group off the groups array
		currentGroup = res_groups.shift();
		// Find the category containing the current group
		currentCategory = getCategoryForGroup(currentGroup.groupid);
		if (currentCategory) {
			currentCategory.shoppinglistgroups.push(currentGroup);
			// get the rest of the groups for this category
			i = res_groups.length;
			// Reset the other groups temp var
			otherGroups = [];
			// now back up trough all the remaining groups
			while (i--) {
				// If a matching group is found
				if (currentCategory.groupIDs.indexOf(parseInt(res_groups[i].groupid, 10)) > -1) {
					// Slice it off the groups array and put it on the top of the temp array
					// bottom -> top = to maintain sort order
					otherGroups.unshift(res_groups.splice(i, 1)[0]);
				}
			}

			// If any related groups was found
			if (otherGroups.length > 0) {
				// Append them to the main groups array for the current category
				currentCategory.shoppinglistgroups = currentCategory.shoppinglistgroups.concat(otherGroups);
				// Then strip away any groups exceeding the max number of groups allowed
				currentCategory.shoppinglistgroups = currentCategory.shoppinglistgroups.slice(0, maxNumberOfGroups);
			}

			// We are done with this category, now push it to the output var
			outputCategories.push(currentCategory);

		} else { // a matching category was not found
			// .. a matching category wasn't found, so this group
			// is places in the uncategorizedGroups array for now
			uncategorizedGroups.push(currentGroup);
		}
	}

	// If there are any non categorized groups
	if (uncategorizedGroups.length > 0) {
		// .. create an "Other" category and and the «uncategorizedGroups» to it
		// .. then push it on to the bottom of the output categories array
		outputCategories.push({title : "Other", shoppinglistgroups : uncategorizedGroups.slice(0, maxNumberOfGroups)});
	}

	// Return the categorized result
	return outputCategories;
};

