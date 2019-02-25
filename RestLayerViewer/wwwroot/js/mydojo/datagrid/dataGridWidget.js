define([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/dataGridWidget.html"
], function (declare, dom, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        templateString: template,
        oid: "",
        title: 'View your data',
        url: "",

        constructor: function (layerUrl) {
            this.url = layerUrl;
        },

        fetchTable: function (fields) {
            // Fetch serviceUrl data and 
            // populate in an agGrid table element
            queryUrl = this.url.replace("?f=json", "");
            queryUrl += "/query?f=json&outFields=*&returnGeometry=false&spatialRel=esriSpatialRelIntersects&where=1=1"

            const columnDefs = [];
            for (let field of fields) {
                columnDefs.push({ headerName: field, field: field, sortable: true }); //, filter: true
            }

            const gridOptions = {
                defaultColDef: {
                    sortable: true
                },
                columnDefs: columnDefs,
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
        }
    });
});