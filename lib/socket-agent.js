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

var Montage = require("montage/core/core").Montage,
    TouchEvents = require("./touch-events");

var ElementTracker = Object.create(Object, {
    _elements: {
        value: {}
    },

    addElement: {
        value: function(selector, element) {
            this._elements[selector] = element;
        }
    },

    getElement: {
        value: function(selector) {
            return this._elements[selector];
        }
    }
});

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

            this._elementTracker = Object.create(ElementTracker);

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
            socket.on("refresh", this._refresh.bind(this));
            socket.on("executeScript", this._executeScript.bind(this));
            socket.on("gotoUrl", this._gotoUrl.bind(this));

            socket.on("element", this._element.bind(this));
            socket.on("element::getAttribute", this._element_getAttribute.bind(this));
            socket.on("element::setAttribute", this._element_setAttribute.bind(this));
            socket.on("element::getInnerText", this._element_getInnerText.bind(this));
            socket.on("element::getScroll", this._element_getScroll.bind(this));
            socket.on("element::setScroll", this._element_setScroll.bind(this));
            socket.on("element::getSelectedIndex", this._element_getSelectedIndex.bind(this));
            socket.on("element::setSelectedIndex", this._element_setSelectedIndex.bind(this));
            socket.on("element::getSelectedValue", this._element_getSelectedIndex.bind(this));
            socket.on("element::setSelectedValue", this._element_setSelectedValue.bind(this));
            socket.on("element::getText", this._element_getText.bind(this));
            socket.on("element::getComputedStyle", this._element_getComputedStyle.bind(this));
            socket.on("element::isEnabled", this._element_isEnabled.bind(this));
            socket.on("element::isFocused", this._element_isFocused.bind(this));
            socket.on("element::focus", this._element_focus.bind(this));
            socket.on("element::mouseDown", this._element_mouseDown.bind(this));
            socket.on("element::mouseUp", this._element_mouseDown.bind(this));
            socket.on("element::mouseMove", this._element_mouseMove.bind(this));
            socket.on("element::click", this._element_click.bind(this));
            socket.on("element::dblclick", this._element_dblclick.bind(this));
            socket.on("element::setValue", this._element_setValue.bind(this));
            socket.on("element::touchDown", this._element_touchDown.bind(this));
            socket.on("element::touchUp", this._element_touchUp.bind(this));
            socket.on("element::touchMove", this._element_touchMove.bind(this));
            socket.on("element::touchClick", this._element_touchClick.bind(this));
            socket.on("element::touchDblClick", this._element_touchDblClick.bind(this));
            socket.on("element::touchLongClick", this._element_touchLongClick.bind(this));
        }
    },

    /**
     * @private
     */
    _elementTracker: {
        value: null
    },

    //
    // Socket Handlers
    //

    /**
     * @private
     */
    _refresh: {
        value: function() {

        }
    },



    /**
     * @private
     */
    _executeScript: {
        value: function(script, args, callback) {
            var res;

            try {
                res = window.eval(script);
            } catch (err) {
                callback(new Error("Error while running script: " + err), null);
                return;
            }

            if (typeof resolve == "function") {
                callback(null, res);
            }
        }
    },

    /**
     * @private
     */
    _gotoUrl: {
        value: function(url) {
            console.log("navigate to", url);
        }
    },

    /**
     * Utility for displaying an error upon being unable to find an element.
     * @private
     */
    _elementLookupError: {
        value: function(selector) {
            // TODO Add better checking, e.g. element lifetime
            return new Error("Element " + selector + " does not exist.");
        }
    },

    /**
     * @private
     */
    _element: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (element) {
                callback(null, selector);
                return;
            }

            try {
                var xpathresult = document.evaluate(selector, document, null,
                    XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

                var result = [],
                    node = null;
                while ((node = xpathresult.iterateNext()) !== null) {
                    result.add(node);
                }

                if (result.length > 0) {
                    result = result[0];

                    this._elementTracker.addElement(selector, result);

                    callback(null, selector);
                } else {
                    throw new Error("Could not find element with selector " + selector);
                }
            } catch(err) {
                callback(err, null);
            }
        }
    },

    /**
     * @private
     */
    _element_getAttribute: {
        value: function(selector, attributeName, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            callback(null, element.getAttribute(attributeName));
        }
    },

    /**
     * @private
     */
    _element_setAttribute: {
        value: function(selector, attributeName, attributeValue, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            element.setAttribute(attributeName, attributeValue);

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_getInnerText: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            callback(null, element.innerText || element.textContent);
        }
    },

    /**
     * @private
     */
    _element_getScroll: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            callback(null, element.scrollLeft, element.scrollTop);
        }
    },

    /**
     * @private
     */
    _element_setScroll: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            element.scrollLeft = x;
            element.scrollTop = y;

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_getSelectedIndex: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            callback(null, element.selectedIndex);
        }
    },

    /**
     * @private
     */
    _element_setSelectedIndex: {
        value: function(selector, val, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // We need to force a change event to fire in order to simulate a
            // real user interaction. (Typically selectedIndex won't fire that)
            element.selectedIndex = val;
            var changeEvent = document.createEvent("HTMLEvents");
                changeEvent.initEvent("change", true, false);
            element.dispatchEvent(changeEvent);

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_getSelectedValue: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var index = element.selectedIndex;
            callback(null, element.options[index].value);
        }
    },

    /**
     * @private
     */
    _element_setSelectedValue: {
        value: function(selector, selectedValue, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var i, options = element.options;
            for (i = 0; i < options.length; i++) {
                if (options[i].value == arguments[1]) {
                    element.selectedIndex = i;
                    var changeEvent = document.createEvent("HTMLEvents");
                    changeEvent.initEvent("change", true, false);
                    element.dispatchEvent(changeEvent);
                    callback(null);
                    return;
                }
            }
            throw new Error('Option with value "' + arguments[1] + '" not found');
        }
    },

    /**
     * @private
     */
    _element_getText: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var tagNameLowerCase = element.tagName.toLowerCase();
            if(tagNameLowerCase == 'input' || tagNameLowerCase == 'textarea') {
                callback(null, element.value);
            } else {
                callback(null, element.innerText || element.textContent);
            }
        }
    },

    /**
     * @private
     */
    _element_getComputedStyle: {
        value: function(selector, styleProp, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var res = window.getComputedStyle(element);
            if (styleProp) {
                res = res.getPropertyValue(styleProp);
            }

            callback(null, res);
        }
    },

    /**
     * @private
     */
    _element_isEnabled: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            callback(null, !element.disabled);
        }
    },

    /**
     * @private
     */
    _element_isFocused: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            callback(null, document.activeElement == element);
        }
    },

    /**
     * @private
     */
    _element_focus: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            element.focus();

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_mouseDown: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: IE support
            // TODO: Only works when called directly on the element
            var mouseEvent = new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y
            });

            element.dispatchEvent(mouseEvent);

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_mouseUp: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: IE support
            // TODO: Only works when called directly on the element
            var mouseEvent = new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y
            });

            element.dispatchEvent(mouseEvent);

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_mouseMove: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var mouseEvent = new MouseEvent("mousemove", {
                bubbles: true,
                cancelable: false,
                view: window,
                clientX: x,
                clientY: y
            });

            element.dispatchEvent(mouseEvent);

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_click: {
        value: function(selector, button, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: IE support
            // TODO: Only works when called directly on the element
            var eventParams = {
                bubbles: true,
                cancelabel: true,
                view: window,
                button: button,
                clientX: x,
                clientY: y
            };

            element.dispatchEvent(new MouseEvent("mousedown", eventParams));
            element.dispatchEvent(new MouseEvent("mouseup", eventParams));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_dblclick: {
        value: function (selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: IE support
            // TODO: Only works when called directly on the element
            // TODO: Add a delay to make the clicks more realistic of an actual user
            var eventParams = {
                bubbles: true,
                cancelabel: true,
                view: window,
                clientX: x,
                clientY: y
            };

            element.dispatchEvent(new MouseEvent("mousedown", eventParams));
            element.dispatchEvent(new MouseEvent("mouseup", eventParams));
            element.dispatchEvent(new MouseEvent("mousedown", eventParams));
            element.dispatchEvent(new MouseEvent("mouseup", eventParams));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_setValue: {
        value: function(selector, value, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            if (element.component) {
                console.log("set", value);
                element.component.value = value;
                console.log("value", element.component.value);
            } else {
                element.value = value;
            }

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_touchDown: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: Which coordinates does x and y correspond to?
            var touches = [
                {
                    screenX: x,
                    screenY: y,
                    clientX: x,
                    clientY: y,
                    pageX: x,
                    pageY: y
                }
            ];

            element.dispatchEvent(new TouchEvents.TouchEvent("touchstart", {
                bubbles: true,
                cancelable: true,
                target: element,
                touches: touches,
                targetTouches: touches,
                changedTouches: touches
            }));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_touchUp: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: Which coordinates does x and y correspond to?
            var touches = [
                {
                    screenX: x,
                    screenY: y,
                    clientX: x,
                    clientY: y,
                    pageX: x,
                    pageY: y
                }
            ];

            element.dispatchEvent(new TouchEvents.TouchEvent("touchend", {
                bubbles: true,
                cancelable: true,
                target: element,
                changedTouches: touches
            }));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_touchMove: {
        value: function(selector, x, y, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            // TODO: Which coordinates does x and y correspond to?
            var touches = [
                {
                    screenX: x,
                    screenY: y,
                    clientX: x,
                    clientY: y,
                    pageX: x,
                    pageY: y
                }
            ];

            element.dispatchEvent(new TouchEvents.TouchEvent("touchmove", {
                bubbles: true,
                cancelable: true,
                target: element,
                touches: touches,
                targetTouches: touches,
                changedTouches: touches
            }));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_touchClick: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var touches = [{}];

            element.dispatchEvent(new TouchEvents.TouchEvent("touchstart", {
                bubbles: true,
                cancelable: true,
                target: element,
                touches: touches,
                targetTouches: touches,
                changedTouches: touches
            }));

            element.dispatchEvent(new TouchEvents.TouchEvent("touchend", {
                bubbles: true,
                cancelable: true,
                target: element,
                changedTouches: touches
            }));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_touchDblClick: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var touches = [{}];

            element.dispatchEvent(new TouchEvents.TouchEvent("touchstart", {
                bubbles: true,
                cancelable: true,
                target: element,
                touches: touches,
                targetTouches: touches,
                changedTouches: touches
            }));

            element.dispatchEvent(new TouchEvents.TouchEvent("touchend", {
                bubbles: true,
                cancelable: true,
                target: element,
                changedTouches: touches
            }));

            // TODO: Add a delay to make the double tap more realistic

            element.dispatchEvent(new TouchEvents.TouchEvent("touchstart", {
                bubbles: true,
                cancelable: true,
                target: element,
                touches: touches,
                targetTouches: touches,
                changedTouches: touches
            }));

            element.dispatchEvent(new TouchEvents.TouchEvent("touchend", {
                bubbles: true,
                cancelable: true,
                target: element,
                changedTouches: touches
            }));

            callback(null);
        }
    },

    /**
     * @private
     */
    _element_touchLongClick: {
        value: function(selector, callback) {
            var element = this._elementTracker.getElement(selector);
            if (!element) {
                callback(this._elementLookupError(selector));
                return;
            }

            var touches = [{}];

            element.dispatchEvent(new TouchEvents.TouchEvent("touchstart", {
                bubbles: true,
                cancelable: true,
                target: element,
                touches: touches,
                targetTouches: touches,
                changedTouches: touches
            }));

            setTimeout(function() {
                element.dispatchEvent(new TouchEvents.TouchEvent("touchend", {
                    bubbles: true,
                    cancelable: true,
                    target: element,
                    changedTouches: touches
                }));
            }, 1500); // TODO: Refactor to montage event or use a constant for the time delay

            callback(null);
        }
    }
});

/**
 * Used to interact with the application. Communicates via sockets to the Screening server.
 * @api private
 * @type {SocketAgent}
 */
exports.socketAgent = new SocketAgent();
