'use strict'

define([
    'dojo/_base/declare',
    'dojo/dom',
    'dojo/on',
    'dojo/dom-geometry',
    'dojo/ready',
    'dojo/parser',
    'dojo/dom-construct',

    "esri/Map",
    "esri/views/MapView",
    "esri/WebMap",
    'esri/layers/FeatureLayer',
    'esri/symbols/SimpleFillSymbol',
    'esri/tasks/support/Query',
    'esri/tasks/QueryTask',
    'esri/Color',
    'dgrid/OnDemandGrid',
    'dgrid/Selection',
    'dstore/Memory',
    'dojo/_base/array',
    'dijit/form/Button',
    'dijit/layout/BorderContainer',
    'dijit/layout/ContentPane',
    "dojo/fx/Toggler",
    "dojo/query",
    'dojo/domReady!'
],
    function (declare, dom, on, domGeom, ready, parser, domConstruct,
        Map, MapView, WebMap, FeatureLayer, SimpleFillSymbol,
        Query, QueryTask, Color, Grid, Selection, Memory, array,
        Button, BorderContainer, ContentPane, Toggler) {
        return declare("map.MyMap", null, {
            url: null,
            fields: null,
            basemap: null,
            mapViewContainer: null,
            layerType: "Feature Layer",


            constructor: function (url, fields, layerType) {
                this.url = url;
                this.fields = fields;
                this.basemap = "dark-gray-vector";
                this.mapViewContainer = "map";
                if (layerType) {
                    this.layerType = layerType;
                }
            },

            loadMap: function () {
                //create a map, mapview to hold map & add layer to map
                var map = new Map({
                    basemap: this.basemap //"satellite"
                });
                var view = new MapView({
                    container: this.mapViewContainer,
                    map: map
                });
                

                if (this.layerType !== "Feature Layer") {
                    throw "Error: Map does not support " + this.layerType + "s at this time";
                }
                var myLayer = this.myLayer;
                myLayer = new FeatureLayer(
                    this.url, {
                        outFields: this.fields
                    });

                map.add(myLayer);
                myLayer.when(function () {
                    view.extent = myLayer.fullExtent;
                });                
            },

            zoomPlace: function (item) {
                /*
                 * zoom to a single record (hide others). If no record specified,
                 * will just zoom to a random record.
                */

                var query = new Query();
                var newPlace = null;
                if (item === null) {
                    newPlace = items[Math.floor(Math.random() * items.length)];
                }
                else {
                    newPlace = item;
                }
                query.where = "OBJECTID = '" + newPlace.OBJECTID + "'";

                this.myLayer.defintionExpression = query;

                this.myLayer.queryExtent(query).then(function (response) {
                    view.when(function () {
                        view.center = response.extent.center;
                        view.zoom = 8;
                        view.goTo({
                            zoom: 9
                        },
                            {
                                duration: 2000,
                                easing: "ease-in-out"
                            }
                        );
                    });
                });
            }
            /*
            // do the shit
            window.onload = function () {
                
                console.log(fieldList);
                loadMap(myLayer, fieldList);
        
            }
            */

        });
});

