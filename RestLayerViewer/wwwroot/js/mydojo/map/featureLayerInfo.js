define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/on",
    "esri/request",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager",
    "esri/portal/PortalGroup"
], function (declare, lang, dom, on, esriRequest, OAuthInfo, IdentityManager, PortalGroup) {

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

            this.registerOAuth();
            // Handle click of "Sign in" button that appears when user selects private service:
            /*
            on(dom.byId("signin"), "click", function (e) {
                var url = $('#serviceUrl').val();
                esriRequest(url, { query: { f: "json" }, responseType: "json" })
                    .then(function (response) {
                        console.log(JSON.stringify(response, null, 2));
                    });
            }).bind(this);
            */
        },

        registerOAuth: function () {
            this.portal = new PortalGroup();
            this.portal.authMode = "immediate";

            // https://developers.arcgis.com/documentation/core-concepts/security-and-authentication/accessing-arcgis-online-services/
            this.info = new OAuthInfo({
                appId: this.appId, // "a39UJJqj4xXbIMtT" St Albert App Client ID :
                popup: false,
                popupCallbackUrl: "index.html" //[todo: what should this be so we can use popup?]
            });

            IdentityManager.registerOAuthInfos([this.info]);
        },

        fetchLayerInfo: function () {
            var requestObj = { query: { f: "json" }, responseType: "json" };
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
                        reject(err);
                    });
            });
                    
            //});
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

        getJsonResponse: function (response) {
            if (!response.ok) {
                throw Error(response.status + ": " + response.statusText);
            }
            try {
                return response.json();
            }
            catch (err) {
                throw Error("Invalid JSON. Is this really a REST endpoint?");
            }
        },

        /**
         * 
         * @param {any} data: json FeatureLayer data
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
                if (data.hasOwnProperty('layers')) {
                    // is this just a feature service?
                    throw Error("Looks like this is a Feature Service. You need to specify a feature layer from the service.")
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
        }
    });
});