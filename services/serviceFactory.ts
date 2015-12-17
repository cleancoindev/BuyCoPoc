﻿import upholdService = require('./upholdService');
import stubUpholdService = require('./stubUpholdService');
import configurationService = require('./configurationService');
import proposalService = require('./proposalService');
import Q = require('q');

export interface IUpholdService {
    getCards: (callback: upholdService.IUpholdCardsCallback) => void;
    getUser: (callback: any) => void;
    createCard: (label: string, callback: upholdService.IUpholdCardCallback) => void;
    createTransaction: (
        fromCard: string,
        amount: number,
        currency: string,
        recipient: string,
        callback: upholdService.IUpholdTransactionCallback) => void;

    commitTransaction: (transaction: IUpholdTransaction, callback: upholdService.IUpholdTransactionCallback) => void
    getCardTransactions: (cardiId: string, callback: upholdService.IUpholdTransactionsCallback) => void;
}

var config = new configurationService.ConfigurationService().getConfiguration();

export function getConfiguration() {
    return config;
}

export function createUpholdService(token: string): IUpholdService {
    if (config.useStubs) {
        return new stubUpholdService.StubUpholdService(token);
    }
    else {
        return new upholdService.UpholdService(token);
    }
}

export function createProposalService(): Q.Promise<proposalService.ProposalService> {
    var defer = Q.defer<proposalService.ProposalService>();

    var ps = new proposalService.ProposalService();

    ps.initialize()
        .then(function () {
            defer.resolve(ps);
        })
        .catch(function (initializeErr) {
            defer.reject(initializeErr);
        });

    return defer.promise;
}