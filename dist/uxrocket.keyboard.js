/**
 * UX Rocket
 * jQuery based Keyboard plugin
 * @author Emrah Kumru
 */

;(function(factory) {
    'use strict';
    if(typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if(typeof exports === 'object' && typeof require === 'function') {
        // Browserify
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    'use strict';

    var ux,
        i = 1,
        rocketName = 'uxrScreenKeyboard',
        defaults = {

            isLog           : false,
            defaultKeyboard : false,
            format          : 'trq',
            type            : 'alphanumeric'

        },
        ns = {
            prefix : 'uxr-',
            rocket : 'uxRocket',
            data   : rocketName,
            name   : 'screenKeyboard',
            wrap   : 'uxr-plugin-wrap',
            classes: {

                ready       : 'ready',
                hidden      : 'hidden',
                button      : 'button',
                close       : 'close',
                numbers     : 'numbers',
                characters  : 'characters',
                delete      : 'button-del',
                enter       : 'button-enter',
                space       : 'button-space',
                capslock    : 'button-capslock',
                zero        : 'button-zero',
                line        : 'line'

            },
            attr : {
                delete      : "data-trigger='delete'",
                space       : "data-trigger='space'",
                close       : "data-trigger='toggle'",
                capslock    : "data-trigger='capslock'",
                enter       : "data-trigger='enter'"
            }
        },
        templates = {

            wrap    :  '<div class="{{wrapClass}} {{hidden}}" id="{{wrapId}}">'+
                            '<div class="{{closeClass}}">' +
                                '<a href="#" class="'+ ns.classes.button +'"' + ns.attr.close+'>X</a>'+
                            '</div>' +
                        '</div>',

            buttons :   '{{#each buttons}}' +
                            '<a href="#" class="'+ ns.classes.button +'{{#if buttons.class}} {{buttons.class}}{{/if}}" {{#if buttons.attr}} {{buttons.attr}}{{/if}}>' +
                                '{{buttons.text}}' +
                            '</a>' +
                        '{{/each}}',

            line    :   '{{#each lines}}' +
                            '<div class="line-{{lines.index}}"></div>' +
                        '{{/each}}',

            div :   '<div class="{{#each classes}} {{classes.class}} {{/each}}"> </div>'


        },
        types = {
            numeric: {
                1: [{text: 1}, {text: 2}, {text: 3}],
                2: [{text: 4}, {text: 5}, {text: 6}],
                3: [{text: 7}, {text: 8}, {text: 9}],
                4: [{text: 0, class : ns.classes.zero}]
            },
            alphanumeric : {
                trq : {
                    1: [{text: "q"}, {text: "w"}, {text: "e"},{text: "r"}, {text: "t"}, {text: "y"},{text: "u"}, {text: "ı"}, {text: "o"}, {text: "p"}, {text: "ğ"}, {text: "ü"}],
                    2: [{text: "a"}, {text: "s"}, {text: "d"},{text: "f"}, {text: "g"}, {text: "h"},{text: "j"}, {text: "k"}, {text: "l"}, {text: "ş"}, {text: "i"}],
                    3: [{text: "z"}, {text: "x"}, {text: "c"},{text: "v"}, {text: "b"}, {text: "n"},{text: "m"}, {text: "ö"}, {text: "ç"}],
                },

                eng : {
                    1: [{text: "q"}, {text: "w"}, {text: "e"},{text: "r"}, {text: "t"}, {text: "y"},{text: "u"}, {text: "i"}, {text: "o"}, {text: "p"}],
                    2: [{text: "a"}, {text: "s"}, {text: "d"},{text: "f"}, {text: "g"}, {text: "h"},{text: "j"}, {text: "k"}, {text: "l"}],
                    3: [{text: "z"}, {text: "x"}, {text: "c"},{text: "v"}, {text: "b"}, {text: "n"},{text: "m"}]
                }
            },
            specialButtons : {

                enter       : [{ text: "Geç", class : ns.classes.enter, attr : ns.attr.enter}],
                delete      : [{ text: "Sil", class : ns.classes.delete, attr : ns.attr.delete }],
                space       : [{ text: "Boşluk", class : ns.classes.space, attr : ns.attr.space }],
                capslock    : [{ text: "Caps Lock", class : ns.classes.capslock, attr : ns.attr.capslock }]

            }

        },
        utils   = new window.uxrPluginUtils({ns: ns});

    var Keyboard = function (el, options) {

        var $el = $(el);

        this._instance = i;
        this._name = rocketName;
        this._defaults = defaults;

        this.el = el;
        this.$el = $el;
        this.id = 'uxr-keyboard-' + i;

        this.terms = {};
        this.options = $.extend(true, {}, defaults, options, $el.data());

        this.lastTerm = null;
        this.wrap = null;
        this.keyboard = null;
        this.capslock = false;

        i++;

        this.init();
    };

    $.extend(Keyboard.prototype, {

        init : function () {

            this.createLayout();

            this.bindUIActions();

        },

        /**
         * log function
         *
         * @param node
         * @param eventType
         * @param msg
         */
        log : function (msg, node, eventType) {

            if (!defaults.isLog) {
                return ;
            }

            msg = msg || '';
            node = node || '';
            eventType   = eventType || '';

            return  console.log(node,eventType + ' >>> ' + msg);

        },

        bindUIActions : function () {

            var _this = this,
                actions = {

                    nodes: function () {

                        var node = _this.$el;

                        $(node).on('click touchstart', function (e) {

                            _this.log('Keyboard called', this, e.type);

                            _this.toggle();

                            e.preventDefault();
                        });
                    },

                    buttons: function () {

                        var buttons = $(_this.keyboard).find('a.' + ns.classes.button);

                        buttons.on('click touchstart', function (e) {

                            _this.log('triggered this button', this, e.type);

                            actions.trigger(this.dataset.trigger, this.text);

                            e.preventDefault();

                        });

                    },

                    trigger: function (type, value) {
                        return actions[type] ? actions[type].apply() : actions.chars(value);
                    },

                    toggle: function () {
                        return _this.toggle();
                    },

                    chars: function (value) {
                        return _this.$el.val( _this.$el.val() + value);
                    },

                    enter: function () {
                        return typeof _this.options.submit === "function" ? _this.options.submit() : _this.$el.closest('form').submit();
                    },

                    space: function () {
                        return _this.$el.val( _this.$el.val() + ' ');
                    },

                    capslock: function () {

                        var buttons = _this.keyboard.find('.' + ns.classes.line + ' a.' + ns.classes.button);


                        if ( _this.capslock ){

                            buttons.each(function () {

                                if ( !$(this).data('trigger')){
                                    $(this).html($(this).text().toLowerCase());
                                }
                            });

                            _this.capslock = false;

                        }else {

                            buttons.each(function () {

                                if ( !$(this).data('trigger')){
                                    return $(this).html($(this).text().toUpperCase());
                                }
                            });

                            _this.capslock = true;
                        }
                    },

                    delete: function () {
                        return _this.$el.val( String(  _this.$el.val()).substring(0, _this.$el.val().length - 1) );
                    }
            };

            // binding UI actions
            actions.nodes();
            actions.buttons();
        },

        createLayout : function () {

            var _this = this;

            var layout = {

                wrap : function () {

                    var data = {
                        wrapClass :  ns.wrap,
                        hidden : ns.classes.hidden,
                        wrapId : _this.id,
                        closeClass : ns.classes.close
                    };

                    return utils.render(templates.wrap, data);
                },

                lines : function ( ) {

                    var content = $( layout.div({ classes : [ { class : _this.options.type}, {class : _this.options.format }]}));

                    return content.append( layout[_this.options.type] );
                },

                div : function (data) {

                    return utils.render(templates.div, data );
                },

                numeric : function () {

                    var format  = types[_this.options.type],
                        special = types.specialButtons.delete.concat(types.specialButtons.enter),
                        first   = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // number of line
                            utils.render(templates.buttons, {buttons : format[1]})
                        ),
                        second  = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // number of line
                            utils.render(templates.buttons, {buttons : format[2]})
                        ),
                        third   = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // number of line
                            utils.render(templates.buttons, {buttons : format[3]})
                        ),
                        fourth  = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // number of line & special chars
                            utils.render(templates.buttons, {buttons : format[4]}),
                            utils.render(templates.buttons, {buttons : special})          // fourth line and included special buttons

                        );

                    return [first, second , third, fourth];

                },

                alphanumeric : function () {

                    var format  = types[_this.options.type][_this.options.format],
                        numeric = types.numeric[1].concat(types.numeric[2],types.numeric[3], types.numeric[4]), // set numbers single line
                        special = types.specialButtons.enter.concat(types.specialButtons.space,types.specialButtons.delete,types.specialButtons.capslock), // set special buttons
                        numbers  = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // numbers of line
                            utils.render(templates.buttons, {buttons : numeric})
                        ),
                        first   = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // first line of the keyboard
                            utils.render(templates.buttons, {buttons : format[1]})
                        ),
                        second  = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // second line of the keyboard
                            utils.render(templates.buttons, {buttons : format[2]})
                        ),
                        third   = $( layout.div({ classes : [{class : ns.classes.line}]})).append(        // thitd line of the keyboard
                            utils.render(templates.buttons, {buttons : format[3]})
                        ),
                        fourth  = $( layout.div({ classes : [{class : ns.classes.line}]})).append(         // fourth line of the keyboard and included special buttons
                            utils.render(templates.buttons, {buttons : special })
                        );

                    return [numbers, first, second , third, fourth];
                }
            };

            var keyboard = $( layout.lines());

            $(layout.wrap()).append(keyboard).appendTo($('body'));

            _this.keyboard = $('#'+ this.id);

            _this.log('created keyboard for this node ',_this.$el);

        },

        toggle : function () {

            this.closeAll();

            this.log('keyboard toggled it for this node  ',this.$el);

            return $(this.keyboard).hasClass(ns.classes.hidden) ? $(this.keyboard).removeClass(ns.classes.hidden) : $(this.keyboard).addClass(ns.classes.hidden) ;
        },

        closeAll :function () {

            this.log('closed all other keyboard');

            return $('.' + ns.wrap + ':not(#' + this.id + ')').addClass(ns.classes.hidden);
        }

    });

    // Bind the plugin and attach the instance to data
    ux = $.fn.Keyboard = $.fn.uxrscreenKeyboard = function(options) {

        return this.each(function() {
            if($.data(this, ns.data)) {
                return;
            }
            $.data(this, ns.data, new Keyboard(this, options));
        });
    };

    // version
    ux.version = '1.0.0';

    // default settings
    ux.settings  = defaults;
    ux.namespace = ns;
    
}));