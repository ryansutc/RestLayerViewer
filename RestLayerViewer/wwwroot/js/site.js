//[todo: tuck the below away in a dojo module/widget]
/**
 * Populate hidden form values from a
 * listmgr object instance.
 * 
 * Needed to send the data to server for other pages
 * @param {listmgr.listmgr} fldmgr: field manager object
 */
function populateFormFromFieldList(fldmgr) {
    $('#selectedFields').text(fldmgr.getSelectedItemsAsText());
    $('#allFields').val(fldmgr.getAllItemsAsText());
    $('#selectedState').val(fldmgr.getSelectedStateAsText());

}

/**
 * Add an error message to a form element
 * @param {string} msg error message to display
 * @param {string} elementId dom element id
 */
function addError(msg, elementId) {
    let errElem = document.getElementById(elementId);
    errElem.style.display = "block";
    let icon = '<span class="glyphicon glyphicon-warning-sign"></span>';
    errElem.innerHTML = icon + " " + msg;
}

/**
 * Remove error text from form element, called on element validate events
 * @param {string} elementId: the dom element ID
 */
function hideError(elementId) {

    let errElem = document.getElementById(elementId);
    errElem.style.display = "none";
}

//--------------------------------------
$(document).ready(function () {
    /**
     * PAGE SPECIFIC LOGIC HERE:
     */

    if (page === "Home") {
        require([
            'dojo/parser',
            'listmgr/listmgr',
            'listmgr/listModalWidget',
            "map/featureLayerInfo",
            "auth/authHelp",
            "signin/signInWidget"
        ], function (parser, fieldmgr, listModalWidget, featureLayerInfo, authHelp, signInWidget) {

            var myAuth = new authHelp();
            myAuth.registerOAuth(); 
            if (identityMgr) {
                myAuth.reinitialize(identityMgr);
            }
            parser.parse(); // Let page load first.

            var serviceUrlTextBox = $('#serviceUrl');
            var showDataBtn = $("#showDataBtn");
            var clearDataBtn = $("#clearDataBtn");
            clearDataBtn.click(function (event) {
                window.location.replace("home/clear");
            });

            var myfieldModalWidget = new listModalWidget({
                title: 'Add/Remove Fields from Display',
                msg: 'will show only included fields here'
            }, 'listModalWidget');

            // handle modal popup close
            var modalFieldCloseEvent = function (event) {

                populateFormFromFieldList(myfieldModalWidget.listmgr);
                hideError("filterFieldsError");
                $('#showDataBtn').prop('disabled', false);
                
            }.bind(this);
            myfieldModalWidget.closeEvent = modalFieldCloseEvent;

            var myFLInfo = null; //FeatureLayerInfo. 

            if (serviceUrl && serviceUrl !== "") {
                // restore existing state:
                myfieldModalWidget.listmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));

                populateFormFromFieldList(myfieldModalWidget.listmgr);

                showDataBtn.prop('disabled', false);
                clearDataBtn.prop('disabled', false);
                $('#fieldsGroup').show(); // show fields list
                serviceUrlTextBox.prop("readonly", true);
                showDataBtn.text("Update Data");
                
            }
            else {
                $('.pageLink').hide();
            }

            var IdentityMgrElem = $("#identityMgr");
            var signInAction = function () {
                
                fetchServiceUrlInfo();
                IdentityMgrElem.val(myAuth.OAuthInfoToJSON());
                // we want to fire an ajax request to pass
                // the identityMgr JSON to our server to store it
                // in a session so that even if the user refreshes the 
                // page the information will still be kept.
                console.log(window.location.href);
                fetch(window.location.href + "home/saveAuthInfo", {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-type': 'application/json'
                    },
                    body: myAuth.OAuthInfoToJSON()
                })
                    .then(() => console.log("sent!"))
                    .catch((err) => {
                        console.log(err);
                    });
            };
            var signOutAction = function () {

                IdentityMgrElem.val("");
                // we want to fire an ajax request to remove
                // the identityMgr JSON from our server session variable to eliminate it there as well
                console.log(window.location.href);
                fetch(window.location.href + "home/saveAuthInfo", {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-type': 'application/json'
                    },
                    body: '{}'
                })
                    .then(() => console.log("sent!"))
                    .catch((err) => {
                        console.log(err);
                    });
            };
            
            var mySignInWidget = new signInWidget({
                authHelper: myAuth,
                onSignedInEvent: signInAction, //this is what we want to run on our page after a user signs in. Handles ASP CORE server side stuff
                onSignedOutEvent: signOutAction, //this is what we want to run after a user signs out. Handles ASP CORE server side stuff
                identityElementId: "identityMgr"
            }, "login");
            if (identityMgr) {
                mySignInWidget.signInOut(null);
            }

            $("body").on("click", "#signout", function (event) {
                event.preventDefault();
                console.log("signing out.");
                myAuth.signOut();
                $("#username").html("");
                $("#userinfo").html("");
                userCredsArea.hide();
            });

            $('#filterFields').click(function () {
                myfieldModalWidget.loadFieldList();
                myfieldModalWidget.show();
            });

            $('#serviceUrl').focusout(function (event) {
                fetchServiceUrlInfo(event);
            });

            function fetchServiceUrlInfo(event) {
                var errorElementId = "serviceUrlError";
                var url = $('#serviceUrl').val();

                if (url === "") {
                    hideError(errorElementId);
                    $('#fieldsGroup').hide();
                    $('#showDataBtn').prop('disabled', true);
                    return;
                }

                myFLInfo = new featureLayerInfo({ url: url });
                myFLInfo.fetchLayerInfo().then(function (data) {
                    var fields = myFLInfo.getFields(data);
                    myfieldModalWidget.listmgr = new fieldmgr(fields, null);
                    populateFormFromFieldList(myfieldModalWidget.listmgr);
                    hideError(errorElementId);

                    // show fields form element
                    $("#fieldsGroup").show();
                    $('#showDataBtn').prop('disabled', false);
                    
                    $('#coordName').text("wkid:" + myFLInfo.getProj(data).toString());
                    $('#coordInfo').attr("href", "//spatialreference.org/ref/epsg/" + myFLInfo.getProj(data) + "/html/");
                    $('#capabilities').text(myFLInfo.getCapabilities(data));
                    if (myFLInfo.getType(data) !== "Feature Layer") {
                        addError("Warning: this does not appear to be a Feature Layer. Might not be able to render.", errorElementId);
                    }
                    clearDataBtn.prop('disabled', false);
                }).catch((err) => {

                    addError(err, errorElementId);
                    $('#showDataBtn').prop('disabled', true);
                    $('#fieldsGroup').hide();
                });
            }

        });

    }
    else if (page === "Data") {
        require([
            'dojo/parser',
            'listmgr/listmgr',
            'datagrid/dataGridWidget',
            "auth/authHelp"
        ], function (parser, fieldmgr, dataGridWidget, authHelp) {
            var myAuth = new authHelp();
            myAuth.registerOAuth(); // TEST
            parser.parse(); // Loading page
            if (identityMgr) {
                myAuth.reinitialize(identityMgr);
            }

            if (allFieldsString) {
                var myFieldmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));
                selectedFields = myFieldmgr.getSelectedItems();
                var dataGrid = new dataGridWidget({
                    url: serviceUrl,
                    selectedFields: selectedFields
                }, 'dataGridWidget');

                $('#statusMsg').text("");

            }            
        });
    }
    else if (page === "Map") {
        require([
            'dojo/parser',
            'map/mymap',
            'listmgr/listmgr',
            "map/featureLayerInfo",
            "auth/authHelp"
        ], function (parser, map, fieldmgr, featureLayerInfo, authHelp) {
            if (allFieldsString) {
                var myAuth = new authHelp();
                myAuth.registerOAuth();
                parser.parse();
                if (identityMgr) {
                    myAuth.reinitialize(identityMgr);
                }

                var myFieldmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));
                selectedFields = myFieldmgr.getSelectedItems();

                //check what type of layer it is first:
                var myFLInfo = new featureLayerInfo({ url: serviceUrl });
                myFLInfo.fetchLayerInfo().then(function (data) {
                    var layerType = myFLInfo.getType(data);
                    if (!layerType) {
                        layerType = "Unknown Service Type";
                    }
                    try {
                        var mymap = new map(serviceUrl, selectedFields, layerType);
                        mymap.loadMap();
                    }
                    catch (err) {
                        $("#errorMsg").text(err);
                    }
                });
            }
        });
    }

});


