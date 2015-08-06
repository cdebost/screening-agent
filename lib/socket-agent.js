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
 * @module screening-agent
 * @author Corentin Debost
 */

var Montage = require("montage/core/core").Montage;

/**
 * @class SocketAgent
 */
var SocketAgent = Montage.specialize({
    /**
     * @private
     */
    constructor: {
        value: function SocketAgent() {
            this.super();
        }
    },

    /**
     * @public
     * @param {Socket} socket The websocket connection to the Screening server
     * @param {String} id The identifier assigned by the Screening server on instantiation
     */
    init: {
        value: function(socket, id) {
            this._socket = socket;
            this._id = id;

            this._setupListeners(socket);
        }
    },

    /**
     * @private
     */
    _socket: {
        value: null
    },

    /**
     * @private
     */
    _id: {
        value: null
    },

    /**
     * @private
     */
    _setupListeners: {
        value: function(socket) {
            socket.on("executeScript", function(script, args, callback) {
                var res = window.eval(script);

                if (typeof callback == "function") {
                    callback(res);
                }
            });

            socket.on("gotoUrl", function(url, callback) {
            });
        }
    }
});

/**
 * Used to interact with the application. Communicates via sockets to the Screening server.
 * @api private
 * @type {SocketAgent}
 */
exports.socketAgent = new SocketAgent();
