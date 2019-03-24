define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/Stateful",
    "dojo/on",
    "dijit/_WidgetBase",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dstore/Memory",
    "esri/tasks/support/Query",
    "esri/tasks/QueryTask",
    "esri/layers/Layer",
    "dijit/_Container",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "datagridpager/dataGridPagerWidget",
    "dojo/text!./templates/dataGridWidget.html"
], function (declare, dom, domConstruct, Stateful, on, _WidgetBase, Grid, Selection, Memory, Query, QueryTask, Layer, _Container, _TemplatedMixin, _OnDijitClickMixin, PagerWidget, template) {

    return declare("dataGridWidget", [_WidgetBase, _OnDijitClickMixin, _Container, _TemplatedMixin], {
        templateString: template,
        oid: "",
        title: 'View your data',
        url: "",
        columnDefs: [],
        selectedFields: [],
        uniqueIdField: null,
        pagerWidget: null,
        _idList: [], //a complete list of Ids for the data

        constructor: function (args) {
            if (!args.url && !args.selectedFields) {
                throw "Error: dataGridWidget requires a url and selectedFields";
            }
            this.url = args.url;
            this.selectedFields = args.selectedFields;
           
            // create columnDefs
            this.columnDefs = [];
            for (let field of this.selectedFields) {
                this.columnDefs.push({ "id": field, "field": field, "label": field, sortable: true });
            }
        },

        postCreate: function () {
            var grid = this.createGridTable();

            //console.log(this.uniqueIdField);
            this._uniqueIdFieldGetter().then((id) => {
                this.uniqueIdField = id;
                var query = this._defaultQuery(id);
                query.where = "1=1";

                this.fetchIdList(query).then((idList) => {
                    this._idList = idList;
                    recordCount = idList.length;
                    if (recordCount > 500) {
                        //enable pages
                        this.pagerWidget = new PagerWidget({
                            "maxRecordsPerPage": 500,
                            "recordCount": recordCount,
                            "sortField": this.uniqueIdField
                        });
                        this.addChild(this.pagerWidget);

                        // try to listen for click events on child widget/ is element created yet?
                        var fetchRecs = function (e) {
                            this.fetchRecords(this.pagerWidget.sortField, this.pagerWidget.sortType).then((data) => {
                                this.updateGridTable(grid, data);
                            });
                        };
                        on(dom.byId("PrevRecords" + this.pagerWidget.oid),
                            "click",
                            fetchRecs.bind(this)
                        );
                        on(dom.byId("NextRecords" + this.pagerWidget.oid),
                            "click",
                            fetchRecs.bind(this)
                        );
                        //this.addPagination();
                        this.fetchRecords(this.uniqueIdField, this.pagerWidget.sortType).then((data) => {
                            this.updateGridTable(grid, data);
                        });
                    }
                });
            });
        },

        _defaultQuery: function (uniqueIdField) {
            var query = new Query();
            query.returnGeometry = false;
            query.outFields = this.selectedFields;
            query.where = "1=1"; // for now, grab everything!
            return query;
        },

        _uniqueIdFieldGetter: function () {

            if (this.uniqueIdField) {
                return new Promise(function (resolve, reject) {
                    resolve(this.uniqueIdField);
                })
                    .catch(function (err) {
                        reject(err);
                    });
            }
            else {
                return fetch(this.url)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (data) {
                        var uniqueIdField = data.objectIdField;
                        if (uniqueIdField == null) {
                            uniqueIdField = "ObjectID";
                        }
                        return uniqueIdField;
                    })
                    .catch(function (err) {
                        throw err;
                    });
            }
        },

        _uniqueIdFieldSetter: function () {
            throw "Error, cannot set readonly property uniqueIdField";
        },

        getColWidth: function (colName) {
            return 2 + (colName.length * 1);
        },

        fetchIdList: function(query) {
            return new Promise((resolve, reject) => {
                var queryTask = new QueryTask({
                    url: this.url
                });
                queryTask.executeForIds(query).then((ids) => {
                    resolve(ids);
                })
                    .catch((err) => {
                        console.log(err);
                        throw err;
                    })
            });
        },

        fetchData: function () {
            var fields = this.selectedFields;
            var columnDefs = this.columnDefs;
            var getColWidth = this.getColWidth;

            var queryTask = new QueryTask({
                url: this.url
            });

            this._uniqueIdFieldGetter().then((uniqueIdField) => {
                
            
                var query = new Query();
                query.returnGeometry = false;
                query.outFields = this.selectedFields;
                query.where = "1=1"; // for now, grab everything!
                query.orderByFields = [uniqueIdField + " DESC"];
                
                //query.resultType = "standard";
                queryTask.execute(query).then(function (results) {
                    //console.log(results.features);
                    var data = [];
                    for (var feature of results.features) {
                        record = {}
                        Object.keys(feature.attributes).forEach(function (key, index) {
                            record[key] = feature.attributes[key]
                        });
                        data.push(record);    
                    };
                    
                });
            });
        },

        addPagination: function () {
            var pageNode = domConstruct.create("div",
                {
                    id: "page",
                    innerHTML: "<a href='#'>View More</a>",
                    onClick: "_nextPageClick()"
                },
                "dataGridWidget" + this.oid);
            this.pageInfo = {}
        },

        createGridTable: function () {
            //create the dgrid:
            var grid = new Grid({
                //collection: memStore,
                loadingMessage: 'Loading data...',
                noDataMessage: 'No results found.',
                bufferRows: 30,
                autoWidth: true,
                columns: this.columnDefs
            }, "grid");
            grid.startup();
            for (var field of this.selectedFields) {
                grid.styleColumn(field.toUpperCase(), "width:" + this.getColWidth(field) + "em;");
            }

            grid.on('dgrid-error', function (event) {
                // Display an error message above the grid when an error occurs.
                console.log("Error " + event.error.message);
                console.log("Woah, something went wrong and Dgrid threw an error");
            });

            grid.on('.dgrid-refresh-complete', function (event) {
                alert("I have completed!")
            });

            return grid;
        },

        updateGridTable(grid, data) {
            var memStore = new Memory({ data: data, idProperty: this.uniqueIdField });
            grid.set("collection", memStore);
            grid.startup();
        },

        fetchRecords: function (orderBy, orderType) {
            return new Promise((resolve, reject) => {
                var sublist = this._idList.slice(this.pagerWidget._idLow, this.pagerWidget._idHigh);

                var query = new Query();
                query.returnGeometry = false;
                query.outFields = this.selectedFields;
                query.where = this.uniqueIdField + " IN " + "(" + sublist.join(",") + ")";
                query.orderByFields = [orderBy + " " + orderType];

                var queryTask = new QueryTask({
                    url: this.url
                });

                queryTask.execute(query)
                    .then(function (data) {
                        var newRows = [];

                        for (var i = 0; i < data.features.length; i++) {
                            newRows.push(data.features[i].attributes);
                        }
                        resolve(newRows);
                    })
                    .catch((err) => {
                        console.log(err);
                        throw err;
                    });
            });
        }
    });
});
