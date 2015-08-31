/* <copyright>
 Copyright (c) 2012, Motorola Mobility LLC.
 All Rights Reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * Neither the name of Motorola Mobility LLC nor the names of its
 contributors may be used to endorse or promote products derived from this
 software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 POSSIBILITY OF SUCH DAMAGE.
 </copyright> */
/**
 * A type of Agent that allows Screening semi-direct access to the app itself via websockets.
 * @module screening-agent
 * @author Corentin Debost
 */

var socketAgent = require("./lib/socket-agent").socketAgent;

/**
 * Setup the screening-agent. Should only be done once each time an app is run.
 * @function run
 * @param screening_origin The URL origin of the server (i.e. the location at which the control room is hosted)
 */
var run = exports.run = function(screeningOrigin) {
    if (!!run._initialized) {
        throw new Error("Attempted to re-initialize the Screening Agent. Initialization may only be performed " +
            "once per run");
    }

    loadSocketIO(screeningOrigin).then(function() {
        return;
    }).catch(function(err) {
        throw err;
    }).then(function() {
        initSocket(io, screeningOrigin);
    });

    run._initialized = true;
};

var loadSocketIO = function(screeningOrigin) {
    // Take out the tail slash
    if (screeningOrigin.substring(screeningOrigin.length-1) === "/") {
        screeningOrigin = screeningOrigin.substring(0, screeningOrigin.length-1);
    }

    var script = document.createElement("script");
        script.async = true;
        script.src = screeningOrigin + "/socket.io/socket.io.js";

    return new Promise(function(resolve) {
        script.addEventListener("load", function() {
            resolve();
        });
        script.addEventListener("error", function() {
            throw new Error("Unable to load the socket.io script at " + script.src);
        })

        document.getElementsByTagName("head")[0].appendChild(script);
    });
};

var initSocket = function(io, screeningOrigin) {
    var socket = io(screeningOrigin, { path: "/socket.io" });

    socketAgent.init(socket, screeningOrigin);
};



