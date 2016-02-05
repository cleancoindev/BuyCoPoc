﻿/*** ADAPTED COPY FROM contractInterfaces.ts FROM BACKEND ***/
// Adaptations:
// - Remove 'export' as this is not a module
// - Replace Promise returns by callbacks, as the contracts on the front end are
//   not (yet) promiseified.

interface IBigNumber {
    toNumber(): number
}

interface IWeb3TransactionOptions {
    gas?: number;
    to?: string;
    from?: string;
}

interface IWeb3Contract {
    address: string;
}

interface IWeb3TransactionCallback {
    (error: any, transactionId: string);
}

// Interface definitions of the contract properties / methods as present in the
// web3.js contract objects. The definitions are incomplete and have to be manually 
// updated. However they're already useful to keep track of contract changes.
// COULD DO: automate this by parsing Solidity files. Maybe someone is doing that already...

// All transactional methods return Promise<string>, with the value being the transaction
// hash. This assumes contract objects have passed through web3plus.enhanceContract to
// make them return a Promise. If not, they take a callback, which is not reflected in 
// these interfaces.

interface IProposalRegistryContract extends IWeb3Contract {
    allContractTypes;
    addProposal(productName: string,
        productCategory: string,
        productSubCategory: string,
        maxPrice: number,
        endDate: string,
        ultimateDeliveryDate: string, options?: IWeb3TransactionOptions, callback?: IWeb3TransactionCallback);

    proposals(index: number | IBigNumber, callback?): string;
    proposalIndex(): IBigNumber;

    name(): string;
}

interface IProposalContract extends IWeb3Contract {
    setDetails(productDescription: string,
        productSku: string,
        productUnitSpecification: string, options?: IWeb3TransactionOptions, callback?: IWeb3TransactionCallback);

    back(amount: number, options?: IWeb3TransactionOptions, callback?: IWeb3TransactionCallback);
    offer(price: number, minimumAmount: number, options?: IWeb3TransactionOptions, callback?: IWeb3TransactionCallback);

    setPaid(backingAddress: string, paymentType: number, transactionId: string, amount: number, callback?: IWeb3TransactionCallback);

    offers(index: number | IBigNumber, callback?): string;
    offerIndex(): IBigNumber;

    backers(index: number | IBigNumber, callback?): any[];
    backerIndex(): IBigNumber;
    backerIndexByAddress(address: string): IBigNumber;

    productName(): string;
    productDescription(): string;
    productSku(): string;
    productUnitSize(): string;
    mainCategory(): string;
    subCategory(): string;
    maxPrice(): IBigNumber;
    endDate(): string;
    ultimateDeliveryDate(): string;
}

interface IOfferContract extends IWeb3Contract {
    sellerAddress(): string;
    price(): IBigNumber;
    minimumAmount(): IBigNumber;
}