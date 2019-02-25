define([
    "dojo/_base/declare",
    "dojo/dom",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/listModalWidget.html"
], function (declare, dom, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        templateString: template,
        listmgr: null,
        oid: "",
        title: 'add/hide fields from display',

        msg: 'click to add/remove items',

        _onClick: function (e) {
            this.loadFieldList();
            alert(e);
            console.log(this.value +  " " + this.id);
        },

        _onGo: function () {
            if (this.listmgr) {
                console.log(this.listmgr);
            }
            else {
                console.log("you don't have a listmgr yet");
            }
        },

       _includeAll: function () {
           var fieldList = this.listmgr.getAllItems();
            for (var i = 0; i < fieldList.length; i++) {
                fieldList[i][1] = 1;
            }
            loadFieldList()
        },

        _excludeAll: function () {
            var fieldList = this.listmgr.getAllItems();
            for (var i = 0; i < fieldList.length; i++) {
                fieldList[i][1] = 0;
            }
            loadFieldList()
        },
    
        loadFieldList: function () {
            fieldList = this.listmgr.listObj;
            //update the items in the modal field box based on source change
            var includeItems = dom.byId("includeItems" + this.oid);
            var excludeItems = dom.byId("excludeItems" + this.oid);

            includeItems.innerHTML = '<p><a id="includeAll" data-dojo-attach-point="_includeAll">Include All </a></p>';
            excludeItems.innerHTML = '<p><a id="excludeAll" data-dojo-attach-point="_excludeAll">Exclude All </a></p>';

            for (var key in fieldList) {
                if (fieldList.hasOwnProperty(key)) {
                    if (fieldList[key] == 1) {
                        dojo.create("span", {
                            class: "fldKeyword label label-primary",
                            innerHTML: key
                        }, includeItems);
                        dojo.create("span", {
                            innerHTML: " "
                        }, includeItems);
                    }
                    else {
                        dojo.create("span", {
                            class: "fldKeyword label label-primary",
                            innerHTML: key
                        }, excludeItems);
                        dojo.create("span", {
                            innerHTML: " "
                        }, excludeItems);
                    }
                }

            }
        },

        _fldKeywordClick: function (e) {
            if (fieldList[e.target.innerText] == 0) {
                fieldList[e.target.innerText] = 1
            }
            else if (fieldList[e.target.innerText] == 1) {
                fieldList[e.target.innerText] = 0
            }
            this.loadFieldList();
        },

        show: function () {
            dojo.style(this.baseClass + this.id, { 'display': 'block'});
        },

        _close: function () {
            
            dojo.style(this.baseClass + this.id, { 'display': 'none' });
        },

    });
});
