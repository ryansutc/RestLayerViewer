define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/html",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/signInWidget.html"
], function (declare, lang, dom, html, on, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare(null, {
        oid: "",
        authHelper: null,   // user must supply this
        identityElementId: null,   // the elementId you want to store IdentityMgr json info in.

        constructor: function (/*Object*/ args) {
            lang.mixin(this, args);
            if (this.authHelper === null) {
                // [todo: need to build an interface for authHelper]
                throw "Error: signInWidget requires an authHelper param and for it to implement IAuth interface";
            }
            if (this.oid === "") {
                this.oid = 1;
            }
            if (!identityElementId) {
                console.log("You did not provide an elementId for a form input button to store the IdentityManager json info");
            }
        },

        signIn: function() {
            this.authHelper.signIn();
            this.authHelper.portal.when(function () {
                //var userNameElement = dom.byId("_username" + this.oid);
                //var userInfoElement = dom.byId("_userinfo" + this.oid);
                //var signOutElement = dom.byId("_signout" + this.oid);

                html.set(_username, this.authHelper.portal.user.username);
                dojo.style(_signout, { 'display': 'block' });

                html.set(_userinfo, this.authHelper.portal.user.fullName + "<br/>" + this.authHelper.portal.name);
                //fetchServiceUrlInfo(); //we'll have to override this method to get this to fire.
                if (this.identityElementId) {
                    try {
                        dom.byId(identityElementId).val(this.authHelper.OAuthInfoToJSON());
                    }
                    catch {
                        console.log("Could not save user auth info into identity Element input in form");
                    }
                }
            });
        }, 

        signOut: function () {
            event.preventDefault(); //ignore hyperlink
            console.log("signing out.");
            this.authHelper.signOut();

            html.set(_username, "Sign In");
            dojo.style(_signout, { 'display': 'none' });
            html.set(_userinfo, "");
        }


    });
});
