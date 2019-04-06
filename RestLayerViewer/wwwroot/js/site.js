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
            "auth/authHelp"
        ], function (parser, fieldmgr, listModalWidget, featureLayerInfo, authHelp) {
            var myAuth = new authHelp();
            myAuth.registerOAuth(); // TEST
            parser.parse(); // Let page load first.
            var userCredsArea = $('#usercredsarea');
            var serviceUrlTextBox = $('#serviceUrl');
            var allFieldsTextBox = $("#allFields");
            var selectedStateTextBox = $("#selectedState");

            var myfieldModalWidget = new listModalWidget({
                title: 'Add/Remove Fields from Display',
                msg: 'will show only included fields here'
            }, 'listModalWidget');

            var myFLInfo = null; //FeatureLayerInfo. 

            if (serviceUrl && serviceUrl != "") {
                // restore existing state:
                myfieldModalWidget.listmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));

                populateFormFromFieldList(myfieldModalWidget.listmgr);

                $('#showDataBtn').prop('disabled', false);
                $('#fieldsGroup').show();
                serviceUrlTextBox.prop("disabled", true);
                $("#showDataBtn").text("Clear Data");
                $('#showDataBtn').removeAttr("type").attr("type", "reset");
                $("#showDataBtn").click(function (event) {
                    serviceUrlTextBox.val("");
                    serviceUrlTextBox.text("");
                    allFieldsTextBox.val("");
                    allFieldsTextBox.text("");
                    selectedStateTextBox.val("");
                    selectedStateTextBox.text("");
                    
                    //event.preventDefault;
                    window.location.replace("home/clear");
                    //window.location.reload();
                });
            }
            else {
                $('.pageLink').hide();
            }
            $('#signinAGOL').click(function () {
                myAuth.signIn();
                myAuth.portal.when(function () {
                    $("#username").html(myAuth.portal.user.username + " <a href='no-javascript.html' title='sign out' id='signout'>(sign out)</a>");
                    $("#userinfo").html(myAuth.portal.user.fullName + "<br/>" + myAuth.portal.name);
                    userCredsArea.show();
                    fetchServiceUrlInfo();

                    console.log("Identity Manager: \n" + myAuth.IdentityMgrToJSON());
                    var IdentityMgr = $("#identityMgr");
                    IdentityMgr.val(myAuth.OAuthInfoToJSON());

                    //TEST lets see if we can reinitialize:
                    myAuth.reinitialize(myAuth.OAuthInfoToJSON());
                });
            });

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

            // handle modal popup close
            $('#modalFieldclose').click(function (event) {
                var includedFieldCount = myfieldModalWidget.listmgr.getSelectedItems().length;
                if (includedFieldCount === 0) {
                    addError("You must include at least 1 field", "filterFieldsError");
                    $('#showDataBtn').prop('disabled', true);
                }
                else {
                    populateFormFromFieldList(myfieldModalWidget.listmgr);
                    hideError("filterFieldsError");
                    $('#showDataBtn').prop('disabled', false);
                }
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


