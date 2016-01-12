﻿/// <reference path="./typings/tsd.d.ts" />

import express = require('express');
import mongoose = require('mongoose');
import bodyParser = require('body-parser');
import web3config = require('./lib/web3config');
import assert = require('assert');

var web3 = require("web3");

import path = require('path');

import fs = require('fs');

import indexRoute = require('./routes/index');
import oauthController = require('./controllers/oauthController');
import configurationService = require('./services/configurationService');

var config = new configurationService.ConfigurationService().getConfiguration();

console.log("My configuration:");
console.log(config);

var HTTP_PORT = config.server.httpPort;
var HTTPS_PORT = config.server.httpsPort;
var baseUrl = config.server.baseUrl + ":" + HTTPS_PORT;


/************** OAuth controllers ****************/

var upholdConfig = {
    baseUrl: baseUrl,
    basePath: "/api/auth/uphold",
    clientID: config.uphold.app.clientID,
    clientSecret: config.uphold.app.clientSecret,

    scope: "cards:read,cards:write,transactions:read,transactions:write,user:read",
    // Uphold uses a different domain for the authorization URL. simple-oauth2 doesn't support that.
    // The "site" parameter also may not be empty.
    // As a workaround, we use the greatest common denominator of the two URLs: "https://".
    oauthSite: "https://",
    oauthTokenPath: 'api.uphold.com/oauth2/token',
    oauthAuthorizationPath: 'uphold.com/authorize/' + config.uphold.app.clientID,
    adminUserId: config.uphold.vaultAccount.userName
}

var upholdOauthController = new oauthController.OAuthController(upholdConfig);
import bitReserveService = require('./services/upholdService');
import serviceFactory = require('./services/serviceFactory');

/**
 * Create a new Uphold service and get user info from it.
 */
function getBitReserveUserInfo(token: string, callback) {
    var brs = serviceFactory.createUpholdService(token);
    brs.getUser(callback);
}

upholdOauthController.setGetUserInfoFunction(getBitReserveUserInfo);

import stubOauthController = require('./controllers/stubOauthController');

import stubBitReserveService = require('./services/stubUpholdService');

if (config.useStubs) {
    // Create a stub controller from the real controller.
    var stubController = new stubOauthController.StubOAuthController(upholdOauthController);

    // Replace the handlers of the real controller by the stubs.
    upholdOauthController.auth = stubController.auth;
    upholdOauthController.callback = stubController.callback;
}

/******** Ethereum / web3 setup *************/

// TODO: make the server not crash badly when the eth connection fails.
var web3plus = web3config.createWeb3(config.ethereum.jsonRpcUrl);

/******** Express and route setup ***********/

var app = express();
app.use(bodyParser.json());

// Logging
var morgan = require('morgan');
app.use(morgan('dev'));

// Initialize database connection.

// The MongoDB connection is currently only created at the node app startup. It could
// disconnect for some reason.
// TODO: make this more stable, in a way that doesn't require a specific call to Mongoose
// before every request (because that will be forgotten).
var db = mongoose.connect(config.database.url);

// Client folder containing the Angular SPA, serve as static assets
var clientDir = path.join(__dirname, 'client');
app.use(express.static(clientDir));

app.get(upholdOauthController.getAuthRoute(), upholdOauthController.auth);
app.post(upholdOauthController.getCallbackApiRoute(), upholdOauthController.callback);
app.get(upholdOauthController.getCallbackPublicRoute(), indexRoute.index);

// TODO refactor all '/api/...' calls to a separate ExpressAPIRouter.
var apiRouter = express.Router();

import upholdController = require('./controllers/upholdController');
import proposalController = require('./controllers/proposalController');
import migrationController = require('./controllers/migrationController');
import SellerController from "./controllers/sellerController";
var uc = new upholdController.UpholdController();
var pc = new proposalController.ProposalController();
var mc = new migrationController.MigrationController();
var sc = new SellerController();

// Uphold API wrapper
apiRouter.route("/uphold/me/cards")
    .get(uc.getCards);
apiRouter.route("/uphold/me/cards/withBalance")
    .get(uc.getCardsWithBalance);

// Proposals
apiRouter.route("/proposal")
    .get(pc.getAll);

// Migrations
apiRouter.route("/migration/update")
    .post(mc.update);
apiRouter.route("/migration/test/seed")
    .post(mc.seedTestData);

// Sellers
apiRouter.route("/seller/signup")
    .post(function (req, res) {
    // TODO BW Refactor, replace function with 'save' as now called in the function body.
        return sc.save(req, res);
    });
apiRouter.route("/seller")
    .get(sc.get);

// Catch not existing api calls.
apiRouter.route("*")
    .all(function(req, res) {
        res.status(404).send(`no API method at '${req.url}'`);
    });

app.use('/api', apiRouter);
// BW END TODO

// All routes which are directly accessible (i.e. not only from within the Angular SPA).
// All open index.html, where Angular handles further routing to the right controller/ view.
// All remaining routes - not matched by previous server-side routes are matched with this wildcard handler and forwarded to Angular.
app.get("*", indexRoute.index);

/*********************** HTTP server setup ********************/
var httpsOptions;

try {
    console.log("Trying custom certificate.");

    httpsOptions = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };

    console.log("Using custom certificate.");

    try {
        console.log("Trying to read intermediate certificate.");
        var chainLines = fs.readFileSync('intermediate.pem', 'utf-8').split("\n");
        var cert = [];
        var ca = [];
        chainLines.forEach(function (line) {
            cert.push(line);
            if (line.match(/-END CERTIFICATE-/)) {
                ca.push(cert.join("\n"));
                cert = [];
            }
        });
        httpsOptions.ca = ca;
        console.log("Using intermediate certificate.");
    }
    catch (e) {
        console.log("Intermediate certificate could not be read.");
    }
}
catch (e) {
    console.log("Falling back to default self-signed certificate.");
    httpsOptions = {
        key: fs.readFileSync('key.default.pem'),
        cert: fs.readFileSync('cert.default.pem')
    };
}

var http = require('http');
var https = require('https');

http.createServer(app).listen(HTTP_PORT);
https.createServer(httpsOptions, app).listen(HTTPS_PORT);

console.log('http server started on port ' + HTTP_PORT);
console.log('https server started on port ' + HTTPS_PORT);
