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
        return declare("datagrid.dataSource", null, {
            oid: 0,

            getRows: function (params) {
                // https://www.ag-grid.com/javascript-grid-infinite-scrolling/#getrows
                console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                var lastRow = -1;

                params.successCallback()
            }

            //optional destroy method, if your datasource has state it needs to clean up.
            destroy: function () {

            }