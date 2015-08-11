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

/**
 * An emulation of the browser's TouchEvent that can be used as a regular event.
 * @param {String} type The type of event this is (touchdown, touchup, etc.)
 * @param {Object} params An object that contains initialization parameters for the event
 * @param {Boolean} params.bubbles
 * @param {Boolean} params.cancelable
 * @param {Object} params.target
 * @param {module:screening-agent.TouchList} params.touches A list of objects with parameters for constructing {@link module:screening-agent.Touch}es.
 * @param {module:screening-agent.TouchList} params.targetTouches A list of objects with parameters for constructing {@link module:screening-agent.Touch}es.
 * @param {module:screening-agent.TouchList} params.changedTouches A list of objects with parameters for constructing {@link module:screening-agent.Touch}es.
 */
var TouchEvent = exports.TouchEvent = function(type, params) {
    var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(type, params.bubbles, params.cancelable, 0);

        evt.altKey =  evt.ctrlKey = evt.metaKey = evt.shiftKey = false;
        evt.charCode = evt.keyCode = 0;
        evt.layerX = evt.layerY = 0;
        evt.pageX = evt.pageY = 0;
        evt.srcElement = evt.target = params.target;
        evt.view = window;
        evt.which = 0;

        evt.touches = TouchList.fromArray(params.touches || [], params.target);
        evt.targetTouches = TouchList.fromArray(params.targetTouches || [], params.target);
        evt.changedTouches = TouchList.fromArray(params.changedTouches || [], params.target);

    return evt;
};

/**
 * @class TouchList
 * @param touches An array of {@link module:screening-agent.Touch} objects.
 */
var TouchList = function(touches) {
    var self = this;

    if (touches) {
        touches.forEach(function(touch, index) {
            self[index] = touch;
        });
    }
};

TouchList.prototype = Object.create(Array, {
    item: {
        value: function(identifier) {
            this.forEach(function(touch) {
                if (touch.identifier === identifier) {
                    return touch;
                }
            });
            return null;
        }
    }
});

TouchList.fromArray = function(arr, target) {
    var identifier = 0;
    var touches = arr.map(function(obj) {
        return new Touch(identifier++, target, obj.screenX, obj.screenY, obj.clientX, obj.clientY,
            obj.pageX, obj.pageY);
    });
    return new TouchList(touches);
};

/**
 * @class module:screening-agent.Touch
 * @param identifier
 * @param target
 * @param screenX
 * @param screenY
 * @param clientX
 * @param clientY
 * @param pageX
 * @param pageY
 */
function Touch(identifier, target, screenX, screenY, clientX, clientY, pageX, pageY) {
    this.identifier = identifier;
    this.target = target || null;
    this.screenX = screenX || 0;
    this.screenY = screenY || 0;
    this.clientX = clientX || 0;
    this.clientY = clientY || 0;
    this.pageX = pageX || 0;
    this.pageY = pageY || 0;
}
