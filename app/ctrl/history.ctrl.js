var async = require("async");
var C = require("../../config/config");
var HPick = require(C.models + "history_pick");
var HPromotion = require(C.models + "history_promotion");
//var HEvent = require(C.models + "history_customer");
//var HEvent = require(C.models + "history_company");

var _=require("lodash");
var Utils = require(C.lib + "utils");
var Controller = {};

Controller.savePick = function(pick, cb){
	if(!pick) return cb([]);

	var pick = new HPick(body);
    pick.save(function (err) {
        if (err) return cb(err);
        cb(null, []);       
    });
};

Controller.savePromotion = function(promotion, cb){
	
};





module.exports = Controller;