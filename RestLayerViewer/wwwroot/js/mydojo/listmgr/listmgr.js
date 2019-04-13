'use strict'

define([
    'dojo/_base/declare',
    'dojo/domReady!'
],
    function (declare) {
        return declare("listmgr.listmgr", null, {
            listObj: null,

            constructor: function (allvals, selectedState = null) {
                this.listObj = {};

                for (let i = 0; i < allvals.length; i++) {
                    if (selectedState) {
                        this.listObj[allvals[i].trim()] = parseInt(selectedState[i]);
                    }
                    else {
                        this.listObj[allvals[i].trim()] = 1;
                    }
                }
            },

            getAllItems: function () {
                var items = [];
                for (var i in this.listObj) items.push(i);
                return items;
            },

            getSelectedItems: function () {
                var selItems = [];
                for (var i in this.listObj) {
                    if (this.listObj[i] === 1) {
                        selItems.push(i);
                    }
                }
                return selItems;
            },

            getSelectedState: function () {
                var selState = [];
                for (var state in this.listObj) {
                    selState.push(this.listObj[state]);
                }
                return selState;
            },

            getAllItemsAsText: function (spacer) {
                if (!spacer) {
                    spacer = " ";
                }
                var s = "";
                var allItems = this.getAllItems();
                for (var i in allItems) {
                    s += allItems[i] + spacer;
                }
                return s;
            },

            getSelectedItemsAsText: function (spacer) {
                if (!spacer) {
                    spacer = " ";
                }
                var s = "";
                var selItems = this.getSelectedItems();
                for (var i in selItems) {
                    s += selItems[i] + spacer;
                }
                return s;
            },

        })
});


