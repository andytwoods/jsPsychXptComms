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

    var api = {}
    api.specialTag = specialTag
    var mandatory = {
        expt_id: specialTag + params['expt_id']
    }

    //defining special trial data
    ///////
    var first_trial = {
        course_id: '',
        user_id: '',
        client_ip: '',
        overSJs: '',
        user: '',
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

    function trial_data(data, callback){
        if(first_send==false){
            first_send = true
            addRequired(data, first_trial)
        }
        transmit(data, callback)

    }

    function end_study_data(data, callback){
        addRequired(data, last_trial)
        transmit(data, callback)
    }

    function addRequired(orig, extra){
        for(key in extra){
            if(orig.hasOwnProperty(key)) throw 'devel err: required field ' + key + ' overwritten'
            orig[key] = extra[key]
        }
    }

    function transmit(data, callback){
        addRequired(data, mandatory)

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
                        callback(data['status'], data);
                    }
                },
                error: function (jqXHR, error, errorThrown) {
                    if (callback)    callback('fail');
                }
            });
        }, 0);

    }


    return api;
})


