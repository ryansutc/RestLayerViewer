// global vars
var fieldList = {}
/**
* Parse ArcGIS REST Feature Layer JSON to
* get a list of field values returned as 
* an array
*/
function getFields(data) {

    try {
        let fields = []
        for (let f of data.fields) {
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
}

function getProj(data) {
    try {
        var wkid = data.extent.spatialReference.wkid;
        return wkid;
    }
    catch (err) {
        console.log(err);
    }
}
/**
 * Get ArcGIS Feature Layer REST Json with an async fetch call.
 * [todo] should probably switch this to an ArcGIS Javascript API call.
 * @param {string} url
 * @param {string} elementId
 */
function fetchServiceUrlJson(url, elementId) {
    // get the fields for the layer we're trying to fetch:
    // https://reqres.in/api/users?page=2
    // empty layer: https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/Ryan_test_Pts_HostedCopy/FeatureServer/0?f=pjson&token=AFMpl2Z4DZTuAAfxF_b6Edfi9nBVrvY0XaLiwMaAS2dXM418H2yhYQuXmIkioml-TaxHDpoLPVhpwQ-rT1zEu7QdnPSizIzMwEfcAVLaS8qBDDT6QWlKLemqDxaJdjJ1fvHOQPtuQ38rRyq4GNYU7HxOAMkYCtWh0WOrCBNGKoKzY4YyRXnBhuvJX0QPDF1wsjJFKppx7mYXjn2ggMDCYZHxKCahy_z7EtLNia10AA_HuRn-7W1RD0sx2vb3tsTV
    // https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/LFL_Database_TEST/FeatureServer/0

    return new Promise(function (resolve, reject) {
        fetch(url)
            .then(getJsonResponse)
            .then(function (data) {
                resolve(data)
            })
            .catch((err) => {
                return reject(err);
            });
    });
}
/**
 * Populate hidden form values from a
 * listmgr object instance.
 * 
 * Needed to send the data to server for other pages
 * @param {listmgr.listmgr} fldmgr
 */
function populateFormFromFieldList(fldmgr) {
    $('#selectedFields').text(fldmgr.getSelectedItemsAsText());
    $('#allFields').val(fldmgr.getAllItemsAsText());
    $('#selectedState').val(fldmgr.getSelectedStateAsText());

}

/**
 * Add an error message to a form element
 * @param {string} msg
 * @param {string} elementId
 */
function addError(msg, elementId) {
    let errElem = document.getElementById(elementId);
    errElem.style.display = "block"
    let icon = '<span class="glyphicon glyphicon-warning-sign"></span>'
    errElem.innerHTML = icon + " " + msg
}

/**
 * Remove error text from form element, called on element validate events
 * @param {string} elementId
 */
function hideError(elementId) {

    let errElem = document.getElementById(elementId);
    errElem.style.display = "none"
}


function getJsonResponse(response) {
    if (!response.ok) {
        throw Error(response.status + ": " + response.statusText);
    }
    try {
        return response.json()
    }
    catch (err) {
        throw Error("Invalid JSON. Is this really a REST endpoint?")
    }
}

//--------------------------------------
$(document).ready(function () {     
    /**
     * PAGE SPECIFIC LOGIC HERE:
     */

    if (page === "Home") {
        require([
            'dojo/parser',
            'map/mymap',
            'listmgr/listmgr',
            'listmgr/listModalWidget'
        ], function (parser, mymap, fieldmgr, listModalWidget) {
            
            parser.parse(); // Loading page
            
            var myfieldModalWidget = new listModalWidget({
                title: 'Add/Remove Fields from Display',
                msg: 'will show only included fields here'
            }, 'listModalWidget');
           
            if (serviceUrl) {
                // restore existing state:
                myfieldModalWidget.listmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));

                populateFormFromFieldList(myfieldModalWidget.listmgr);

                $('#showDataBtn').prop('disabled', false);
                $('#fieldsGroup').show();

                // Populate projection

                //load Feature Layer
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
                var url = this.value;
                var errorElementId = this.id + "Error" 
                if (url === "") {
                    hideError(errorElementId);
                    $('#fieldsGroup').hide();
                    $('#showDataBtn').prop('disabled', true);
                    return
                }

                fetchServiceUrlJson(url, this.id + "Error")
                    .then(function (data) {
                        myfieldModalWidget.listmgr = new fieldmgr(getFields(data), null);
                        populateFormFromFieldList(myfieldModalWidget.listmgr);
                        hideError(errorElementId);
                        // show fields form element
                        $("#fieldsGroup").show();
                        $('#showDataBtn').prop('disabled', false);

                        $('#coordName').text("wkid:" + getProj(data).toString());
                        $('#coordInfo').attr("href", "//spatialreference.org/ref/epsg/" + getProj(data) + "/html/");

                    })
                    .catch((err) => {
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
                var fieldmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));
                selectedFields = fieldmgr.getSelectedItems();
                var dataGrid = new dataGridWidget({
                    url: serviceUrl, selectedFields: selectedFields
                }, 'dataGridWidget');
                //dataGrid.fetchData();
                //dataGrid.fetchTable(selectedFields);
                $('#statusMsg').text("");

                //$('#button12').click(dataGrid.fetchTable2(selectedFields));
            }
        });
    } 
    else if (page == "Map") {
        require([
            'dojo/parser',
            'map/mymap',
            'listmgr/listmgr'
        ], function (parser, mymap, fieldmgr) {
            if (allFieldsString) {
                var fieldmgr = new fieldmgr(allFieldsString.split(","), selectedStateString.split(","));
                selectedFields = fieldmgr.getSelectedItems();
                var mymap = new mymap(serviceUrl, selectedFields);
                mymap.loadMap()
            }
        });
    }
        

    
})


