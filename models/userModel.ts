﻿import mongoose = require("mongoose");
import { Promise } from "q";
import { buyerSchema, IBuyer } from './buyerModel'
import { sellerSchema, ISeller} from './sellerModel'

/**
 * Backing token of the user for a specific BuyCo.
 */
// Backing of a BuyCo is stored in the user document itself, not in a separate collection. To be able
// to work with this in a productive, typesafe manner we define it as a class. 
// The only function of this class is to link the user data to the smart contract.
// Details like the amount and payments are stored in the contract.
export interface IBackingInfo {
    /**
     * The ID of the backed proposal.
     */
    proposalAddress: string;
    backingIndex: number;
}

export var userSchema = new mongoose.Schema({
    name: String,
    externalId: String,
    accessToken: String,
    backings: [{
        proposalAddress: String,
        backingIndex: Number,
    }],
    blockchainAccounts: {
        selected: String,
        accounts: [{
            address: String,
            encrypted: Boolean,
            locked: Boolean,
            hash: String,
            private: String,
            public: String,
            balance: Number
        }]
    },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyers' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sellers' },
    preferences: {
        perspective: String
    }
});

export interface ICredentials {
    externalId: string
    accessToken: string
}

export interface IBlockchainAccount extends mongoose.Document {
    address: string,
    encrypted: boolean,
    locked: boolean,
    hash: string,
    private: string,
    public: string,
    // Balance in Ether. Computed on load.
    balance: number,
}

export interface IBlockchainAddressList extends Array<IBlockchainAccount>, mongoose.Document {
}

export interface IBlockchainAccountCollection extends mongoose.Document {
    accounts: IBlockchainAddressList,
    selected: string
}

export interface IUserPreferences {
    /**
     * Valid values: empty, "buyer", "seller"
     */
    perspective: string;
}


export interface IUser extends mongoose.Document {
    name: string;
    /**
     * For users primarily defined by an external authenticator, the User ID. E.g. Uphold user name.
     */
    externalId: string;

    /**
     * Current OAuth access token for the user at the external authenticator.
     * TODO: refactor to a subtype, incorporate expiration date.
     */
    accessToken: string;

    email: string;
    
    /**
     * BuyCos this user has backed
     */
    backings: [IBackingInfo];

    blockchainAccounts: IBlockchainAccountCollection;

    isBuyer: boolean;

    isSeller: boolean;

    buyerId: string;
    sellerId: string;

    preferences: IUserPreferences;
}

/**
 * An individual user of the system, authenticated on one or more authentication providers.
 */
export var User = mongoose.model<IUser>("Users", userSchema);

interface IUserCallback {
    (error: any, user: IUser)
}


export class UserRepository {
    /**
    * Get a user by their access token.
    * TODO BW dd. 2015-01-11: Replace all calls with Promise-based variant and then remove this one.
    */
    public getUserByAccessToken(token: string, cb: IUserCallback): void {
        User.findOne({ accessToken: token }, (err, user) => {
            // TODO: use promise to wait for creating new user.
            if (!user) {
                // No user with this token.
                cb("Not found", null);
            }

            // TODO: check for validity of the token.
            cb(null, user);
        });
    };

    /**
    * Get a user by their accessToken - promise version. 
    */
    public getUserByAccessToken2(accessToken: string): Promise<IUser> {
        var result = Promise<IUser>((resolve, reject) => {
            if (!accessToken) {
                reject("No access token passed");
                return;
            }

            User.findOne({ accessToken: accessToken }, (err, resultUser) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resultUser);
            });
        });
        return result;
    };

    /**
    * Get a user by any of their blockchain addresses.
    */
    public getUserByBlockchainAddress(blockchainAddress: string): PromiseLike<IUser> {
        return this.getUserByBlockchainAddresses([blockchainAddress]);
    };

    /**
    * Get a user by any of their blockchain addresses.
    */
    public getUserByBlockchainAddresses(blockchainAddresses: Array<string>): PromiseLike<IUser> {
        return User.findOne({ "blockchainAccounts.accounts.address": { "$in": blockchainAddresses } }).exec();
    };

    /**
    * Get a user by their externalId. 
    */
    public getUserByExternalId(externalId: string): Promise<IUser> {
        var result = Promise<IUser>((resolve, reject) => {
            User.findOne({ externalId: externalId }, (err, resultUser) => {
                if (err) {
                    reject(err);
                }
                resolve(resultUser);
            });
        });
        return result;
    };

    /**
     * Create a new user.
     * For now just a simple one to one mapping with mongoose create function, but 'Promisied'.
     * @param user
     * @param cb
     */
    public create(newUser: IUser): Promise<IUser> {
        var result = Promise<IUser>(
            (resolve: (resultUser: IUser) => void, reject: (error: any) => void) => {
                User.create(newUser, (err: any, resultUser: IUser) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(resultUser);
                });
            });
        return result;
    };


    /**
     * Find one or more users give some criteria (in an JS Object format).
     * For now just a simple one to one mapping with the mongoose find function, but 'Promisied'.
     */
    public find(cond: Object): Promise<IUser[]> {
        var result = Promise<IUser[]>(
            (resolve: (users: IUser[]) => void, reject: (error: any) => void) => {
                User.find(cond, (err: any, users: IUser[]) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(users);
                });
            });
        return result;
    };

    /**
     * Check if them credentials are credible :).
     */
    public checkCredentials(cred: ICredentials): Promise<Boolean> {
        var result = Promise<Boolean>(
            (resolve: (checksOut: Boolean) => void, reject: (error: any) => void) => {
                this.getUserByExternalId(cred.externalId).then((user: IUser) => {
                    let credsValid = user.accessToken === cred.accessToken;
                    resolve(credsValid);
                }).catch((err: any) => {
                    reject(err);
                });
            })

        return result;
    }
}

