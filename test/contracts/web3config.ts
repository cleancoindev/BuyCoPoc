﻿import w3p = require('../../node_modules/web3plus/lib/web3plus');
import configurationService = require('../../services/configurationService');
import path = require('path');

export function createWeb3() {
    var cs = new configurationService.ConfigurationService();
    cs.basePath = path.resolve(path.dirname(__filename), "../../") + "/";
    var config = cs.getConfiguration();

    var jsonRpcUrl = config.ethereum.jsonRpcUrl;
    w3p.initialize(jsonRpcUrl, cs.basePath + 'contracts');

    return w3p;
}

export var web3plus = w3p;
