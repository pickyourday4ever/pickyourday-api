var async = require("async");
var C = require("../../config/config");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var AuthCtrl = require(C.ctrl + "auth.ctrl");
var EventCtrl = require(C.ctrl + "event.ctrl");
var PrePickCtrl = require(C.ctrl + "prePick.ctrl");
var CompanyCtrl = require(C.ctrl + "company.ctrl");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var CategoryCtrl = require(C.ctrl + "category.ctrl");
var CustomerModel = require(C.models + "customer");
var PickModel = require(C.models+"pick");
var PreferencesCtrl=require(C.ctrl+"preferences.ctrl");


var Utils = require(C.lib+"utils");
var Controller = {};



Controller.newUser = function (body, cb) { //datos del body, callback

    if (!body || !body.email || !body.password) return cb("Fields not Filled");

    var customer = new CustomerModel(body);
    customer.registerDate = new Date();
    customer.save(function (err, result) {
        if (err) return cb(err);

        cb(null, result);
    });
};

Controller.search = function (query, cb) {
    CustomerModel.search(query, function (err, customers) {
        if (err) return cb(err);

        if (!customers)
            return cb(null, "No users");

        cb(null, customers);

    });
};

Controller.findById = function (id, cb) {
    /*PickCtrl.formatDatePick("56bb6ba820120d102693281d", new Date(), 30, function(err, datePick){
         return cb(null, datePick);
    });*/

    


    CustomerModel.findById(id, function (err, customer) {
        if (err) return cb(err);
        if (!customer)
            return cb(null, "No user");

        return cb(null, customer);
    });
}

Controller.modify = function (id, body, cb) {

    if (!body || !id)
        return cb("Fields not filled");

    CustomerModel.modify(id, body, function (err) {
        if (err) return cb(err);
        cb();
    });
}

Controller.delete = function (id, cb) {

    if (!id) return cb("Fields not Filled");

    async.waterfall([
        function getCustomer(next) {
            CustomerModel.findOne({ _id: id }, function (err, customer) {

                if (err) return next(err);

                if (!customer)
                    return next(null, "No customer");


                next(null, customer);

            });
        }, function getPicks(customer, next){
            PickModel.find({id_customer:customer._id}, function(err, picks){
               next(null, customer, picks); 
            });
            
        },function deletePicks(customer, picks, next){
            
            if(picks &&picks.length>0){
               async.eachSeries(picks, function iterator(item, n){
                   item.remove(function(){
                       n();
                   });
                   
               }, function done(){
                   next(null, customer);
               });
            }else{
                next(null, customer);
            }
            
            
        },function unableAccess(customer, next) {

            AuthCtrl.UnableAccess(customer.email, function (err) {
                if (err) return next(err);
                next(null, customer);
            });

        }, function deleteCustomer(customer, next) {
            customer.remove(function (err) {
                if(err)return next();
                    next();
            });
        }

    ], function (err, data) {
        if (err) return cb(err);
        cb(null, "Customer deleted");
    });
};

Controller.searchThings = function(params, cb){
    params = Utils.filterParams(params);
    var things = {};
    things.prepicks = [];
    things.companies = [];
    things.services = [];

    var self =this;
    async.waterfall([ 
        function getDefaultName(callback) {
            var paramsTemp = {};
            paramsTemp.name = params.name;
            ServiceCtrl.searchServiceName(paramsTemp, function(err, default_names){
                if(err) return callback(err);
                callback(null, things, default_names);
            });
        }, function getServicesByDefaultName(things, names, callback){
             var paramsTemp = {};
             var idDefaultNames = [];
            if(names && names.length > 0)
                idDefaultNames = names.map(function(a){  
                    return a._id;
                }); 
            var paramsTemp = {};
            paramsTemp.idDefaultNames = idDefaultNames;  
            if(params.category != undefined && params.category  != '')
                paramsTemp.category = params.category;   
            ServiceCtrl.search(0,paramsTemp, function(err, services){                           
                if(err) return next(err);
                if(services != "Services not found")
                    things.services = services;
                callback(null, things);
            });
        }, function getCompaniesByCategory(things, callback){
            var paramsTemp = {};
            if(params.category !=undefined && params.category  != '')
                paramsTemp.category = params.category;
            paramsTemp.name = params.name;  
            paramsTemp.location = params.location;   
            things.params = paramsTemp;
            CompanyCtrl.search(paramsTemp, function(err, companies){
                if(err) return callback(err);
                if(companies !='No companies'){
                    for(var i=0; i<companies.length; i++)
                        things.companies.push(companies[i]);
                }
                callback(null, things);
            });
            
        }, function getCompaniesByKeywords(things, callback){
            var paramsTemp = {};
            if(params.category != undefined && params.category  != '')
                paramsTemp.category = params.category;
            paramsTemp.keywords = params.name;   
            paramsTemp.location = params.location; 
            if(things.companies != undefined && things.companies.length > 0){
                var idCompanies = things.companies.map(function(a){  
                    return a._id;
                });   
                paramsTemp.idCompanies = idCompanies; 
            }                      
            CompanyCtrl.search(paramsTemp, function(err, companies){
                if(err) return callback(err);
                 if(companies !='No companies')
                    for(var i=0; i<companies.length; i++){
                        if(companies[i] != null)
                            things.companies.push(companies[i]);                                     
                    }
                callback(null, things);
            });
        }
    

     ], function (err, data) {
        if (err) return cb(err);
        cb(null, data);
    });

    
};

//****************PICKS
Controller.searchPick = function (customer, params, cb) {
    params.id_customer = customer;
    PickCtrl.search(params, cb);
};

Controller.newPick = function (customer, params, cb) {
    params.id_customer = customer;
    PickCtrl.new(params, cb);
};

Controller.deletePick = function (id, cb) {
    PickCtrl.delete(id, cb);
};

Controller.getPickById = function (id, cb) {
    PickCtrl.findById(id, cb);
};

//***************EVENTS
Controller.searchEvent = function (customer, params, cb) {
    EventCtrl.search(customer, params, cb);
};

Controller.newEvent = function (customer, params, cb) {
    EventCtrl.new(customer, params, cb);
};

Controller.modifyEvent = function (customer, params, cb) {
    EventCtrl.modify(customer, params, cb);
};

Controller.deleteEvent = function (customer, params, cb) {
    EventCtrl.delete(customer, params, cb);
};

Controller.getEventById = function (customer, id, cb) {
    EventCtrl.findById(customer, id, cb);
};

//******************PREPICKS
Controller.searchPrePick = function (customer, params, cb) {
    PrePickCtrl.search(customer, params, cb);
};

Controller.deletePrePick = function (customer, params, cb) {
    PrePickCtrl.delete(customer, params, cb);
};

Controller.getPrePickById = function (customer, id, cb) {
    PrePickCtrl.findById(customer, id, cb);
};


//******************REVIEW
Controller.newReviewCompany = function (customer, params, cb) {
    CompanyCtrl.newReview(customer, params, cb);
};

Controller.newRateService = function (customer, params, cb) {
    CompanyCtrl.newRateService(customer, params, cb);
};


//*******************CATEGORY
Controller.searchCategory = function (params, cb) {
    CategoryCtrl.search(params, cb);
};


Controller.rollback = function (id) {
    CustomerModel.findById(id, function (err, customer) {
        customer.remove();
    });
};


//******************SEARCH
Controller.searchService = function (params, cb) {
    if (!params.id_company)
        ServiceCtrl.search(0, params, cb);
    else
        ServiceCtrl.search(params.id_company, params, cb);
};

Controller.getServiceById = function (params, id, cb) {
    if (!params || !params.id_company)
        return cb("Fields not filled");
    ServiceCtrl.findById(params.id_company, id, cb);
};

Controller.searchCompany = function (params, cb) {
    CompanyCtrl.search(params, cb);
};

Controller.getCompanyById = function (id, cb) {
    CompanyCtrl.findById(id, cb);
};



// PREFERENCES
Controller.getCustomPreferences=function(id, cb){
    CustomerModel.findById(id, function(err, customer){
        if(err)return cb(err);
        if(!customer)return cb("No customer");
        
        PreferencesCtrl.getPreferencesByCustomer(customer, cb);
        
    });
};

Controller.addOrUpdatePreferences=function(customer_id, pair, cb){
  
   async.waterfall([
       function add(next){
           CustomerModel.update(
               {_id:customer_id, 'preferences.question':{$ne:pair.question}},
               {$addToSet:{preferences:pair}}, function(err, result){
                if(err)return next(err);
             
                
                next(null, result.nModified);   
               });
       },function(modified,next ){
           if(modified===1)next();
               CustomerModel.update(
                   {_id:customer_id, "preferences.question":pair.question},
                   {$set:{"preferences.$":pair}},function(err){
                       if(err)return next(err);
                       next();
                   }
               );
           
       }
       
   ], function(err){
       if(err)return cb(err);
       cb(null, "Saved Preference");
   });
};

Controller.containsService = function(service_id, services){
        console.log(service_id);
    for(var i=0; i<services.length; i++){
        if(services[i].services._id == service_id)
            return true;
    }
    return false;
}



module.exports = Controller;