(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd ? define(factory) : global.supers = factory();
})(this, function() {
    this.supers = this.supers || {};

    var toString = Object.prototype.toString;
    var slice = Array.prototype.slice;

    supers.inherits = function(subClass, superClass) {
        function O() { this.consturctor = subClass };
        O.prototype = superClass.prototype;
        return subClass.prototype = new O();
    }

    supers.possibleConstructorReturn = function(self, parent) {
        return typeof parent === 'function' && parent ? parent : self;
    }
    
    var assign = Object.assign || function() {
        var args1 = argumnets[0];
        var args2 = arguments[1];
        var args3 = arguments[2];

        if(arguments.length === 2) {
            for(var i in args2) {
                args1[i] = args2[i];
            }
            return args1;
        }else if(arguments.length === 3) {
            for(var j in args2) {
                args1[j] = args2[j];
            }
            for(var k in args3) {
                args1[k] = args3[k];
            }
            return args1;
        }else {
            return args1;
        }
    }
    
    function isObject(obj) {
        return (typeof obj == 'object' || typeof obj === 'function') && !!obj;
    }

    var isArray = Array.isArray || function(obj) {
        return toString.call(obj) === '[object Function]';
    }

    supers.log = {
        error: function(mess) {
            throw new Error(mess);
        }
    }

    // 一些dom操作的静态方法
    /**
     * 创建dom元素，赋予属性和方法
     * @param {String} el: 创建的属性名称 
     * @param {Object} properties 
     * @param {Object} attributes 
     * @return {Object} el setProperties setAttributes
     */
    function createElement() {
        var el = arguments.length > 1 && arguments[0] ? arguments[0] : 'div';
        var properties = arguments.length > 2 && arguments[1] ? arguments[1]: {};
        var attributes = arguments[2] || {};

        el = document.createElement(el);
        // properties
        setProperties(properties);
        // attributes
        setAttributes(attributes);

        function setProperties(props) {
            Object.keys(props).forEach(function(prop) {
                var value = props[prop];
                el[prop] = value;
            })
        }

        function setAttributes(attrs) {
            Object.keys(attrs).forEach(function(attr) {
                var value = attrs[attr];
                el.setAttribute(attr, value);
            });
        }
        el.setProperties = setProperties;
        el.setAttributes = setAttributes;
        return el;
    }
    
    function isEl(el) {
        return el && el.nodeType === 1;
    }

    /**
     * 获取元素的大小
     * @param {*} el 
     * @return {Object} 元素的信息
     */
    function getElSize(el) {
        if(isEl(el)) {
            var clientRect = el.getBoundingClientRect();
            return clientRect;
        }else {
            return {};
        }
    }

    function setStyle(el, options) {
        Object.keys(options).forEach(function(key) {
            var value = options[key];

            // 自动给width或者height添加px
            if(key == 'width' || key == 'height') {
                value = parseFloat(value) + 'px';
            }
            el.style[key] = value;
        });
        return el;
    }

    supers.DOM = Object.freeze({
        isEl: isEl,
        setStyle: setStyle,
        getElSize: getElSize,
        createElement: createElement
    })

    /**
     * canvas事件源类
     */
    var Events = (function() {
        function Events() {
            this.events = {};
        };

        /**
         * 事件的添加（加入队列）
         * @param {String} eventName: 事件触发名称
         * @param {Function} func: 事件的方法
         * @param {Boolean} capture: 捕获
         */
        Events.prototype.addEventListener = function() {
            var eventName = arguments.length > 1 && arguments[0] ? arguments[0] : 'click';
            var func = arguments.length >= 2 && arguments[1] ? arguments[1] : supers.log.error('this argument must be function!');
            var capture = arguments[2] || false;

            if(!this.events[eventName]) {
                this.events[eventName] = [];
            }
            this.events[eventName].push(func);
        }

        Events.prototype.removeEventListener = function() {};
        
        Events.prototype.emit = function(name) {
            var funcs = this.events[name];
            var otherParams = slice.call(arguments, 1);

            if(!isArray(funcs)) return;
            for(var i = 0, func; func = funcs[i++];) {
                func.apply(this, otherParams);
            }
            
        }

        return Events;
    })();

    /**
     * 容器
     * 一个canvas只允许一个容器
     * @param {Element|String} canvasElement: canvas DOM元素
     */
    var Container = (function() {
        function Container(el) {

            // 绘画环境
            this.ctx = el && this.createContext(el);

            // 当前元素
            this.element = this;
            // 当前位置
            this.position = {left: 0, top: 0};

            // 父元素
            this.parent = null;

            // 所有的子元素
            this.children = [];
            
            // 上一个元素
            this.previousElementSibling = null;

            // 下一个元素
            this.nextElementSibling = null;

            // 元素的宽高
            this.offsetWidth = null;
            this.offsetHeight = null;
            
            // 元素的边距
            this.offsetLeft = null;
            this.offsetTop = null;
        }

        /**
         * canvas DOM元素
         * @param {Element|String} id 
         * @return {CanvasContext} 获得一个canvas画布的环境
         */
        Container.prototype.createContext = function(el) {
            var ctx = void 0;
        
            if(typeof el === 'string') {
                el = document.getElementById(el);
            }else {
                supers.log.error('el is not node, it must be id or node!');
            };

            var elSize = getElSize(el);
            var canvasName = el.id + '_canvas';  
            var canvasEl = createElement('canvas', {}, {
                id: canvasName,
                width: 12,
                height: 12
            });

            canvasEl.setAttributes({
                width: elSize.width * 2,
                height: elSize.height * 2
            });
            setStyle(canvasEl, {
                width: elSize.width,
                height: elSize.height
            });
            el.appendChild(canvasEl);
            ctx = document.getElementById(canvasName).getContext('2d');
            ctx.scale(2, 2);
            ctx.translate(1, 1);
            return ctx;
        }

        /**
         * 插入当前元素的子节点
         * @param {CanvasElement} CanvasElement的实例
         */
        Container.prototype.appendChild = function() {
            var canvasEl = arguments[0];   // 当前元素

            this.inherits(canvasEl, this);
            this.children.push(canvasEl);
        }   

        /**
         * 更新当前的位置坐标
         * @param {Object} position={left, top}
         */
        Container.prototype.updatePosition = function(position) {
            if(!isObject(position)) return supers.log.error('position is must be Object,example: {left: 0,top:0}');
            this.position = position;
        }

        /**
         * 子元素继承父元素的属性
         * 1.继承父亲的名字内容 2.继承了当前的绘画环境
         * @param {Instance} 被实例化的子元素
         * @param {Instance} 被实例化的父元素
         */
        Container.prototype.inherits = function(subInstance, superInstance) {
            var previousChild = this.children[this.children.length - 1 ];  // 上一个子元素
            var position = {left: 0, top: 0}; //previousChild ? previousChild.position : 

            if(previousChild) {
                // 前一个的位置 + 前一个本身的宽度 = 当前的位置
                var left = previousChild.position.left + (previousChild.width || 0);
                var top = previousChild.position.top;
                var canvas = this.ctx.canvas;

                // 当前位置超出总长度  需要移到下一行
                if((left+subInstance.width) > (canvas.offsetWidth || 0)) {
                    top = top + (previousChild.height || 0);
                    left = this.position.left;
                } 
                position = { left: left, top: top};
            }
            subInstance.ctx = superInstance.ctx;
            subInstance.parent = superInstance;
            subInstance.previousElementSibling = previousChild;
            previousChild && (previousChild.nextElementSibling = subInstance);
  
            subInstance[subInstance.type](position);
        }

        return Container;
    })();
    supers.Container = Container;



    /**
     * 创建舞台
     * @param {Object} options: {type: 'circle', }
     * type(required): 画图像的类型
     * @return {ctx}  返回绘画环境
     */
    var borderRegexp = /\s*([\d]+)px\s+(solid|dash)\s+([^\/+={}"']+)/;
    var CanvasElement = (function(_Container) {
        supers.inherits(CanvasElement, _Container);

        function CanvasElement(options) {
            var _this = supers.possibleConstructorReturn(this, _Container.call(this));

            // 默认属性的展示
            _this.width = 0;
            _this.height = 0;
            _this.backgroundColor = null;
            _this.type = 'rect';
            _this.border = '';
            assign(_this, options || {});
            console.log(_this)
            // border处理
            this.parserBorder(_this.border);
        }

        /**
         * 绘制矩形
         * @param {Object} position={left, top}
         */
        CanvasElement.prototype.rect = function(position) {
            this.updatePosition(position);
            var ctx = this.ctx;
             
            ctx.beginPath();
            ctx.rect(position.left || 0, position.top || 0, this.width, this.height);

            // 设置样式
            // --设置border样式
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor;
            this.borderStyle === 'solid' ? ctx.setLineDash([]) : ctx.setLineDash([5, 5]);

            // --设置背景颜色
            if(this.backgroundColor) {
                ctx.fillStyle = this.backgroundColor;
                ctx.fill();
            }
            ctx.stroke();

        };

        CanvasElement.prototype.text = function() {
            var ctx = this.ctx;

            ctx.beginPath();

            ctx.fillStyle = 'black';
            
            ctx.textAlign = 'start'
            ctx.font = '24px serif';
            ctx.fillText(this.textContent, this.position.left, this.position.top + 24);

        }

        /**
         * 解析border内容
         * @param {String} border='1px solid red'
         */
        CanvasElement.prototype.parserBorder = function(border) {
            var borderStr = border.match(borderRegexp);
            // 默认border属性设置
            this.borderWidth = 1;
            this.borderStyle = 'solid';
            this.borderColor = 'black';

            if(borderStr) {
                this.borderWidth = borderStr[1];
                this.borderStyle = borderStr[2];
                this.borderColor = borderStr[3];
            }
        }

        return CanvasElement;
    })(supers.Container);
    supers.CanvasElement = CanvasElement;

    return this.supers;
});