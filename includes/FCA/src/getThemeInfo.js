"use strict";

const utils = require("../utils");

const log = require("npmlog");

module.exports = function(defaultFuncs, api, ctx) {

	return function getTheme(themeID, callback) {

		let resolveFunc = function() {};

		let rejectFunc = function() {};

		const returnPromise = new Promise(function(resolve, reject) {

			resolveFunc = resolve;

			rejectFunc = reject;

		});

		if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {

			callback = function(err, data) {

				if (err) {

					return rejectFunc(err);

				}

				resolveFunc(data);

			};

		}

		if (!themeID) {

			const err = new Error("getTheme requires a themeID to be provided.");

			log.error("getTheme", err);

			return callback(err);

		}

		const form = {

			doc_id: "9734829906576883",

			variables: JSON.stringify({ "id": themeID }),

			fb_api_caller_class: "RelayModern",

			fb_api_req_friendly_name: "MWPThreadThemeProviderQuery"

		};

		defaultFuncs

			.post("https://www.facebook.com/api/graphql/", ctx.jar, form)

			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))

			.then(function(resData) {

				if (resData.errors) {

					throw resData.errors[0];

				}

				if (!resData.data || !resData.data.messenger_thread_theme) {

					throw new Error(`Theme with ID ${themeID} not found or API has changed.`);

				}

				const rawThemeData = resData.data.messenger_thread_theme;

				callback(null, rawThemeData);

			})

			.catch(function(err) {

				log.error("getTheme", err);

				return callback(err);

			});

		return returnPromise;

	};

};