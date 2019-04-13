define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_OnDijitClickMixin",
    "dojo/text!./templates/listModalWidget.html"
], function (declare, lang, dom, _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, template) {

    return declare("listModalWidget", [_WidgetBase, _OnDijitClickMixin, _TemplatedMixin], {
        templateString: template,
        listmgr: null,
        oid: "",
        title: 'add/hide fields from display',
        closeEvent: null,
        includeMinimum: true, // do not close if user has not at least included 1 item (true by default) 
        msg: 'click to add/remove items',

        constructor: function (/*Object*/ args) {
            lang.mixin(args);
            
        },

        _onClick: function (e) {
            this.loadFieldList();
            alert(e);
            console.log(this.value +  " " + this.id);
        },

       _includeAll: function () {
           var fieldList = this.listmgr.listObj;
           for (var key in fieldList) {
               if (fieldList.hasOwnProperty(key)) { // don't look at prototype key
                   fieldList[key] = 1;
               }
           }
           this.loadFieldList();
        },

        _excludeAll: function () {
            var fieldList = this.listmgr.listObj;
            for (var key in fieldList) {
                if (fieldList.hasOwnProperty(key)) { // don't look at prototype key
                    fieldList[key] = 0;
                }
            }
            this.loadFieldList();
        },
    
        loadFieldList: function () {
            var fieldList = this.listmgr.listObj;
            //update the items in the modal field box based on source change
            var includeItems = this.includeItems; //dom.byId("includeItems" + this.oid);
            var excludeItems = this.excludeItems; //dom.byId("excludeItems" + this.oid);
            includeItems.innerHTML = "";
            excludeItems.innerHTML = "";

            for (var key in fieldList) {
                if (fieldList.hasOwnProperty(key)) {
                    if (fieldList[key] === 1) {
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
            var fieldList = this.listmgr.listObj;
            console.log("fldKEywordCLick activated");
            if (fieldList[e.target.innerText] === 0) {
                fieldList[e.target.innerText] = 1;
            }
            else if (fieldList[e.target.innerText] === 1) {
                fieldList[e.target.innerText] = 0;
            }
            this.loadFieldList();
        },

        show: function () {
            dojo.style(this.baseClass + this.id, { 'display': 'block'});
        },

        _close: function (event) {

            // if includeMin property is true
            if (this.includeMinimum) {
                var includedFieldCount = this.listmgr.getSelectedItems().length;
                if (includedFieldCount === 0) {
                    alert("You must include at least 1 field");
                    event.preventDefault;
                    return;
                }
            }
            dojo.style(this.baseClass + this.id, { 'display': 'none' });
            this.closeEvent();  // execute function passed as parameter
        },

    });
});
