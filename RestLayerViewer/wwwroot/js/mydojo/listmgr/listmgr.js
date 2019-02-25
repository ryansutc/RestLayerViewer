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
                    if (this.listObj[i] == 1) {
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

            getAllItemsAsText: function () {
                return this.getAllItems().toString();
            },

            getSelectedItemsAsText: function () {
                return this.getSelectedItems().toString();
            },

            getSelectedStateAsText: function () {
                return this.getSelectedState().toString();
            }



        })
});


