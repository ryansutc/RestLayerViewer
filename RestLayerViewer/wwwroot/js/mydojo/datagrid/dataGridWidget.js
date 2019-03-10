define([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/_WidgetBase",
    "esri/tasks/support/Query",
    "esri/tasks/QueryTask",
    "esri/layers/Layer",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/dataGridWidget.html"
], function (declare, dom, _WidgetBase, Query, QueryTask, Layer, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        templateString: template,
        oid: "",
        title: 'View your data',
        url: "",
        columnDefs: {},
        selectedFields: [],

        constructor: function (layerUrl, selectedFields) {
            this.url = layerUrl;
            this.fields = selectedFields;
            var fields = this.fields;

            this.columnDefs = [];
            for (let field of fields) {
                this.columnDefs.push({ headerName: field, field: field, sortable: true }); //, filter: true
            }
        },

        fetchTable: function (fields) {
            // Fetch serviceUrl data and 
            // populate in an agGrid table element
            queryUrl = this.url.replace("?f=json", "");
            queryUrl += "/query?f=json&outFields=*&returnGeometry=false&spatialRel=esriSpatialRelIntersects&where=1=1"

            const gridOptions = {
                defaultColDef: {
                    sortable: true
                },
                columnDefs: this.columnDefs,
                defaultColDef: {
                    sortable: true
                }
            };

            const eGridDiv = document.querySelector('#dataGridWidget' + this.oid);
            new agGrid.Grid(eGridDiv, gridOptions);

            fetch(queryUrl)
            .then(function(response) {
                return response.json();
            }).then(function (data) {
                let features = []

                for (let a of data.features) {
                    features.push(a.attributes)
                }

                gridOptions.api.setRowData(features);
            })
        },

        fetchTable2: function () {

            var gridOptions = {
                defaultColDef: {
                    sortable: true
                },
                columnDefs: this.columnDefs,
                //rowModelType: 'infinite',
                //paginationPageSize: 100,
                //cacheOverflowSize: 2,
                //maxConcurrentDatsourceRequests: 2,
                //infiniteInitialRowCount: 500,
                //maxBlocksInCache: 10
                defaultColDef: {
                    sortable: true
                }
            };
            const eGridDiv = document.querySelector('#dataGridWidget' + this.oid);
            new agGrid.Grid(eGridDiv, gridOptions);

            var query = new Query();
            var queryTask = new QueryTask(this.url);
            query.where = "1=1";   // get all records

            //Need to get the UniqueID field for the layer. It is not always ObjectID
            
            fetch(this.url)
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var uniqueIdField = data.objectIdField;
                    if (uniqueIdField == null) {
                        uniqueIdField = "ObjectID";
                    }
                    //https://dojotoolkit.org/documentation/tutorials/1.8/store_driven_grid/
                    queryTask.executeForIds(query).then(function (results) {
                        console.log("we got: " + results.length + " records");
                        console.log(uniqueIdField);

                        var low = 0;
                        while (low < results.length) {
                            high = low + 500;
                            if (high > results.length) {
                                high = results.length;
                            }

                            var sublist = results.slice(low, high);
                            query.where = uniqueIdField + " IN " + "(" + sublist.join(",") + ")";
                            console.log(query.where);
                            query.outFields = ["*"];
                            query.returnGeometry = false;
                            queryTask.execute(query)
                                .then(function (data) {
                                    var newRows = [];

                                    for (var i = 0; i < data.features.length; i++) {
                                        newRows.push(data.features[i].attributes);
                                    }
                                    var res = gridOptions.api.updateRowData({ add: newRows });
                                    //console.log(newRows);
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                            setTimeout(function () { }, 3000);
                            low += 500;
                        }
                    });
                });
        }
    });
});
