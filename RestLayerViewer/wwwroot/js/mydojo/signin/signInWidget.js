define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/html",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/signInWidget.html"
], function (declare, lang, dom, domStyle, html, on, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare("signInWidget", [_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        templateString: template,
        oid: "",
        authHelper: null,   // user must supply this
        identityElementId: null,   // the elementId you want to store IdentityMgr json info in.
        onSignedInEvent: null,
        onSignedOutEvent: null,
        username: "Sign In",
        _setUsernameAttr: { node: "_username", type: "innerHTML" },
        fullName: "AGOL Sign In",
        _setFullNameAttr: { node: "_fullname", type: "attribute", attribute: "title" },
       signedIn: false,
        
        constructor: function (/*Object*/ args) {
            lang.mixin(this, args);
            if (this.authHelper === null) {
                // [todo: need to build an interface for authHelper]
                throw "Error: signInWidget requires an authHelper param and for it to implement IAuth interface";
            }
            if (this.oid === "") {
                this.oid = 1;
            }
            if (!this.identityElementId) {
                console.log("You did not provide an elementId for a form input button to store the IdentityManager json info");
            }
        },

        postCreate: function () {
            //widget is rendered, lets see if we already have a signed in user.
            this.authHelper.checkLoginStatus(); //[todo: is this necessary now?]
        },

        signInOut: function (event) {
            if (this.signedIn === false) {
                if (event) {
                    event.preventDefault(); //ignore hyperlink
                }
                
                this.authHelper.signIn();
                this.authHelper.portal.when(function () {
                    this._signInUIUpdate();

                    if (this.identityElementId) {
                        try {
                            dom.byId(this.identityElementId).value = this.authHelper.OAuthInfoToJSON();
                        }
                        catch (err) {
                            console.log(err);
                            console.log("Could not save user auth info into identity Element input in form");
                            return;
                        }
                    }
                    this.signedIn = true;
                    this.onSignedIn();
                }.bind(this), function (err) {
                    console.log("user cancelled trying to log in");
                        this.authHelper.portal.cancelLoad();
                        this.authHelper.portal = null;
                    return;
                }.bind(this));
               
            }
            else {
                if (event) {
                    event.preventDefault(); //ignore hyperlink
                    //add a message to confirm users really want to sign out.
                    if (!confirm('Are you sure you want to sign out?')) {
                        return;
                    }
                }
                dom.byId(this.identityElementId).value = "";
                console.log("signing out.");
                this.authHelper.signOut();

                this.set('username', "Sign In");
                this.set('fullName', "Sign In to AGOL");
                //dojo.style(_signout, { 'display': 'none' });
                dojo.setAttr('showSignOutToggle' + this.oid, "hidden", "true");
                this.signedIn = false;
                this.onSignedOut();
            }
        }, 

        _signInUIUpdate: function () {
            this.set('username', this.authHelper.portal.user.username);
            this.set('fullName', this.authHelper.portal.user.fullName + "\n" + this.authHelper.portal.name);
            dojo.removeAttr('showSignOutToggle' + this.oid, "hidden");
        },

        onSignedIn: function () {
            /**
             * An Empty function meant to be overridden by consuming apps
             */
            this.onSignedInEvent();
        },

        onSignedOut: function () {
            //do something
            this.onSignedOutEvent();
        }


    });
});
