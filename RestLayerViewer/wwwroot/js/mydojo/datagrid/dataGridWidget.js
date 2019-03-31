define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/Stateful",
    "dojo/on",
    "dojo/_base/lang",
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
    "map/featureLayerInfo",
    "datagridpager/dataGridPagerWidget",
    "dojo/text!./templates/dataGridWidget.html"
], function (declare, dom, domClass, domConstruct, Stateful, on, lang, _WidgetBase, Grid, Selection, Memory, Query, QueryTask, Layer, _Container,
    _TemplatedMixin, _OnDijitClickMixin, featureLayerInfo, PagerWidget, template) {

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
        layerInfo: null,

        constructor: function (args) {
            if (!args.url && !args.selectedFields) {
                throw "Error: dataGridWidget requires a url and selectedFields";
            }
            this.url = args.url;
            this.selectedFields = args.selectedFields;
            this.layerInfo = new featureLayerInfo({ url: this.url });
            // create columnDefs
            this.columnDefs = [];
            for (let field of this.selectedFields) {
                this.columnDefs.push({ "id": field, "field": field, "label": field, sortable: true });
            }
        },

        postCreate: function () {
            var grid = this.createGridTable();

            //add our custom event listeners to the columns if the table is paged:

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
                                this.updateGridTable(grid, data, "Paged");
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
                        //----------------------

                        
                        this.fetchRecords(this.uniqueIdField, this.pagerWidget.sortType).then((data) => {
                            this.updateGridTable(grid, data, "Paged");
                        });

                        //NEW: test to see if we can hook into dgrid sort function
                        var sortData = function (event) {
                            // [todo: need a reset function in pagerWidget class]
                            this.pagerWidget.resetPage();
                            this.pagerWidget.sortField = event.sort[0].property;
                            this.pagerWidget.sortType = event.sort[0].descending ? "DESC" : "ASC";

                            grid.updateSortArrow(event.sort, true);
                            //var order = th
                            console.log("haha I was sorted!");
                            event.preventDefault();
                            this.fetchIdList(this._defaultQuery(this.pagerWidget.sortField, this.pagerWidget.sortType)).then((idList) => {
                                this._idList = idList;
                                this.fetchRecords(this.pagerWidget.sortField, this.pagerWidget.sortType).then((data) => {
                                    this.updateGridTable(grid, data);
                                });
                            });
                        };

                        grid.on('dgrid-sort', lang.hitch(this, sortData));
                    }
                    else {
                        this.fetchRecords().then((data) => {
                            this.updateGridTable(grid, data, "Simple");
                        });
                    }
                });
            });

            
        },

        _defaultQuery: function (orderField, orderType) {
            var query = new Query();
            query.returnGeometry = false;
            query.outFields = this.selectedFields;
            if (orderType) {
                query.orderByFields = [orderField + " " + orderType];
            }
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
                return this.layerInfo.fetchLayerInfo().then(function (data) {
                    var uniqueIdField = data.data.objectIdField;
                    if (uniqueIdField == null) {
                        uniqueIdField = "ObjectID";
                    }
                    return uniqueIdField;
                });
              
            }
        },

        _uniqueIdFieldSetter: function () {
            throw "Error, cannot set readonly property uniqueIdField";
        },

        getColWidth: function (colName) {
            return 2 + colName.length * 1;
        },

        fetchIdList: function(query) {
            return new Promise((resolve, reject) => {
                var queryTask = new QueryTask({
                    url: this.url
                });
                queryTask.executeForIds(query).then((ids) => {
                    console.log("first ID is now " + ids[0]);
                    resolve(ids);
                })
                    .catch((err) => {
                        console.log(err);
                        throw err;
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
            this.pageInfo = {};
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
                var colWidth = Math.max(this.getColWidth(field), 6);
                grid.styleColumn(field, "width:" + colWidth + "em;");
            }

            grid.on('dgrid-error', function (event) {
                // Display an error message above the grid when an error occurs.
                console.log("Error " + event.error.message);
                console.log("Woah, something went wrong and Dgrid threw an error");
            });

            grid.on('.dgrid-refresh-complete', function (event) {
                alert("I have completed!");
            });

            return grid;
        },

        updateGridTable: function (grid, data, storeType) {
            var memStore = null;
            if (storeType === "Paged") {
                var customMemStore = declare([Memory], {
                    sort: function (sorted) {
                        sorted = [];//Prevent the collection from sorting the data
                        return this.inherited(arguments);
                    }
                });
                memStore = new customMemStore({ data: data, idProperty: this.uniqueIdField });
            }
            else {
                memStore = new Memory({ data: data, idProperty: this.uniqueIdField });
            }

            grid.set("collection", memStore);

        },

        fetchRecords: function (orderBy, orderType) {
            return new Promise((resolve, reject) => {
                

                var query = new Query();
                query.returnGeometry = false;
                query.outFields = this.selectedFields;
                if (this.pagerWidget !== null) {
                    var sublist = this._idList.slice(this.pagerWidget._idLow, this.pagerWidget._idHigh);
                    query.where = this.uniqueIdField + " IN " + "(" + sublist.join(",") + ")";
                }
                else {
                    query.where = "1=1";
                }
                if (orderBy && orderType) {
                    query.orderByFields = [orderBy + " " + orderType];
                }

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
