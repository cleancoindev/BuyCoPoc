"use strict";
// TODO BW dd. 2016-01-24: Typescriptify
function OVMessage() {
    return {
        restrict: 'EA',
        transclude: true,
        scope: {
            message: '=',
            messageType: "="
        },
        templateUrl: "js/common/ov-message.html",
        controller: "ovMessageController",
        controllerAs: "vm"
    };
}
angular.module("buyCoApp").directive('ovMessage', OVMessage);
//# sourceMappingURL=proposal-detail.directive.js.map