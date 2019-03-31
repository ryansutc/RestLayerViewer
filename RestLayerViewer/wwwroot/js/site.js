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
            "map/featureLayerInfo"
        ], function (parser, fieldmgr, listModalWidget, featureLayerInfo) {

            parser.parse(); // Let page load first.

            var myfieldModalWidget = new listModalWidget({
                title: 'Add/Remove Fields from Display',
                msg: 'will show only included fields here'
            }, 'listModalWidget');

            var myFLInfo = null; //FeatureLayerInfo. 

            if (serviceUrl) {
                // restore existing state:
                myfieldModalWidget.listmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));

                populateFormFromFieldList(myfieldModalWidget.listmgr);

                $('#showDataBtn').prop('disabled', false);
                $('#fieldsGroup').show();
            }

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
                var errorElementId = this.id + "Error";
                var url = this.value;

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
                }).catch((err) => {
                    addError(err, errorElementId);
                    $('#showDataBtn').prop('disabled', true);
                    $('#fieldsGroup').hide();
                });
            });

        });

    }
    else if (page === "Data") {
        require([
            'dojo/parser',
            'listmgr/listmgr',
            'datagrid/dataGridWidget'
        ], function (parser, fieldmgr, dataGridWidget) {
            parser.parse(); // Loading page

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
            'listmgr/listmgr'
        ], function (parser, map, fieldmgr) {
            if (allFieldsString) {
                var myFieldmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));
                selectedFields = myFieldmgr.getSelectedItems();
                var mymap = new map(serviceUrl, selectedFields);
                mymap.loadMap();
            }
        });
    }

});


