var ExperimentComms = (function(params){
    var specialTag = 'info_'

    //constants
    var LAST_TRIAL = specialTag + 'last'
    var FIRST_TRIAL = specialTag + 'first'
    var SPECIAL_ID = specialTag + 'special'
    ///////
    ///////

    //verify we've all necessary params
    if(params == null) throw('devel err')
    check_legal(params,['expt_id', 'backend_url'],[], 'required parameter in ExperimentComms not present' )
    ///////
    ///////
    var jsPsyc_instance
    var backend_url = params['backend_url']
    var first_send = false
    var uuid = generateUUID()

    var api = {}
    api.specialTag = specialTag
    var mandatory = {}
    mandatory[specialTag+'expt_id'] = params['expt_id']
    mandatory[specialTag+'uuid'] = uuid

    //defining special trial data
    ///////
    var first_trial = {
        course_id: '',
        user_id: '',
        client_ip: '',
        overSJs: '',
        user: ''
    }
    first_trial[SPECIAL_ID] = FIRST_TRIAL
    api.extra_info = function(info, decorate){

        var decorateStr
        if(typeof(decorate) === "boolean" && decorate==true) decorateStr = specialTag
        else decorateStr = ''

        for(var key in info){
            if(first_trial.hasOwnProperty(decorateStr+key)==true) throw 'devel err'
            first_trial[decorateStr+key] = info[key]
        }
    }

    var last_trial = {}
    last_trial[SPECIAL_ID] = LAST_TRIAL
    ///////
    ///////

    function check_legal(arr, required, illegal, err){
        var item
        var my_i
        for( my_i in required ){
            item = required[my_i]
            if(arr.hasOwnProperty(item)==false){
                if(err == undefined) err = 'illegal item in object'
                throw(err + ': ' + item)
            }
        }
        for(my_i in illegal ){
            item = illegal[my_i]
            if(arr.hasOwnProperty(item)==true){
                if(err == undefined) err = 'illegal item in object'
                throw(err + ': ' + item)
            }
        }
    }

    api.wireup = function(_jsPsyc, jsPsyc_params){
        jsPsyc_instance = _jsPsyc
        check_legal(jsPsyc_params, [], ['on_finish', 'on_trial_finish'], 'blocked param in jsPsyc_params' )

        jsPsyc_params['on_finish'] = end_study_data
        jsPsyc_params['on_trial_finish'] = trial_data

        jsPsyc_instance.init(jsPsyc_params)
    }

    function generateUUID(){
        var d = new Date().getTime();
        if(window.performance && typeof window.performance.now === "function"){
            d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    function label_data(data, label){
        var labelled_data = {}
        for(var key in data){
            labelled_data[label + "_" + key] = data[key]
        }
        return labelled_data
    }

    function trial_data(data, callback) {
        var labelled_data = label_data(data, data['internal_node_id'])
        if (first_send == false) {
            first_send = true
            add(labelled_data, first_trial)
        }
        transmit(labelled_data, callback)
    }

    function end_study_data(data, callback){
        data = {} //data transmitted over study already and held in backup in case of failure & retransmitted on next trial
        add(data, last_trial)
        var extra = {}
        extra[specialTag+'duration'] = jsPsyc_instance.totalTime() / 1000
        add(data, extra)
        transmit(data, callback)
    }

    function add(orig, extra){
        for(var key in extra){
            if(orig.hasOwnProperty(key)) throw 'devel err: required field ' + key + ' overwritten'
            orig[key] = extra[key]
        }
    }

    function transmit(data, callback){
        add(data, mandatory)
        add(data, data_sendFailure_backup.get()) // add data to backup that failed to send previously
        window.setTimeout(function () {
            $.ajax({
                url: backend_url,
                type: 'post',
                async: true,
                data: data,
                beforeSend: function (xhr) {
                    //xhr.setRequestHeader("X-CSRFToken", $.cookie("csrftoken"));
                },
                success: function (data) {
                    if (callback) {
                        callback(data['status'], data)
                    }
                },
                error: function (jqXHR, error, errorThrown) {
                    if (callback) {
                        data_sendFailure_backup(data)
                        callback('fail') // add data that failed to send to backup
                    }
                }
            })
        }, 0)

    }
    return api
})


var data_sendFailure_backup = (function(){
    var api = {}
    var my_data ={}

    api.add = function(data){
        for(var key in data){
            if(my_data.hasOwnProperty(key) == true)
                throw('Request to add to datarepo. Data repo already has data col: '+key)
            my_data[key] = data[key]
        }
    }

    api.get = function(){
        var my_data_copy = {}
        for(var key in my_data){
            my_data_copy[key] = my_data[key]
        }
    }

    api.remove = function(data){
        for(var key in data){
            if(my_data.hasOwnProperty(key) == false)
                throw('Request to remove from datarepo. data repo does not have data col: '+key)
            delete my_data[key]
        }
    }

    return api
}())

