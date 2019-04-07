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
], function (declare, lang, dom, on, esriRequest, OAuthInfo, IdentityMgr, Portal, PortalGroup, PortalUser) {

    return declare(null, {
        oid: "",
        portal: null,
        info: null,
        appId: "a39UJJqj4xXbIMtT", //st albert Client App ID

        constructor: function (/*Object*/ args) {
            lang.mixin(this, args);
            //allow the user to login:
            //lets try to force a user to log in:
            this.portal = new Portal();
            this.portal.authMode = "immediate";
        },

        signIn: function () {
            if (this.portal === null) {
                this.portal = new Portal();
                this.portal.authMode = "immediate";
            }
            this.portal.load();
        }, 

        signOut: function () {
            IdentityMgr.destroyCredentials();
            this.portal = null;
        },

        checkLoginStatus: function () {
            // registerOAuth must have been called first so we have a portalUrl
            // can we check if a user is logged in:
            return new Promise(function (resolve, reject) {
                if (this.info === null) {
                    this.registerOAuth();
                }
                IdentityMgr.checkSignInStatus(this.info.portalUrl + "/sharing")
                    .then((credential) => {
                        portal = new Portal();
                        portal.authMode = "immediate";
                        portal.load();
                        portal.when(function () {
                            this.portal = portal;
                            resolve(true);
                        });
                        /*
                        portalUser.when(function () {
                            console.log(portalUser.fullName + "\n" + portalUser.orgId);
                            console.log(PortalGroup);
                        });
                        */

                    })
                    .catch(function (err) {
                        console.log(err);
                        reject(false);
                    });
            }.bind(this));
        },

        reinitialize: function (stringIdentityMgr) {
            //clean strings html escape chars:
            stringIdentityMgr = stringIdentityMgr.split("&quot;").join('"');
            IdentityMgr.initialize(JSON.parse(stringIdentityMgr));
        },

        registerOAuth: function () {

            // If we don't have an appID, so what? We just get access to everything?
            // https://developers.arcgis.com/documentation/core-concepts/security-and-authentication/accessing-arcgis-online-services/
            this.info = new OAuthInfo({
                appId: this.appId, // "a39UJJqj4xXbIMtT" St Albert App Client ID :
                popup: true,
                popupCallbackUrl: "Home/oauthcallback" //[todo: what should this be so we can use popup?]
            });
            
            IdentityMgr.registerOAuthInfos([this.info]);
        },

        IdentityMgrToJSON: function () {
            // if we want to send the IdentityManager Object to the server is this how?
            return JSON.stringify(IdentityMgr.toJSON());
        },

        OAuthInfoToJSON: function () {
            // for sending to server.
            return JSON.stringify(this.info.toJSON());
        }


    });
});
