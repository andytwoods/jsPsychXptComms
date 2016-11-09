var computer_info = function(decoroate){
    var info = {}
    info['resX'] = window.screen.availWidth
    info['resY'] = window.screen.availHeight
    info['DPI'] = window.devicePixelRatio
    info['timeZone'] = new Date().getTimezoneOffset()

    return info
}


