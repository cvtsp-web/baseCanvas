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

    function isEmptyObject(obj) {
        for(var i in obj) {
            if(obj[i]) return false;
        }
        return true;
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

        /**
         * 是否存在当前的事件类型
         * @return {Boolean} true: 存在
         */
        Events.prototype.hasEvent = function() {
            var eventName = arguments.length >=1 && arguments[0] ? arguments[0] : null;

            if(eventName) {
                var lists = this.events[eventName];
                return isArray(lists) && lists.length ? true : false;
            }
            return false;
        }

        /**
         * 事件的删除
         * @param {String} eventName: 事件删除的名称
         * @param {Function} func
         */
        Events.prototype.removeEventListener = function() {
            var eventName = arguments.length > 1 && arguments[0] ? arguments[0] : 'click';
            var func = arguments.length >= 2 && arguments[1] ? arguments[1] : supers.log.error('this argument must be function!');
            var capture = arguments[2] || false;

            var lists = this.events[eventName];
            if(eventName && isArray(lists)) {
                for(var i = 0,list; list = lists[i++];) {
                    if(list == func) {
                        lists.splice(i-1, 1);
                    }
                }
            }  
        };
        
        Events.prototype.emit = function(name) {
            var funcs = this.events[name];
            var otherParams = slice.call(arguments, 1);

            if(!isArray(funcs)) return;
            for(var i = 0, func; func = funcs[i++];) {
                func.apply(this, otherParams);
            }   
        }

        Events.prototype.on = Events.prototype.addEventListener;
        return Events;
    })();

    /**
     * 容器
     * 一个canvas只允许一个容器
     * @param {Element|String} canvasElement: canvas DOM元素
     */
    var HANDLER__GROUPS = [
        'click', 
        
        'touchstart', 'touchmove', 'touchmove'
    ];
    var Container = (function(_Events) {
        supers.inherits(Container, _Events);

        function Container(el) {
            var _this = supers.possibleConstructorReturn(this, _Events.call(this));

            // 当前分辨率
            _this.ratio = 2;
            // 绘画环境
            _this.ctx = el && _this.createContext(el);

            if(_this.ctx) {
                var canvas = _this.ctx.canvas;
                _this.width = canvas.offsetWidth;
                _this.height = canvas.offsetHeight;
            }
            
            // 当前元素
            _this.element = _this;
            // 当前位置
            _this.position = {left: 0, top: 0};

            // 父元素
            _this.parent = null;

            // 所有的子元素
            _this.children = [];
            
            // 上一个元素
            _this.previousElementSibling = null;

            // 下一个元素
            _this.nextElementSibling = null;

            // 元素的宽高
            _this.offsetWidth = null;
            _this.offsetHeight = null;
            
            // 元素的边距
            _this.offsetLeft = null;
            _this.offsetTop = null;

            this._handlerEvents();
        }

        Container.prototype._handlerEvents = function() {
            var _this = this;

            _this.ctx && HANDLER__GROUPS.forEach(function(handler) {
                var canvas = _this.ctx.canvas;
                canvas.addEventListener(handler, function(event) {               
                    var left = (event.pageX - canvas.offsetLeft) * _this.ratio;
                    var top = (event.pageY - canvas.offsetTop) * _this.ratio;
                    
                    _this.clearAllContent();
                    _this.eachChilds(_this.children, _this, function(child) {
                        // 绘制图形的方法
                        child.ctx && child[child.type](function() {
                            if(child.hasEvent(handler) && _this.ctx.isPointInPath(left, top)) {
                                child.emit.apply(child, [handler, event]);   // 已经改变了属性
                            }
                        })
                    })
                })
            });
        }

        Container.prototype.clearAllContent = function() {
            var canvas = this.ctx.canvas;
            if(!canvas) return supers.log.error('canvas is not element!');
            this.ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        }

        /**
         * canvas DOM元素
         * @param {Element|String} id 
         * @return {CanvasContext} 返回一个canvas画布的环境
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
                width: elSize.width * this.ratio,
                height: elSize.height * this.ratio
            });
            setStyle(canvasEl, {
                width: elSize.width,
                height: elSize.height
            });
            el.appendChild(canvasEl);
            ctx = document.getElementById(canvasName).getContext('2d');
            ctx.scale(this.ratio, this.ratio);
            ctx.translate(1, 1);
            return ctx;
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
         * 遍历所有的子元素
         * @param {Array} childs=[CanvasElement, CanvasElement ...]
         * @param {CanvasElement} parent 
         * @param {Function} callback 
         */
        Container.prototype.eachChilds = function(childs, parent, callback) {
            if(isArray(childs) && childs.length > 0) {
                for(var i = 0, child; child = childs[i++];) {
                    callback(child, parent);
                    this.eachChilds(child.children, child, callback);
                }
            }
        }

        /**
         * 插入当前元素的子节点
         * @param {CanvasElement} CanvasElement的实例
         */
        Container.prototype.appendChild = function() {
            var canvasEl = arguments[0];   // 当前元素

            this.inherits(canvasEl, this);     // 当前元素继承了父元素的属性 *       
            if(this.ctx) {    
                canvasEl[canvasEl.type]();        // 绘制当前元素
                this.eachChilds(canvasEl.children, canvasEl, function(child, parent) {         
                    // 绘制当前元素的子元素
                    child.ctx = parent.ctx;
                    child.position = detailInheritsPosition(child.ctx, child, parent);
                    child[child.type]();
                })
            };
            this.children.push(canvasEl);
        }   

        /**
         * 子元素继承父元素的属性
         * 1.继承父亲的名字内容 2.继承了当前的绘画环境
         * @param {Instance} 被实例化的子元素
         * @param {Instance} 被实例化的父元素
         */
        Container.prototype.inherits = function(subInstance, superInstance) {
            var previousChild = this.children[this.children.length - 1 ];  // 上一个子元素
            var position = {left: superInstance.position.left, top: superInstance.position.top}; //previousChild ? previousChild.position : 
            
            if(this.ctx && previousChild) {
                // 前一个的位置 + 前一个本身的宽度 = 当前的位置
                var left = previousChild.position.left + (previousChild.width || 0);
                var top = previousChild.position.top;
                var canvas = this.ctx.canvas;

                // 当前位置超出总长度  需要移到下一行
                if((left+subInstance.width) > (canvas.offsetWidth || 0)) {
                    top = top + (previousChild.height || 0);
                    left = superInstance.position.left;
                } 
                position = { left: left, top: top};
            }

            subInstance.ctx = superInstance.ctx;
            subInstance.parent = superInstance;
            subInstance.previousElementSibling = previousChild;
            subInstance.position = position;
            previousChild && (previousChild.nextElementSibling = subInstance);
            subInstance.inheritsFinish();
        }

        /**
         * 处理继承位置
         * @return {Object} position
         */
        function detailInheritsPosition(ctx, child, parent) {
            var previousChild = child.previousElementSibling;
            var position = {left: parent.position.left, top: parent.position.top};

            if(ctx && previousChild) {
                // 前一个的位置 + 前一个本身的宽度 = 当前的位置
                var left = previousChild.position.left + (previousChild.width || 0);
                var top = previousChild.position.top;
                var canvas = ctx.canvas;

                // 当前位置超出总长度  需要移到下一行
                if((left+child.width) > (canvas.offsetWidth || 0)) {
                    top = top + (previousChild.height || 0);
                    left = parent.position.left;
                } 
                position = { left: left, top: top};
            }

            return position;
        }

        return Container;
    })(Events);
    supers.Container = Container;



    /**
     * 创建舞台
     * @param {Object} options: {type: 'circle', }
     * type(required): 画图像的类型
     * @return {ctx}  返回绘画环境
     */
    var borderRegexp = /\s*([\d]+)px\s+(solid|dash)\s+([^\/+={}"']+)/;
    var borderRadiusRegexp = /(([\d]+[px%])\s*)/g;   
    var CanvasElement = (function(_Container) {
        supers.inherits(CanvasElement, _Container);

        function CanvasElement(options) {
            var _this = supers.possibleConstructorReturn(this, _Container.call(this));

            // 图形的默认基本属性
            _this.type = 'rect';
            _this.width = 0;
            _this.height = 0;
            _this.backgroundColor = null;
            _this.border = '';

            _this.borderRadius = '';
            _this.borderTopLeftRadius = 0;
            _this.borderTopRightRadius = 0;
            _this.borderBottomRightRadius = 0;
            _this.borderBottomLeftRadius = 0;
            
            // 位置
            _this.left = null;
            _this.top = null;
            assign(_this, options || {});
        }

        /**
         * 继承仪式完成
         */
        CanvasElement.prototype.inheritsFinish = function() {
            // width height 处理
            this.parserSize();
            // border处理
            this.parserBorder(this.border);
            // borderRadius处理
            this.parserBorderRadius(this.borderRadius);
        }

        CanvasElement.prototype.setStyle = function(ctx) {
            // 设置样式
            // --设置border样式
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor;
            this.borderStyle === 'solid' && ctx.setLineDash([]);
            this.borderStyle === 'dash' && ctx.setLineDash([5, 5]);
            this.backgroundColor && (ctx.fillStyle = this.backgroundColor);
            ctx.closePath();
            
            this.backgroundColor && ctx.fill();
            ctx.stroke();
        }

        /**
         * 绘制矩形
         * @param {Object} position={left, top}
         */
        CanvasElement.prototype.rect = function(callback) {
            // 位置默认为{}
            if(this.isRectRound()) return this.reactRound();
            var ctx = this.ctx;

            ctx.beginPath();   
            ctx.rect(
                (this.left || this.left === 0) ? this.left : this.position.left, 
                (this.top || this.top === 0) ? this.top: this.position.top, 
                this.width, 
                this.height);
            
            callback && callback();
            // 设置样式
            // --设置border样式
            this.setStyle(ctx);
        };

        CanvasElement.prototype.text = function(callback) {
            var ctx = this.ctx;
            ctx.beginPath();
            
            callback && callback();
            ctx.fillStyle = 'black';
            ctx.font = '24px serif';
            ctx.fillText(this.textContent, this.position.left, this.position.top + 24);
        }

        /**
         * 2*Math.PI/360 = 弧度角/角度
         * @param {*} callback 
         */
        CanvasElement.prototype.reactRound = function(callback) {
            var ctx = this.ctx;
            
            ctx.beginPath();
            ctx.moveTo(this.position.left + this.borderTopLeftRadius[0], this.position.top);    
            // 右上角度
            ctx.arcTo(
                this.width, 
                this.position.top, 
                this.width, 
                this.position.top + this.borderTopRightRadius[1],  
                Math.min.apply(null, this.borderTopRightRadius));
            // 右下角度
            ctx.arcTo(
                this.width, 
                this.position.top + this.height, 
                this.width - this.borderBottomRightRadius[0],
                this.position.top + this.height,
                Math.min.apply(null, this.borderBottomRightRadius));
            // 左下角度
            ctx.arcTo(
                this.position.left,
                this.height,
                this.position.left,
                this.height - this.borderBottomLeftRadius[1],
                Math.min.apply(null, this.borderBottomLeftRadius)
            )
            // 左上角度
            ctx.arcTo(
                this.position.left,
                this.position.top,
                this.position.left + this.borderTopLeftRadius[0],
                this.position.top,
                Math.min.apply(null, this.borderTopLeftRadius)
            );

            callback && callback();
            this.setStyle(ctx);
        }
        CanvasElement.prototype.isRectRound = function() {
            if( 
                this.type === 'rect' &&
                (this.borderRadius ||
                this.borderTopLeftRadius ||
                this.borderTopRightRadius ||
                this.borderBottomRightRadius ||
                this.borderBottomLeftRadius)
            ) {
                return true;
            }
            return false;
        }

        /**
         * 解析size(width, height)内容
         */
        CanvasElement.prototype.parserSize = function() {
            if(!this.parent) return;
            if(/%/g.test(this.width)) {
                this.width = this.parent.width * (parseFloat(this.width)/100);
                console.log(this.width)
            }
            if(/%/g.test(this.height)) {
                this.height = this.parent.height * (parseFloat(this.height)/100);
            }
        }

        /**
         * 解析border内容
         * @param {String} border='1px solid red'
         */
        CanvasElement.prototype.parserBorder = function(border) {
            var borderStr = border.match(borderRegexp);
            // 默认border属性设置
            this.borderWidth = 0;
            this.borderStyle = '';
            this.borderColor = '';

            if(borderStr) {
                this.borderWidth = borderStr[1];
                this.borderStyle = borderStr[2];
                this.borderColor = borderStr[3];
            }
        }

        /**
         * 解析borderRadius内容
         * @example borderTopLeftRadius = [水平半径，垂直半径]
         * @param {String} borderRadius="2px" | "1px 3px 4px 10px"
         */
        CanvasElement.prototype.parserBorderRadius = function(borderRadius) {
            var _this = this;
            var borderRadius = borderRadius.match(borderRadiusRegexp);
            if(borderRadius) {
                // 内容为一
                if(borderRadius.length === 1) {
                    var result = borderRadius[0];
                    var result_num = parseFloat(result);
                    if(/p/g.test(result)) {
                        this.borderTopLeftRadius = [result_num, result_num];
                        this.borderTopRightRadius = [result_num, result_num];
                        this.borderBottomRightRadius = [result_num, result_num];
                        this.borderBottomLeftRadius = [result_num, result_num];
                        return;
                    }
                    if(/%/g.test(result)) {
                        var width = this.width * (result_num/100);
                        var height = this.height * (result_num/100);
                        this.borderTopLeftRadius = [width, height];
                        this.borderTopRightRadius = [width, height];
                        this.borderBottomRightRadius = [width, height];
                        this.borderBottomLeftRadius = [width, height];
                        return;
                    }
                }
                // 内容为二
                if(borderRadius.length === 2) {
                    var horizontal = borderRadius[0];
                    var vertical = borderRadius[1];

                    if(/p/g.test(horizontal)) {
                        horizontal = parseFloat(horizontal);
                    } 
                    if(/%/g.test(horizontal)) {
                        horizontal = this.width * (horizontal/100);
                    }
                    if(/p/g.test(vertical)) {
                        vertical = parseFloat(vertical);
                    } 
                    if(/%/g.test(vertical)) {
                        vertical = this.height * (vertical/100);
                    }

                    this.borderTopLeftRadius = [horizontal, vertical];
                    this.borderTopRightRadius = [horizontal, vertical];
                    this.borderBottomRightRadius = [horizontal, vertical];
                    this.borderBottomLeftRadius = [horizontal, vertical];
                    return;
                }
            }


        }

        return CanvasElement;
    })(supers.Container);
    supers.CanvasElement = CanvasElement;

    return this.supers;
});