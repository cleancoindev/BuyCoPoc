﻿/// <reference path="typings/tsd.d.ts" />
import express = require('express');
import mongoose = require('mongoose');
import bodyParser = require('body-parser');
import web3config = require('./lib/web3config');
import assert = require('assert');

import configModel = require('./models/configModel');

var web3 = require("web3");

import path = require('path');

import fs = require('fs');

import indexRoute = require('./routes/index');
import oauthController = require('./controllers/oauthController');
import configurationService = require('./services/configurationService');

export class Server {
    basePath = "./";
    config: configModel.IApplicationConfig;
    HTTP_PORT: number;
    HTTPS_PORT: number;

    createApp(): express.Application {
        var cs = new configurationService.ConfigurationService();

        cs.basePath = this.basePath;
        this.config = cs.getConfiguration();

        console.log("My configuration:");
        console.log(this.config);

        this.HTTP_PORT = this.config.server.httpPort;
        this.HTTPS_PORT = this.config.server.httpsPort;

        var baseUrl = this.config.server.baseUrl + ":" + this.HTTPS_PORT;


        /************** OAuth controllers ****************/

        var upholdConfig = {
            baseUrl: baseUrl,
            basePath: "/api/auth/uphold",
            clientID: this.config.uphold.app.clientID,
            clientSecret: this.config.uphold.app.clientSecret,

            scope: "cards:read,cards:write,transactions:read,transactions:write,user:read",
            // Uphold uses a different domain for the authorization URL. simple-oauth2 doesn't support that.
            // The "site" parameter also may not be empty.
            // As a workaround, we use the greatest common denominator of the two URLs: "https://".
            oauthSite: "https://",
            oauthTokenPath: 'api.uphold.com/oauth2/token',
            oauthAuthorizationPath: 'uphold.com/authorize/' + this.config.uphold.app.clientID,
            adminUserId: this.config.uphold.vaultAccount.userName
        }

        var upholdOauthController = new oauthController.OAuthController(upholdConfig);
        var bitReserveService = require('./services/upholdService');
        var serviceFactory = require('./services/serviceFactory');

        /**
         * Create a new Uphold service and get user info from it.
         */
        function getBitReserveUserInfo(token: string, callback) {
            var brs = serviceFactory.createUpholdService(token);
            brs.getUser(callback);
        }

        upholdOauthController.setGetUserInfoFunction(getBitReserveUserInfo);

        var stubOauthController = require('./controllers/stubOauthController');

        var stubBitReserveService = require('./services/stubUpholdService');

        if (this.config.useStubs) {
            // Create a stub controller from the real controller.
            var stubController = new stubOauthController.StubOAuthController(upholdOauthController);


            // Replace the handlers of the real controller by the stubs.
            upholdOauthController.auth = stubController.auth;
            upholdOauthController.callback = stubController.callback;
        }

        /******** Ethereum / web3 setup *************/

        // TODO: make the server not crash badly when the eth connection fails.
        var web3plus = web3config.createWeb3(this.config.ethereum.jsonRpcUrl);

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
        var db = mongoose.connect(this.config.database.url);

        // Client folder containing the Angular SPA, serve as static assets
        var clientDir = path.join(__dirname, 'client')
        app.use(express.static(clientDir));

        // All routes which are directly accessible (i.e. not only from within the Angular SPA).
        // All open index.html, where Angular handles further routing to the right controller/ view.
        // Ideally all routes not matched by server-side routes are forwarded to Angular.
        // TODO: introduce an "other" wildcard handler for this.
        app.get('/', indexRoute.index);
        app.get('/user/profile', indexRoute.index);
        app.get('/user/login', indexRoute.index);

        app.get('/proposal/list', indexRoute.index);
        app.get('/proposal/new', indexRoute.index);

        app.get('/not-found', indexRoute.index);

        app.get(upholdOauthController.getAuthRoute(), upholdOauthController.auth);
        app.post(upholdOauthController.getCallbackApiRoute(), upholdOauthController.callback);
        app.get(upholdOauthController.getCallbackPublicRoute(), indexRoute.index);

        // Uphold API wrapper
        var upholdController = require('./controllers/upholdController');
        var uc = new upholdController.UpholdController();
        app.get("/api/uphold/me/cards", uc.getCards);
        app.get("/api/uphold/me/cards/withBalance", uc.getCardsWithBalance);

        // Proposals
        var proposalController = require('./controllers/proposalController');
        var pc = new proposalController.ProposalController();
        app.get("/api/proposal", pc.getAll);
        app.post("/api/proposal", pc.create);

        // Migrations
        var migrationController = require('./controllers/migrationController');
        var mc = new migrationController.MigrationController();
        app.post("/api/migration/update", mc.update);
        app.post("/api/migration/test/seed", mc.seedTestData);



        return app;
    }

    run(app: express.Application) {

        /*********************** HTTP server setup ********************/
        var httpsOptions;

        try {
            console.log("Trying custom certificate.");

            httpsOptions = {
                key: fs.readFileSync(this.basePath + 'key.pem'),
                cert: fs.readFileSync(this.basePath + 'cert.pem')
            };

            console.log("Using custom certificate.");

            try {
                console.log("Trying to read intermediate certificate.");
                var chainLines = fs.readFileSync(this.basePath + 'intermediate.pem', 'utf-8').split("\n");
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
                key: fs.readFileSync(this.basePath + 'key.default.pem'),
                cert: fs.readFileSync(this.basePath + 'cert.default.pem')
            };
        }

        var http = require('http');
        var https = require('https');

        http.createServer(app).listen(this.HTTP_PORT);
        https.createServer(httpsOptions, app).listen(this.HTTPS_PORT);

        console.log('http server started on port ' + this.HTTP_PORT);
        console.log('https server started on port ' + this.HTTPS_PORT);
    }
}
