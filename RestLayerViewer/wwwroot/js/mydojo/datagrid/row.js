'use strict'

define([
    'dojo/_base/declare',
    'dojo/dom',
    'dojo/on',
    'dojo/ready',
    'dojo/parser',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dijit/form/Button',
    'dojo/domReady!'
],
    function (declare, dom, on, ready, parser, domConstruct,
        array, Button) {
        return declare("datagrid.row", null, {

            //https://www.ag-grid.com/javascript-grid-infinite-scrolling/#getrows
            oid: 0,
            startRow: 0,
            endRow: 0,
            sortModel: null,
            filterModel: null,
            context: null,

            //Callback to call when the request is successful
            successCallback: function (rowsThisBlock, lastRow) {
                // rowsThisBlock: rows you recieved from server
                //last row: index of last row if known
                console.log("the data was successfully downloaded.")
                return null;
            },

            failCallback: function () {

            }

