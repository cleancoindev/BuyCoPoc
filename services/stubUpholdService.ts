﻿import upholdService = require('./upholdService');
import userModel = require('../models/userModel');
import tools = require('../lib/tools');
import serviceFactory = require('./serviceFactory');
import { Promise } from 'q';

export class StubUpholdService implements serviceFactory.IUpholdService {
    constructor(
        private authorizationToken: string) {
    }

    /**
     * Gets info about the current user.
     */
    getUser = (callback) => {
        var newUserId = "User" + this.authorizationToken;

        // Create a new user array.
        var user = {
            name: "Stub user",
            externalId: newUserId,
            email: "stubuser@moneycircles.com"
        };

        callback(null, user);
    }

    getCards = (callback: upholdService.IUpholdCardsCallback) => {
        var cards: upholdService.IUpholdCard[] = [
            {
                "address": {
                    "bitcoin": "1Abc"
                },
                "available": 10,
                "balance": 10,
                "currency": "GBP",
                "id": "card1",
                "label": "GBP card",
                "lastTransactionAt": undefined,
                "settings": {
                    "position": 1,
                    "starred": false
                },
                "addresses": [
                    {
                        "id": "1Abc",
                        "network": "bitcoin"
                    }
                ],
                "normalized": [
                    {
                        "available": 10,
                        "balance": 10,
                        "currency": "GBP"
                    }
                ]

            }
        ]


        callback(null, cards);
    }

    getCardTransactions = (cardId: string, callback: upholdService.IUpholdTransactionsCallback) => {
        var transactions: upholdService.IUpholdTransaction[] = [
            {
                "id": "tx1",
                "type": "",
                "message": "",
                "status": "",
                "RefundedById": "",
                "createdAt": "2016-02-15 15:00",
                "denomination": {
                    "amount": 1,
                    "currency": "GBP",
                    "pair": "GBPGBP",
                    "rate": 1
                },
                "origin": {
                    "CardId": "card1",
                    "amount": 1,
                    "base": 1,
                    "commission": 1,
                    "currency": "",
                    "description": "",
                    "fee": 1,
                    "rate": 1,
                    "type": "",
                    "username": ""
                },
                "destination": {
                    "CardId": "",
                    "amount": 1,
                    "base": 1,
                    "commission": 1,
                    "currency": "",
                    "description": "",
                    "fee": 1,
                    "rate": 1,
                    "type": "",
                    "username": ""
                },
                "params": {
                    "currency": "",
                    "margin": 1,
                    "pair": "",
                    "rate": 1,
                    "ttl": 1,
                    "type": ""
                }
            }

            , {
                "id": "tx2",
                "type": "",
                "message": "",
                "status": "",
                "RefundedById": "",
                "createdAt": "2016-02-03 13:22",
                "denomination": {
                    "amount": 15,
                    "currency": "GBP",
                    "pair": "GBPGBP",
                    "rate": 1
                },
                "origin": {
                    "CardId": "card2",
                    "amount": 15,
                    "base": 1,
                    "commission": 1,
                    "currency": "",
                    "description": "",
                    "fee": 1,
                    "rate": 1,
                    "type": "",
                    "username": ""
                },
                "destination": {
                    "CardId": "",
                    "amount": 15,
                    "base": 1,
                    "commission": 1,
                    "currency": "",
                    "description": "",
                    "fee": 1,
                    "rate": 1,
                    "type": "",
                    "username": ""
                },
                "params": {
                    "currency": "",
                    "margin": 1,
                    "pair": "",
                    "rate": 1,
                    "ttl": 1,
                    "type": ""
                }
            }
        ];


        callback(null, transactions);
    }

    /**
     * Create a new card.
     */
    createCard = (label: string, callback: upholdService.IUpholdCardCallback) => {
        var newId = "card" + Math.random() * 1000000;
        var card: upholdService.IUpholdCard = {
            "address": {
                "bitcoin": ""
            },
            "available": 10,
            "balance": 10,
            "currency": "GBP",
            "id": newId,
            "label": label,
            "lastTransactionAt": undefined,
            "settings": {
                "position": 1,
                "starred": false
            },
            "addresses": [
                {
                    "id": "1Abc",
                    "network": "bitcoin"
                }
            ],
            "normalized": [
                {
                    "available": 10,
                    "balance": 10,
                    "currency": "GBP"
                }
            ]

        }

        callback(null, card);
    }

    createTransaction = (
        fromCard: string,
        amount: number,
        currency: string,
        recipient: string,
        callback: upholdService.IUpholdTransactionCallback) => {

        var newId = tools.newGuid();

        var transaction: upholdService.IUpholdTransaction =
            {
                "id": newId,
                "type": "",
                "message": "",
                "status": "",
                "RefundedById": "",
                "createdAt": "",
                "denomination": {
                    "amount": amount,
                    "currency": currency,
                    "pair": currency + currency,
                    "rate": 1
                },
                "origin": {
                    "CardId": fromCard,
                    "amount": 1,
                    "base": 1,
                    "commission": 1,
                    "currency": "",
                    "description": "",
                    "fee": 1,
                    "rate": 1,
                    "type": "",
                    "username": ""
                },
                "destination": {
                    "CardId": "",
                    "amount": 1,
                    "base": 1,
                    "commission": 1,
                    "currency": "",
                    "description": "",
                    "fee": 1,
                    "rate": 1,
                    "type": "",
                    "username": ""
                },
                "params": {
                    "currency": "",
                    "margin": 1,
                    "pair": "",
                    "rate": 1,
                    "ttl": 1,
                    "type": ""
                }
            }

        callback(null, transaction);
    }

    commitTransaction = (transaction: upholdService.IUpholdTransaction, callback: upholdService.IUpholdTransactionCallback) => {
        callback(null, transaction);
    }

    /**
    * Create a transaction and immediately commit it.
    */
    createAndCommitTransaction = (
        fromCard: string,
        amount: number,
        currency: string,
        recipient: string): Promise<IUpholdTransaction> => {
        var t = this;
        return Promise<IUpholdTransaction>((resolve, reject) => {
            t.createTransaction(fromCard, amount, currency, recipient, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                t.commitTransaction(res, (commitErr, commitRes) => {
                    if (commitErr) {
                        reject(commitErr);
                        return;
                    }
                    resolve(commitRes);
                });
            });
        });
    }
}