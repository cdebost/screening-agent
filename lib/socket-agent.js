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
    _elementsIndex: {
        value: 0,
        writable: true
    },

    _elements: {
        value: {}
    },

    _selectorMap: {
        value: {}
    },

    addElement: {
        value: function(selector, element) {
            this._elements[this._elementsIndex] = element;
            this._selectorMap[selector] = (this._selectorMap[selector] || []).concat(this._elementsIndex);
            return this._elementsIndex++;
        }
    },

    getElement: {
        value: function(id) {
            return this._elements[id];
        }
    },

    getIdsBySelector: {
        value: function(selector) {
            return this._selectorMap[selector] || [];
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
    _mousePosition: {
        value: {
            x: 0,
            y: 0
        }
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
            socket.on("elements", this._elements.bind(this));
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

            socket.on("component", this._component.bind(this));
            socket.on("component::getObjectName", this._component_getObjectName.bind(this));
            socket.on("component::getModuleId", this._component_getModuleId.bind(this));
            socket.on("component::getProperty", this._component_getProperty.bind(this));
            socket.on("component::setProperty", this._component_setProperty.bind(this));
            socket.on("component::callMethod", this._component_callMethod.bind(this));

            socket.on("doesElementExist", this._doesElementExist.bind(this));
            socket.on("waitForElement", this._waitForElement.bind(this));
            socket.on("getTitle", this._getTitle.bind(this));
            socket.on("getSource", this._getSource.bind(this));
            socket.on("getScroll", this._getScroll.bind(this));
            socket.on("setScroll", this._setScroll.bind(this));
            socket.on("getWindowSize", this._getWindowSize.bind(this));
            socket.on("mouseDown", this._mouseDown.bind(this));
            socket.on("mouseUp", this._mouseUp.bind(this));
            socket.on("mouseMove", this._mouseMove.bind(this));
            socket.on("click", this._click.bind(this));
        }
    },

    /**
     * @private
     */
    _elementTracker: {
        value: null
    },

    /**
     * @private
     */
    _getElement: {
        value: function(id, callback) {
            var element = this._elementTracker.getElement(id);
            if (element) {
                callback(null, element);
            } else {
                callback("Element not found");
            }
        }
    },

    /**
     * @private
     */
    _getIdsBySelector: {
        value: function(selector, callback) {
            var self = this;

            var ids = this._elementTracker.getIdsBySelector(selector);
            if (ids.length > 0) {
                callback(null, ids);
                return;
            }

            var xpathresult;
            try {
                xpathresult = document.evaluate(selector, document, null,
                    XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            } catch(err) {
                callback("Could not find element by selector");
                return;
            }

            var elements = [],
                node = null;
            while ((node = xpathresult.iterateNext()) !== null) {
                elements.add(node);
            }

            if (elements.length > 0) {
                var result = elements.map(function(element) {
                    var id = self._elementTracker.addElement(selector, element);
                    return id;
                });
                callback(null, result);
            } else {
                callback("Could not find element by selector", null);
            }
        }
    },

    _getComponent: {
        value: function(selector, callback) {
            var self = this;

            this._getIdsBySelector(selector, function(err, ids) {
                if (err || ids.length === 0) {
                    callback("Could not find component by selector");
                } else {
                    var id = ids[0];
                    self._getElement(id, function(err, element) {
                        if (err || !element.component) {
                            callback("Could not find component by selector");
                        } else {
                            callback(null, element.component);
                        }
                    });
                }
            });
        }
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
                callback("Error while running script: " + err, null);
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
     * @private
     */
    _element: {
        value: function(selector, callback) {
            var self = this;

            this._getIdsBySelector(selector, function(err, ids) {
                if (err) {
                    callback(err);
                } else {
                    var id = ids[0];
                    self._getElement(id, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, id);
                        }
                    });
                }
            });
        }
    },

    /**
     * @private
     */
    _elements: {
        value: function(selector, callback) {
            this._getIdsBySelector(selector, function(err, ids) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, ids);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getAttribute: {
        value: function(id, attributeName, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    callback(null, element.getAttribute(attributeName));
                }
            });
        }
    },

    /**
     * @private
     */
    _element_setAttribute: {
        value: function(id, attributeName, attributeValue, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    element.setAttribute(attributeName, attributeValue);
                    callback(null, null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getInnerText: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    callback(null, element.innerText || element.textContent);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getScroll: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    callback(null, element.scrollLeft, element.scrollTop);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_setScroll: {
        value: function(id, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    element.scrollLeft = x;
                    element.scrollTop = y;

                    callback(null, null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getSelectedIndex: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    callback(null, element.selectedIndex);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_setSelectedIndex: {
        value: function(id, val, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    // We need to force a change event to fire in order to simulate a
                    // real user interaction. (Typically selectedIndex won't fire that)
                    element.selectedIndex = val;
                    var changeEvent = document.createEvent("HTMLEvents");
                    changeEvent.initEvent("change", true, false);
                    element.dispatchEvent(changeEvent);

                    callback(null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getSelectedValue: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    var index = element.selectedIndex;
                    callback(null, element.options[index].value);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_setSelectedValue: {
        value: function(id, selectedValue, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
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
                    callback('Option with value "' + arguments[1] + '" not found');
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getText: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    var tagNameLowerCase = element.tagName.toLowerCase();
                    if(tagNameLowerCase == 'input' || tagNameLowerCase == 'textarea') {
                        callback(null, element.value);
                    } else {
                        callback(null, element.innerText || element.textContent);
                    }
                }
            });
        }
    },

    /**
     * @private
     */
    _element_getComputedStyle: {
        value: function(id, styleProp, callback) {
            this._getElement(selector, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    var res = window.getComputedStyle(element);
                    if (styleProp) {
                        res = res.getPropertyValue(styleProp);
                    }

                    callback(null, res);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_isEnabled: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    callback(null, !element.disabled);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_isFocused: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    callback(null, document.activeElement == element);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_focus: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
                    element.focus();

                    callback(null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_mouseDown: {
        value: function(id, x, y, callback) {
            var self = this;

            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                }  else {
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

                    self._mousePosition.x = x;
                    self._mousePosition.y = y;

                    callback(null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_mouseUp: {
        value: function(id, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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

                    self._mousePosition.x = x;
                    self._mousePosition.y = y;

                    callback(null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_mouseMove: {
        value: function(id, x, y, callback) {
            var self = this;

            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
                    var mouseEvent = new MouseEvent("mousemove", {
                        bubbles: true,
                        cancelable: false,
                        view: window,
                        clientX: x,
                        clientY: y
                    });

                    element.dispatchEvent(mouseEvent);

                    self._mousePosition.x = x;
                    self._mousePosition.y = y;

                    callback(null);
                }
            });
        }
    },

    // TODO: Track mousePosition
    /**
     * @private
     */
    _element_click: {
        value: function(id, button, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
                    // TODO: IE support
                    // TODO: Only works when called directly on the element
                    var eventParams = {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        button: button,
                        clientX: x,
                        clientY: y
                    };

                    element.dispatchEvent(new MouseEvent("mousedown", eventParams));
                    element.dispatchEvent(new MouseEvent("mouseup", eventParams));

                    callback(null);
                }
            });
        }
    },

    // TODO: Track mousePosition
    /**
     * @private
     */
    _element_dblclick: {
        value: function (id, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
                    // TODO: IE support
                    // TODO: Only works when called directly on the element
                    // TODO: Add a delay to make the clicks more realistic of an actual user
                    var eventParams = {
                        bubbles: true,
                        cancelable: true,
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
            });
        }
    },

    /**
     * @private
     */
    _element_setValue: {
        value: function(id, value, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
                    if (element.component) {
                        element.component.value = value;
                    } else {
                        element.value = value;
                    }

                    callback(null);
                }
            });
        }
    },

    /**
     * @private
     */
    _element_touchDown: {
        value: function(id, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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
            });


        }
    },

    /**
     * @private
     */
    _element_touchUp: {
        value: function(id, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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
            });
        }
    },

    /**
     * @private
     */
    _element_touchMove: {
        value: function(id, x, y, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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
            });
        }
    },

    /**
     * @private
     */
    _element_touchClick: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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
            });
        }
    },

    /**
     * @private
     */
    _element_touchDblClick: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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
            });
        }
    },

    /**
     * @private
     */
    _element_touchLongClick: {
        value: function(id, callback) {
            this._getElement(id, function(err, element) {
                if (err) {
                    callback(err);
                } else {
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
            });
        }
    },

    /**
     * @private
     */
    _component: {
        value: function(id, callback) {
            this._getComponent(id, function(err, component) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, null);
                }
            });
        }
    },

    /**
     * @private
     */
    _component_getObjectName: {
        value: function(id, callback) {
            this._getComponent(id, function(err, component) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, component._montage_metadata.objectName);
                }
            });
        }
    },

    /**
     * @private
     */
    _component_getModuleId: {
        value: function(id, callback) {
            this._getComponent(id, function(err, component) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, component._montage_metadata.moduleId);
                }
            });
        }
    },

    /**
     * @private
     */
    _component_getProperty: {
        value: function(id, propName, callback) {
            this._getComponent(id, function(err, component) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, component[propName]);
                }
            });
        }
    },

    /**
     * @private
     */
    _component_setProperty: {
        value: function(id, propName, propValue, callback) {
            this._getComponent(id, function(err, component) {
                if (err) {
                    callback(err);
                } else {
                    component[propName] = propValue;
                    callback(null);
                }
            });
        }
    },

    /**
     * @private
     */
    _component_callMethod: {
        value: function(id, funcName, arguments, callback) {
            this._getComponent(id, function(err, component) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, component[funcName].apply(component, arguments));
                }
            })
        }
    },

    /**
     * @private
     */
    _doesElementExist: {
        value: function(selector, callback) {
            this._getIdsBySelector(selector, function(err, ids) {
                if (err || ids.length == 0) {
                    callback(null, false);
                } else {
                    callback(null, true);
                }
            });
        }
    },

    /**
     * @private
     */
    _waitForElement: {
        value: function(selector, waitTimeout, callback) {
            var DELAY = 500;
            var self = this;

            var startTime;

            function getElement() {
                self._element(selector, function(err, id) {
                    if (err) {
                        if (window.performance.now() - startTime >= waitTimeout) {
                            callback("Timed out waiting for element");
                        } else {
                            setTimeout(getElement,
                                Math.min(DELAY,
                                    waitTimeout - (window.performance.now() - startTime) // remaining time
                                )
                            );
                        }
                    } else {
                        callback(null, id);
                    }
                });
            }

            startTime = window.performance.now();
            getElement();
        }
    },

    /**
     * @private
     */
    _getTitle: {
        value: function(callback) {
            callback(null, document.title);
        }
    },

    /**
     * @private
     */
    _getSource: {
        value: function(callback) {
            callback(null, document.documentElement.innerHTML);
        }
    },

    /**
     * @private
     */
    _getScroll: {
        value: function(callback) {
            var left = window.pageXOffset || document.documentElement.scrollLeft,
                top  = window.pageYOffset || document.documentElement.scrollTop;

            callback(null, [left, top]);
        }
    },

    /**
     * @private
     */
    _setScroll: {
        value: function(left, top, callback) {
            window.scrollTo(left, top);
            callback(null);
        }
    },

    /**
     * @private
     */
    _getWindowSize: {
        value: function(callback) {
            callback(null, [window.innerWidth, window.innerHeight]);
        }
    },

    /**
     * @private
     */
    _mouseDown: {
        value: function(x, y, callback) {
            var target = document.elementFromPoint(x, y) || document.documentElement;
            var ev = new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                view: window,
                screenX: x,
                screenY: y,
                button: 0
            });
            target.dispatchEvent(ev);

            this._mousePosition.x = x;
            this._mousePosition.y = y;

            callback(null);
        }
    },

    /**
     * @private
     */
    _mouseUp: {
        value: function(x, y, callback) {
            var target = document.elementFromPoint(x, y) || document.documentElement;
            var ev = new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: true,
                view: window,
                screenX: x,
                screenY: y,
                button: 0
            });
            target.dispatchEvent(ev);

            this._mousePosition.x = x;
            this._mousePosition.y = y;

            callback(null);
        }
    },

    /**
     * @private
     */
    _mouseMove: {
        value: function(x, y, callback) {
            var target = document.elementFromPoint(x, y) || document.documentElement;
            var ev = new MouseEvent("mousemove", {
                bubbles: true,
                cancelable: true,
                view: window,
                screenX: x,
                screenY: y
            });
            target.dispatchEvent(ev);

            this._mousePosition.x = x;
            this._mousePosition.y = y;

            callback(null);
        }
    },

    /**
     * @private
     */
    _click: {
        value: function(button, x, y, callback) {
            this._mousePosition.x = x || this._mousePosition.x;
            this._mousePosition.y = y || this._mousePosition.y;

            var target = document.elementFromPoint(this._mousePosition.x, this._mousePosition.y);
            var params = {
                bubbles: true,
                cancelable: true,
                view: window,
                screenX: this._mousePosition.x,
                screenY: this._mousePosition.y,
                button: button || 0
            };
            target.dispatchEvent(new MouseEvent("mousedown", params));
            target.dispatchEvent(new MouseEvent("mouseup", params));
        }
    },

    /**
     * @private
     */
    _doubleClick: {
        value: function(x, y, callback) {
            this._mousePosition.x = x || this._mousePosition.x;
            this._mousePosition.y = y || this._mousePosition.y;

            var target = document.elementFromPoint(this._mousePosition.x, this._mousePosition.y);
            var params = {
                bubbles: true,
                cancelable: true,
                view: window,
                screenX: this._mousePosition.x,
                screenY: this._mousePosition.y,
                button: 0
            };
            target.dispatchEvent(new MouseEvent("mousedown", params));
            target.dispatchEvent(new MouseEvent("mouseup", params));
            // TODO: Add a delay to make double clicking more realistic
            target.dispatchEvent(new MouseEvent("mousedown", params));
            target.dispatchEvent(new MouseEvent("mouseup", params));
        }
    }
});

/**
 * Used to interact with the application. Communicates via sockets to the Screening server.
 * @api private
 * @type {SocketAgent}
 */
exports.socketAgent = new SocketAgent();
