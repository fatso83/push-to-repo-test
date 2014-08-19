"use strict";

// File system
var fs = require('fs');
// Request module
var request = require('request');

// Azure storage
var azure = require('azure-storage');
// Azure storage keys
process.env.AZURE_STORAGE_ACCOUNT = "ngmockupstorage";
process.env.AZURE_STORAGE_ACCESS_KEY = "3aUm5uHBpx54TNoK41DyZ6+dyGLiW+KprpPQecF7dVoD+cBXXMLLkMpNo9pR72wjeOf6QE1f39+aZ1pP/ADvqA==";


// Logging
var log4js = require('log4js');
var logger = log4js.getLogger('/productSearch/model');

if(process.env.NODE_ENV === 'production') {
	logger.setLevel(log4js.levels.OFF);
} else {
	logger.setLevel(log4js.levels.DEBUG);
}

// Import external modules
var fileUtil = require('./utils/fileUtil');
var dataUtils = require('./utils/dataUtil');

// Setup Azure storage
var blobContainer = 'productsearchdatabase';
var blobSvc = azure.createBlobService();


/**
 * A structure which holds file names and parsed data in memory for each chain
 * @type {Object}
 * @private
 */
var collections = {
	kiwi : {
		productstore       : [],
		categoriesstore    : [],
		productfilename    : "kiwi_products",
		categoriesfilename : "kiwi_categories",
		categoryService    : "https://service-dk.norgesgruppen.no/api/data/shoppinglistgroup/1100",
		productService     : "https://preprod.service-dk.norgesgruppen.no/api/data/products/1100"
	},
	meny : {
		productstore       : [],
		categoriesstore    : [],
		productfilename    : "meny_products",
		categoriesfilename : "meny_categories",
		categoryService    : "https://service-dk.norgesgruppen.no/api/data/shoppinglistgroup/1300",
		productService     : "https://preprod.service-dk.norgesgruppen.no/api/data/products/1300"
	},
	spar : {
		productstore       : [],
		categoriesstore    : [],
		productfilename    : "spar_products",
		categoriesfilename : "spar_categories",
		categoryService    : "https://service-dk.norgesgruppen.no/api/data/shoppinglistgroup/1210",
		productService     : "https://preprod.service-dk.norgesgruppen.no/api/data/products/1210"
	}
};

/**
 * Appends category names to each individual product
 * @param {Object} collection The chain specific collection to work on
 */
var appendCategoriesToProductsForCollection = function (collection) {
	var i = 0, j = 0, groups;
	// Grab all the categories
	var categories = collection.categoriesstore;
	// For all products
	collection.productstore.forEach(function (product) {

		// Set a default category name for the product
		product.categoryname = "Unknown";

		i = categories.length;
		// For each category
		while (i--) {
			groups = categories[i].shoppinglistgroups;
			j = groups.length;
			// For each group in the current category
			while (j--) {
				// If the group id matches the current products group id
				if (groups[j].groupid === product.groupid) {
					// .. save the category title into the product categoryName property
					product.categoryname = categories[i].title;
				}
			}
		}
	});
};

/**
 * A helper function which parses categories
 * @param {Array} categories The categories to parse
 * @private
 * @returns {Array} Parsed categories
 */
var parseCategories = function (categories) {
	var parsed = [];

	// Defines a recursive function to walk and flatten
	// the groups with a category
	// Also redefines the properties for the categories
	// to be more compatible with other similar structures
	function walkGroups (item, target) {
		if (item.shoppinglistgroups.length > 0) {
			var parsedItem;
			item.shoppinglistgroups.forEach(function (group) {
				parsedItem = {};
				parsedItem.groupid = group.number || 0;
				parsedItem.title = group.name || "";
				parsedItem.synonyms = group.synonyms || [];
				target.push(parsedItem);
				if (group.shoppinglistgroups) {
					walkGroups(group, target);
				}
			});
		}
	}

	// For each category
	categories.forEach(function (category) {
		var item = {};
		// .. map name to title for compatibility with
		// groups and products
		item.title = category.name || "";
		item.id = category.number || 0;
		item.sortIndex = category.sort || 0;

		// for each group in the category
		if (category.shoppinglistgroups) {
			// parse the groups
			item.shoppinglistgroups = [];
			walkGroups(category, item.shoppinglistgroups);

			// Leave out empty categories
			if (item.shoppinglistgroups.length > 0) {
				parsed.push(item);
			}
		}
	});
	return parsed;
};

/**
 * A helper function which reads the file names for
 * each chain and loads the products from the files and into memory
 * storing it the the corresponding «collections.productstore» property
 * @private
 */
var loadProducts = function () {
	// Copy the keys to avoid collisions
	// when loading asynchronously
	var keys = Object.keys(collections);
	// For each key (chain)
	keys.forEach(function (key) {
		var item = collections[key];
		// read the products file
		blobSvc.getBlobToText(blobContainer, item.productfilename, function(error, result, res) {
			if (error) {
				logger.error('!! Could not load products', error);
			} else {
				// parse it
				var products = JSON.parse(result);
				item.productstore = [];

				products.forEach(function (product) {
					if (product.isactive && (product.subtitle && product.subtitle.toLowerCase().indexOf('utgår') < 0)) {
						item.productstore.push(product);
					}
				});

				appendCategoriesToProductsForCollection(item);

				logger.info("Loaded products for ", key, item.productstore.length, "products");
			}
		});
	});
};

/**
 * A helper function which reads the file names for
 * each chain and loads the categories and groups from the files and into memory
 * storing it the the corresponding «collections.categoriesstore» property
 * @param {Function} onComplete Complete handler
 * @private
 */
var loadCategories = function (onComplete) {
	// Copy the keys to avoid collisions
	// when loading asynchronously
	var keys = Object.keys(collections);
	// For each key (chain)
	keys.forEach(function (key, index) {
		var item = collections[key];
		// read the categories
		blobSvc.getBlobToText(blobContainer, item.categoriesfilename, function(error, result, res) {
			if (error) {
				logger.error('!! Could not load categories', error);
			} else {
				// parse it and make it usable
				item.categoriesstore = parseCategories(JSON.parse(result));
				logger.info("Loaded categories for ", key, item.categoriesstore.length, "categories");
			}

			// When all categories has been loaded or failed
			if (index + 1 >= keys.length) {
				// Call the complete callback
				onComplete();
			}
		});
	});
};

/**
 * Returns the correct data for the given chain id
 * @param {Number} chainid The id of the chain to get data for
 * @public
 * @returns {Object} The correct object from the «collections»
 */
exports.getDataCollectionByChainId = function (chainid) {
	var id = parseInt(chainid);
	if (id === 1100) {
		return collections.kiwi;
	} else if (id === 1300) {
		return collections.meny;
	} else if(id === 1210) {
		return collections.spar;
	}
	return false;
};

/**
 * Finds and returns a copy of a group based on the input group id
 * @param {String | Number} groupID The id of the group to find
 * @param collection Which collection to look in (chain specific data)
 * @public
 * @returns {Object} A copy of the found group or an empty object
 */
exports.fetchGroupById = function (groupID, collection) {
	var categories = collection.categoriesstore;
	var j, i = categories.length;
	var category, group;
	while (i--) {
		category = categories[i];
		j = category.shoppinglistgroups.length;
		while (j--) {
			group = category.shoppinglistgroups[j];
			if (parseInt(group.groupid, 10) === parseInt(groupID, 10)) {
				return dataUtils.cloneGroup(group);
			}
		}
	}
	return {};
};

/**
 * Starts the loading
 * @public
 */
exports.loadData = function () {
	blobSvc.createContainerIfNotExists(blobContainer, function(error, result, response){
		if(!error){
			logger.info('Blob storage ready');
			logger.info('<--- Loading data --->');
			loadDataFromStorage();
		}
	});
};

exports.updateStorageData = function () {
	// Try to fetch data from NGT
	var headers = {
		"Authorization" : "Basic J8ed0(tyAop206%JHP",
		"Content-Type"  : "application/json"
	};

	logger.info('<--- Updating data from NGT --->');
	fetchCategories(headers, function () {
		//Got all categories
		fetchProducts(headers, function () {
			//Got all products - load data first categories
			logger.info('<--- Re-loading data --->');
			loadDataFromStorage();
		});
	});
};

function loadDataFromStorage() {
	loadCategories(function () {
		// Load products
		loadProducts();
	});
}

function fetchCategories (headers, onComplete) {
	// Categories
	var count = 0;
	var keys = Object.keys(collections);

	keys.forEach(function (key, index) {
		var item = collections[key];
		var options = {
			uri     : item.categoryService,
			headers : headers,
			method  : 'GET'
		};

		makeRequest(options, function (res) {
			if (res) {
				logger.info('Writing categories');
				blobSvc.createBlockBlobFromText(blobContainer, item.categoriesfilename, res, function(error, result, res) {
					logger.info('Wrote categories');
					count += 1;
					if (count >= keys.length) {
						onComplete();
					}
				});
			} else {
				count += 1;
				if (count >= keys.length) {
					onComplete();
				}
			}
		});
	});
}

function fetchProducts (headers, onComplete) {
	// Products
	var count = 0;
	var keys = Object.keys(collections);

	keys.forEach(function (key, index) {
		var item = collections[key];
		var options = {
			uri     : item.productService,
			headers : headers,
			method  : 'GET'
		};

		makeRequest(options, function (res) {
			if (res) {
				logger.info('Writing products');
				blobSvc.createBlockBlobFromText(blobContainer, item.productfilename, res, function(error, result, res) {
					logger.info('Wrote products');
					count += 1;
					if (count >= keys.length) {
						onComplete();
					}
				});
			} else {
				count += 1;
				if (count >= keys.length) {
					onComplete();
				}
			}
		});
	});
}

function makeRequest (options, callback) {
	logger.debug('Making a request to', options.uri);
	var t = new Date().getTime();
	request(options, function (error, response, body) {
		logger.debug('Request done in ', (new Date().getTime() - t), 'ms');
		if (error) {
			callback(false);
		} else if (response.statusCode === 200) {
			callback(body);
		} else {
			callback(false);
		}
	});
}

