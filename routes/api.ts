﻿import express = require('express');

import upholdController = require('../controllers/upholdController');
import migrationController = require('../controllers/migrationController');
import proposalController = require('../api/proposal/proposalController');
import categoryController = require('../api/category/categoryController');
import offerController = require('../api/offer/offerController');
import sellerController = require('../api/seller/sellerController');
import buyerController = require('../api/buyer/buyerController');
import configController = require('../api/configuration/configurationController');
import contractController = require('../api/contract/contractController');
import cacheController = require('../api/data/cacheController');
import userAccountController = require('../api/user/userAccountController');
import auditController = require('../api/audit/auditController');

/**
 * Configure the routes for all API functions on an Express app.
 * @param app
 */
export function configure(app: express.Express) {
    var apiRouter = express.Router();
    app.use('/api', apiRouter);

    var uc = new upholdController.UpholdController();
    apiRouter.route("/uphold/me/cards").get(uc.getCards);
    apiRouter.route("/uphold/me/cards/withBalance").get(uc.getCardsWithBalance);

    // Categories
    var catCon = new categoryController.CategoryController();
    // All categories (to fill dropdowns etc)
    apiRouter.route("/category/").get(catCon.getMainCategories);
    // There may not be a category named "all"
    apiRouter.route("/category/all").get(catCon.getAllCategories);
    apiRouter.route("/category/:mainCategory").get(catCon.getOneMainCategory);
    // Categories used in proposals (for browsing)
    apiRouter.route("/proposal/category").get(catCon.getUsedMainCategories);
    apiRouter.route("/proposal/category/:mainCategory").get(catCon.getOneUsedMainCategory);

    // Proposals
    var pc = new proposalController.ProposalController();
    apiRouter.route("/proposal").get(pc.get);
    apiRouter.route("/proposal/closing-candidates").get(pc.getClosingCandidates);

    apiRouter.route("/proposal/:id").get(pc.getOne);
    // Backing
    apiRouter.route("/proposal/:id/back").post(pc.back);
    apiRouter.route("/proposal/:id/delivery-report").post(pc.deliveryReport);
    // Fulfilment
    apiRouter.route("/proposal/:id/close").post(pc.close);
    apiRouter.route("/proposal/:id/process-payments").post(pc.processPayments);

    apiRouter.route("/proposal/:id/backers").get(pc.getBackers);
    apiRouter.route("/proposal/:id/offers").get(pc.getOffers);
    apiRouter.route("/proposal").post(pc.create);
    // Proposals by sub category. Same function, but now with params.
    apiRouter.route("/proposal/category/:mainCategory/:subCategory").get(pc.get);


    // Offers
    var oc = new offerController.OfferController();
    apiRouter.route("/proposal/:id/offer").post(oc.create);
    apiRouter.route("/offer/:id").get(oc.getOne);
    apiRouter.route("/proposal/:proposalId/offer/:offerId/buyers").get(oc.getBuyers);

    // Sellers
    var sc = new sellerController.SellerController();
    apiRouter.route("/seller/:id").get(sc.get);
    apiRouter.route("/seller/:id").post(sc.save);

    // Buyers
    var bc = new buyerController.BuyerController();
    apiRouter.route("/buyer/:id").get(bc.get);
    apiRouter.route("/buyer/:id").post(bc.save);

    // Config
    var cc = new configController.ConfigurationController();
    apiRouter.route("/config/useStubs").get(cc.useStubs);
    apiRouter.route("/config/getversion").get(cc.getVersion);
    apiRouter.route("/config/ethereum/jsonRpcUrl").get(cc.getEthereumJsonRpcUrl);
    apiRouter.route("/config/ethereum/contracts/proposalRegistry").get(cc.getProposalRegistryAddress);

    // Smart contracts for client side blockchain interaction
    var contractCon = new contractController.ContractController();
    apiRouter.route("/contract/:contractName/abi").get(contractCon.getAbi);    

    // User accounts
    var uac = new userAccountController.UserAccountController();
    apiRouter.route("/user/accounts").post(uac.saveBlockchainAccounts);
    apiRouter.route("/user/accounts").get(uac.getBlockchainAccounts);
    apiRouter.route("/user").get(uac.getUserInfo);            

    // Migrations
    var mc = new migrationController.MigrationController();
    apiRouter.route("/migration/update").post(mc.update);
    apiRouter.route("/migration/test/seed").post(mc.seedTestData);

    // Cache
    var cacheCon = new cacheController.CacheController();
    apiRouter.route("/data/cache/update").post(cacheCon.update);
    apiRouter.route("/data/cache/refresh").post(cacheCon.fullRefresh);

    
    var ac = new auditController.AuditController();
    apiRouter.get("/audit/buyco", ac.getList);
    apiRouter.get("/audit/vault", ac.getVaultData);
    apiRouter.get("/audit/info", ac.getInfo);

    // Catch non-existing api calls.
    apiRouter.route("*").all(function (req, res) {
        res.status(404).send(`No API method at '${req.url}'`);
    });
}