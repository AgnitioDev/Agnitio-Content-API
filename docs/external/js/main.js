"use strict";

var startExample = function() {
    var libNameSelector = '#lib-name',
        libVersionSelector = '#lib-version',
        btnFinishInteractionSelector = '#btn-finish-interaction',
        meetingIdSelector = '#meeting-id',
        meetingCrmIdSelector = '#meeting-crm-id',
        meetingStartDatetimeSelector = '#meeting-start-datetime',
        meetingEndDatetimeSelector = '#meeting-end-datetime',
        callFieldIdSelector = '#call-field-id',
        presentationsSelector = '#presentations',
        contactsSelector = '#contacts',
        libNameElement = libNameSelector ? document.querySelectorAll(libNameSelector)[0] : null,
        libVersionElement = libVersionSelector ? document.querySelectorAll(libVersionSelector)[0] : null,
        btnFinishInteractionElement = btnFinishInteractionSelector ? document.querySelectorAll(btnFinishInteractionSelector)[0] : null,
        params = parseQuery(document.location.search),
        elem;

    if (libNameElement) {
        libNameElement.innerHTML = window.agExternal && window.agExternal.getName ? window.agExternal.getName() : "-";
    }
    if (libVersionElement) {
        libVersionElement.innerHTML = window.agExternal && window.agExternal.getVersion ? window.agExternal.getVersion() : "-";
    }
    if (btnFinishInteractionElement) {
        btnFinishInteractionElement.onclick = function (e) {
            e.preventDefault();

            if (!window.agExternal || !window.agExternal.markInteractionAsCompleted) {
                alert('agnitioExternal.js is missing');

                return false;
            }
            window.agExternal.markInteractionAsCompleted();
            
            return false;
        }
    }

    displayParam('meeting_id', meetingIdSelector);
    displayParam('meeting_crm_id', meetingCrmIdSelector);
    displayParam('meeting_start_datetime', meetingStartDatetimeSelector);
    displayParam('meeting_end_datetime', meetingEndDatetimeSelector);
    displayParam('call_field_id', callFieldIdSelector);
    displayParam('presentations', presentationsSelector);
    displayParam('contacts', contactsSelector);

    function displayParam (paramName, elemSelector) {
        if (!paramName || !params.hasOwnProperty(paramName) || !elemSelector) {
            return false;
        }
        var elem = document.querySelectorAll(elemSelector)[0];

        if (!elem) {
            return false;
        }
        elem.innerHTML = params[paramName];

        return true;
    }

    function parseQuery (query) {
        var params = {},
            tmp = (query[0] === '?' ? query.substr(1) : query).split('&'),
            i,
            l,
            tmp0;

        for (i = 0, l = tmp.length; i < l; i++) {
            tmp0 = tmp[i].split('=');

            if (tmp0[0].length > 0) {
                params[decodeURIComponent(tmp0[0])] = decodeURIComponent(tmp0[1] || '');
            }
            params
        }
        return params;
    }
};

startExample();
