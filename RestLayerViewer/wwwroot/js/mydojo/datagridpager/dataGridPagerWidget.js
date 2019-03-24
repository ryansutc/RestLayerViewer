define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/Stateful",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/dataGridPagerWidget.html"
], function (declare, dom, domConstruct, Stateful, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare("dataGridPagerWidget", [_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        templateString: template,
        oid: "",
        maxRecordsPerPage: 500,
        recordCount: null,
        _idLow: 0, //the start of records to fetch based on page
        _idHigh: 0, //the end of records to fetch based on page
        sortField: null,
        sortType: "ASC",  // can be ASC or DESC

        constructor: function (args) {
            // get maxRecordsPerPage
            if (args.recordCount == null) {
                throw "Error: No recordCount provided";
            }
            this.recordCount = args.recordCount;
            if (args.maxRecordsPerPage) this.maxRecordsPerPage = args.maxRecordsPerPage;
            if (args.sortField) this.sortField = args.sortField;
            if (args.sortType) this.sortType = args.sortType;
            this._idHigh = this.maxRecordsPerPage;
        },

        postCreate: function () {

        },

        _nextRecords: function (e) {
            //switch to next page
            dojo.removeClass("PrevRecords" + this.oid, "disabled");
            this._idLow += this.maxRecordsPerPage;
            this._idHigh += this.maxRecordsPerPage;
            if (this._idHigh >= this.recordCount) {
                this._idHigh = this.recordCount;
                //change Next button to normal text
                dojo.addClass("NextRecords" + this.oid, "disabled");
            }
        },

        _prevRecords: function (e) {
            //switch to prev page
            dojo.removeClass("NextRecords" + this.oid, "disabled");
            if (this._idHigh == this.recordCount) {
                this._idHigh = this._idLow - 1;
            }
            else {
                this._idHigh -= this.maxRecordsPerPage;
            }
            this._idLow -= this.maxRecordsPerPage;
            if (this._idLow < 0) {
                this._idLow = 0;
            }
            console.log("Prev was clicked!!!");

            if (this._idLow == 0) {
                dojo.addClass("PrevRecords" + this.oid, 'disabled');
            }
        }


    });
});
