define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/on",
    "esri/request",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager",
    "esri/portal/Portal",
    "esri/portal/PortalGroup",
    "esri/portal/PortalUser"
], function (declare, lang, dom, on, esriRequest, OAuthInfo, IdentityManager, Portal, PortalGroup, PortalUser) {

    return declare(null, {
        oid: "",
        portal: null,
        info: null,
        appId: "a39UJJqj4xXbIMtT", //st albert Client App ID

        constructor: function (/*Object*/ args) {
            lang.mixin(this, args);
            if (!args.url) {
                throw "Error: Must supply a featureLayer REST url";
            }
            else if (args.url.indexOf("?") !== -1) {
                console.log("Warning: App does not accept REST parameters");
                this.url = args.url.slice(0, args.url.indexOf("?")); //strip out parameters!
            }

        },

        fetchLayerInfo: function () {
            var requestObj = { query: { f: "json" }, responseType: "json", authMode: "no-prompt" };
            var url = this.url;
            return new Promise((resolve, reject) => {
                //IdentityManager.checkSignInStatus(this.info.portalUrl + "/sharing").then(function () {
                //if you're signed in get the data this way:
                esriRequest(url, requestObj)
                    .then(function (data) {
                        //console.log(JSON.stringify(data, null, 2));
                        resolve(data);
                    })
                    .catch((err) => {
                        var hepfulErrorMsg = this.getErrorHelpMsg(err);
                        reject(hepfulErrorMsg);
                    });
            });
        },

        getErrorHelpMsg: function (err) {
            if (err.details.httpStatus === 0) {
                return "Unable to load that page. Is this a <span class='tooltip1'>" +
                    "<a href='https://en.wikipedia.org/wiki/Cross-origin_resource_sharing' title='CORS Wiki'>CORS issue?</a>" +
                    "<span class='tooltiptext small'>Press F12 and open <i>Developer Tools>Network</i> to see</span>";
            }
            else if (err.details.httpStatus === 499) {
                return "Unable to access secured services. If you have credentials you can log in to give the app a token and allow it to access";
            }
            else if (err.message === "Invalid Url") {
                return "Couldn't seem to get that url. Response: " + err.details.httpStatus;
            }
            else if (err.message === "Unexpected token < in JSON at position 0") {
                return "problem reading JSON data. Are you sure this is an ArcGIS REST Endpoint?";
            }
            else {
                return err.message + " (response: " + err.details.httpStatus + ")";
            }
        }, 

        /**
          * Get ArcGIS Feature Layer REST Json with an async fetch call.
          * [todo] should probably switch this to an ArcGIS Javascript API call.
          * @param {string} url
          * @param {string} elementId
          */
        fetchServiceUrlJson: function (url, elementId) {
            // get the fields for the layer we're trying to fetch:
            // https://reqres.in/api/users?page=2
            // empty layer: https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/Ryan_test_Pts_HostedCopy/FeatureServer/0?f=pjson&token=AFMpl2Z4DZTuAAfxF_b6Edfi9nBVrvY0XaLiwMaAS2dXM418H2yhYQuXmIkioml-TaxHDpoLPVhpwQ-rT1zEu7QdnPSizIzMwEfcAVLaS8qBDDT6QWlKLemqDxaJdjJ1fvHOQPtuQ38rRyq4GNYU7HxOAMkYCtWh0WOrCBNGKoKzY4YyRXnBhuvJX0QPDF1wsjJFKppx7mYXjn2ggMDCYZHxKCahy_z7EtLNia10AA_HuRn-7W1RD0sx2vb3tsTV
            // https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/LFL_Database_TEST/FeatureServer/0

            return new Promise(function (resolve, reject) {

                
            });
        },

        /**
         * 
         * @param {any} data: json FeatureLayer data
         * @returns {Array} list of fields.
         */
        getFields: function (data) {

            try {
                let fields = [];
                for (let f of data.data.fields) {
                    fields.push(f.name);
                }
                return fields;
            }
            catch (err) {
                if (data.data.hasOwnProperty('layers')) {
                    // is this just a feature service?
                    throw Error("Looks like this is a Feature Service. You need to specify a feature layer from the service.");
                }
                else if (data.data.type !== "Feature Layer") {
                    throw Error("Looks like this is a " + data.data.type + ". Not a FeatureLayer.");
                }
                throw Error("Could not retrieve field names from JSON. Is this a valid ArcGIS feature layer?");
            }
        },

        getProj: function (data) {
            try {
                var wkid = data.data.extent.spatialReference.wkid;
                return wkid;
            }
            catch (err) {
                console.log(err);
            }
        },

        getCapabilities: function (data) {
            try {
                var capabilities = data.data.capabilities;
                return capabilities;
            }
            catch (err) {
                console.log(err);
            }
        },

        getType: function (data) {
            return data.data.type;
        }

    });
});