// global vars
var fieldList = []

function fetchServiceUrlFields(url, elementId) {
    // get the fields for the layer we're trying to fetch:
    // https://reqres.in/api/users?page=2
    // empty layer: https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/Ryan_test_Pts_HostedCopy/FeatureServer/0?f=pjson&token=AFMpl2Z4DZTuAAfxF_b6Edfi9nBVrvY0XaLiwMaAS2dXM418H2yhYQuXmIkioml-TaxHDpoLPVhpwQ-rT1zEu7QdnPSizIzMwEfcAVLaS8qBDDT6QWlKLemqDxaJdjJ1fvHOQPtuQ38rRyq4GNYU7HxOAMkYCtWh0WOrCBNGKoKzY4YyRXnBhuvJX0QPDF1wsjJFKppx7mYXjn2ggMDCYZHxKCahy_z7EtLNia10AA_HuRn-7W1RD0sx2vb3tsTV
    // https://services1.arcgis.com/fyyY0cNXvmUWvX1x/arcgis/rest/services/LFL_Database_TEST/FeatureServer/0
    if (url === "") {
        hideError(elementId);
        $('#fieldsGroup').hide();
        $('#showDataBtn').prop('disabled', true);
        return
    }
    fetch(url)
        .then(getJsonResponse)
        .then(function (data) {
            try {
                let fields = []
                for (let f of data.fields) {
                    fields.push([f.name, 1]);
                }
                // we got data so hide any error messages in form:
                hideError(elementId);
                return fields;
            }
            catch (err) {
                if (data.hasOwnProperty('layers')) {
                    // is this just a feature service?
                    throw Error("Looks like this is a Feature Service. You need to specify a feature layer from the service.")
                }
                throw Error("Could not retrieve field names from JSON. Is this a valid ArcGIS feature layer?");
            }
        })
        .then(newfields => fieldList = newfields)
        .then(function () {
            // show fields form element
            var hiddenFields = $('#allFields').val();
            $("#fieldsGroup").show();
            populateFormFromFieldList();
            $('#showDataBtn').prop('disabled', false);
        })
        .catch((err) => {
            addError(err, elementId);
            $('#showDataBtn').prop('disabled', true);
            $('#fieldsGroup').hide();
        });
}

function getSelectedFieldsString() {
    var selectedFieldsString = "";

    $.each(fieldList, function (index, value) {
        if (value[1] === "1") {
            selectedFieldsString += value[0] + ",";
        }
    });

    return selectedFieldsString.slice(0, -1);
}
function populateFormFromFieldList() {
    /*
     * convert fieldList to a string
     * to display in the form
     */
    var allFieldsString = "";
    var selectedString = "";
    var selectedFieldsString = "";
    $.each(fieldList, function (index, value) {
        allFieldsString += value[0] + ",";
        selectedString += value[1] + ",";
        if (value[1] == 1) {
            selectedFieldsString += value[0] + ", ";
        }
    });
    
    $('#selectedFields').text(selectedFieldsString.slice(0, -2));
    $('#allFields').val(allFieldsString.slice(0, -1));
    $('#selectedState').val(selectedString.slice(0, -1));

}

function populateFieldListFromStrings(allFields, selectedState) {
    /* 
     * Populate the fieldList array object
     * from the string values posted to the form
     */ 

    if (allFields != "") {
        var allFieldsArray = allFields.split(",");
        var selectedFieldsArray = selectedState.split(",");

        for (var i = 0; i < allFieldsArray.length; i++) {
            fieldList.push([allFieldsArray[i],
            selectedFieldsArray[i]]);
        }
    }
}

function fetchTableGrid(url, fields) {
    // Fetch serviceUrl data and 
    // populate in an agGrid table element

    const gridOptions = {
        defaultColDef: {
            sortable: true
        },
        columnDefs: fields,
        defaultColDef: {
            sortable: true
        }            
    };
    const eGridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(eGridDiv, gridOptions);

    fetch(url)
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            let features = []
            
            for (let a of data.features) {
                /*
                let row = {}
                for (field of fields) {
                    row[field.field] = a.attributes[field.field];
                }
                
                features.push(row)
                */
                features.push(a.attributes)
            }
            console.log(features)

            gridOptions.api.setRowData(features);
        })
}


function addError(msg, elementId) {
    /*
     * Add error to form element, called on element validate events
     */
    let errElem = document.getElementById(elementId);
    errElem.style.display = "block"
    let icon = '<span class="glyphicon glyphicon-warning-sign"></span>'
    errElem.innerHTML = icon + " " + msg
}

function hideError(elementId) {
    /*
     * Remove error from form element, called on element validate events
     */
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


function getRestFields(serviceUrl) {
    fetch(serviceUrl)
        .then(function (response) {
            return response.json();
        })
}


//populate modal box keyword list

$('#filterFields').click(function() {
    loadFieldList();
    $("#fieldsModal").modal("show");
});

function loadFieldList() {
    //update the items in the modal field box based on source change
    $('#includeFields').empty();
    $('#excludeFields').empty();
    for (i = 0; i < fieldList.length; i++) {
        if (fieldList[i][1] === 1) {
            $('#includeFields').append('<span class="fldKeyword label label-primary">' +
                fieldList[i][0] + '</span> ');
        }
        else {
            $('#excludeFields').append('<span class="fldKeyword label label-primary">' +
                fieldList[i][0] + '</span> ');
        }
    }
    $('#includeFields').append('<p><a id="includeAll">Include All </a></p>');
    $('#excludeFields').append('<p><a id="excludeAll">Exclude All </a></p>');
}

function loadDataTable(serviceUrl, fields) {
    queryUrl = serviceUrl.replace("?f=json", "");
    queryUrl += "/query?f=json&outFields=*&returnGeometry=false&spatialRel=esriSpatialRelIntersects&where=1=1"
    const columnDefs = [];
    for (let field of fields) {
        columnDefs.push({ headerName: field, field: field, sortable: true }); //, filter: true
    }
    
    //fetchServiceUrlFields(url, "serviceUrl")
    fetchTableGrid(queryUrl, columnDefs)
}

$(document).ready(function () {     

    $('#serviceUrl').focusout(function (event) {
        fetchServiceUrlFields(this.value, this.id + "Error")
    })

    // modal Box related stuff:
    $(document).on('click', '#includeAll', function (event) {
        for (var i = 0; i < fieldList.length; i++) {
            fieldList[i][1] = 1;
        }
        loadFieldList()
    });


    $(document).on('click', '#excludeAll', function (event) {
        for (var i = 0; i < fieldList.length; i++) {
            fieldList[i][1] = 0;
        }
        loadFieldList()
    });


    //handle click of keyword in modal box
    $(document).on('click', '.fldKeyword', function (event) {
        //alert(event.target.innerText);
        var indx = null;
        for (var i = 0; i < fieldList.length; i++) {
            if (fieldList[i][0] === event.target.innerText) {
                indx = i;
                break;
            }
        }
        if (fieldList[indx][1] === 0) {
            fieldList[indx][1] = 1;
        }
        else {
            fieldList[indx][1] = 0;
        }
        loadFieldList();
    });


    // handle keyword modal popup close
    $('.close').click(function (event) {
        populateFormFromFieldList()
        includedFieldCount = 0;
        for (let f of fieldList) {
            if (f[1] === 1) {
                includedFieldCount += 1;
            }
        }
        if (includedFieldCount === 0) {
            addError("You must include at least 1 field", "filterFieldsError");
            $('#showDataBtn').prop('disabled', true);
        }
        else {
            hideError("filterFieldsError");
            $('#showDataBtn').prop('disabled', false);
        }
    });

    //Global Things to do:
    populateFieldListFromStrings(allFieldsString, selectedStateString);

   // If Home Page Load, do this:
    if (page === "Home") {
        if (serviceUrl != "") {
            $('#showDataBtn').prop('disabled', false);
            $('#fieldsGroup').show();
            populateFormFromFieldList();
        }
    }
    else if (page === "Data") {
        selectedFields = getSelectedFieldsString();
        console.log(fieldList);
        loadDataTable(serviceUrl, selectedFields.split(","));
    } 
    else if(page == "Map") {

    }
        

    
})

