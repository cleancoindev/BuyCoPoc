﻿interface IDataAccessService {
    getSellerResource(creds: ICredentials): ISellerResourceClass;
    getBuyerResource(creds: ICredentials): IBuyerResourceClass;
    getCountryResource(): ICountryResourceClass;
    getRegionResource(filename: string): IRegionResourceClass;
}

interface ISellerResource extends ng.resource.IResource<ISeller> { }
interface IBuyerResource extends ng.resource.IResource<IBuyer> { }
interface ICountryResource extends ng.resource.IResource<ICountry> {}
interface IRegionResource extends ng.resource.IResource<IRegion> {}

interface ISellerResourceClass extends ng.resource.IResourceClass<ISellerResource> { }
interface IBuyerResourceClass extends ng.resource.IResourceClass<IBuyerResource> { }
interface ICountryResourceClass extends ng.resource.IResourceClass<ICountryResource> {}
interface IRegionResourceClass extends ng.resource.IResourceClass<IRegionResource> {}

class DataAccessService implements IDataAccessService {
    static $inject = ["$resource"];
    constructor(public $resource: ng.resource.IResourceService) {
    }

    getSellerResource(creds: ICredentials): ISellerResourceClass {
        const result = this.$resource(`/api/seller/${creds.externalId}`, { }, {
            get: {
                method: "GET",
                headers: creds
            },
            post: {
                method: "POST",
                headers: creds
            }
        });
        return result;
    };

    getBuyerResource(creds: ICredentials): IBuyerResourceClass {
        const result = this.$resource(`/api/buyer/${creds.externalId}`, {}, {
            get: {
                method: "GET",
                headers: creds
            },
            post: {
                method: "POST",
                headers: creds
            }
        });
        return result;
    };
    
    getCountryResource(): ICountryResourceClass {
        return this.$resource("data/countries-regions.json");
    };
    
    getRegionResource(filename: string): IRegionResourceClass {
        return this.$resource(`data/countries/${filename}.json`);
    };
}

angular
    .module("buyCoApp.services")
    .service("dataAccessService", DataAccessService);
