/*_______
with dances.plugins

	called: back2top

	version: 2.0_dev

	firstDate: 2012.04.11

	lastDate: 2013.05.06

	require: [
		dances.uAgent,
		dances.addCss,
		dances.El
	]

	effect: [
		+ 回到底部-快捷方式
		+ 参数 height 定义在高度为多少 px , 显示 button
		+ 参数 height 为负数时 , 尝试将 显示高度定义为 距离 height 页面高度
		+ {effects}
	]

	log: {
		"1.0": [
			+ 实现功能
			+ {logs}
		],
		
		"1.1": [
			+ 增加 effect 效果,随着滚动到页面底部逐渐增大透明
			+ {logs}
		],
		
		"2.0": [
			+ 适配 dances.amd
			+ TODO 去除 base.css 功能不正常
		]
	}

_______*/

/*_______

# dances.back2top

## syntax:
	dances.back2top(opts);

### opts
	opts = {
		// 文字内容
		text: "",

		// 特效
		effect   : false,

		// 触发距离
		// 正数表示距离顶部距离
		// 负数表示距离底部距离
		// 小数表示百分之多少的距顶部距离
		height   : -7000,

		// 取消默认 UI
		disableUI: false,

		// 返回顶部之后回调
		callback: function(){

		}
	};

_______*/

(function(exprots, name){

	var
		BackTop,
		backTop,
		fListenScroll,

		currentWindow = window,
		winAio = {},
		winArr = [currentWindow],
		winTouchArr = [],

		fValidArgs,

		fBind,
		fUnbind,

		hashKey = Math.random(),

		create = Object.create || (function(){

			var Foo = function(){ };

			return function(){

				if(arguments.length > 1){
					throw new Error('Object.create implementation only accepts the first parameter.');
				}

				var proto = arguments[0],
					type = typeof proto
					;

				if(!proto || ("object" !== type && "function" !== type)){
					throw new TypeError('TypeError: ' + proto + ' is not an object or null');
				}

				Foo.prototype = proto;

				return new Foo();
			}
		})(),

		forEach = "function" === typeof Array.forEach ?
			Array.forEach :
			function(arr, fn){
				var len,
					i,
					fHas
					;

				fHas = Object.prototype.hasOwnProperty;

				for(i = 0, len = arr.length; i < len; i++){
					fHas.call(arr, i) && fn(arr[i], i, arr);
				}

			}

		;

	fValidArgs = function(conf, requireType, defaultConf){
		var
			fType = dances.type
		;

		for(var prop in requireType){
			// 可配置参数
			if(requireType.hasOwnProperty(prop)){

				// 不符合的必须配置参数
				if(!conf.hasOwnProperty(prop) || requireType[prop].indexOf(fType(conf[prop])) === -1){
					// 必须配置参数 有推荐值
					if(defaultConf.hasOwnProperty(prop)){
						conf[prop] = defaultConf[prop];

						// 必须配置参数 没有推荐值
					}else{
						conf[prop] = null;
					}
				}
			}
		}

		return conf;
	};

	fListenScroll = function(){

		// TODO 加入调用时间限制
		forEach(winAio[currentWindow.back2top_hashKey].coreArr, function(_back){
			_back();
		});


	};

	fBind = function(){
		$(currentWindow)
			// 绑定 滚动事件
			.bind("scroll.dances_back2top", fListenScroll)
			// 绑定 resize事件
			.bind("resize.dances_back2top", function(){
				winAio[currentWindow.back2top_hashKey].viewH = dances.getViewSize().height;
				fListenScroll();
			})
		;
	};

	fUnbind = function(){
		$(currentWindow)
			.unbind("scroll.dances_back2top")
			.unbind("resize.dances_back2top")
		;
	};

	BackTop = {
		init: function(conf){
			var
				bPristine = true,

				base = winTouchArr,
				len = base.length,

				ss,

				backEl,

				_this = this
			;

			// 嗅探 window 是否初始化
			while(len--){
				if(currentWindow === base[len]){
					bPristine = false;
					break;
				}
			}

			if(bPristine){
				base.push(currentWindow);

				// hashKey_Aio
				winAio[hashKey] = {
					coreArr: [],

					// 获取视口高度
					viewH: dances.getViewSize().height
				};
				currentWindow.back2top_hashKey = hashKey;
				hashKey++;

				// 注册
				fBind();

				// 注入 css
				ss =
				'.dances-back2top{' +
				'right: 5px; bottom: 5px;' +
				((dances.uAgent.msie && dances.uAgent.msie < 7)
					?
					'position: absolute;' +
					'top: expression(eval(( document.documentElement && document.documentElement.scrollTop || document.body.scrollTop)+(document.documentElement && document.documentElement.clientHeight || document.body.clientHeight)-this.offsetHeight-(parseInt(this.currentStyle.marginTop,10)||0)-(parseInt(this.currentStyle.marginBottom,10)||0)-5));'
					:
					'position: fixed;'
					) +
				"}"
				;
				dances.addCss((
					conf.disableUI ?
						ss
						: ss +=
						  '.dances-back2top-ui{ ' +
						  'width: 1em; ' +
						  'padding: 3px; ' +
						  'word-wrap: break-word; ' +
						  'font-size: 12px; ' +
						  'text-align: center; ' +
						  'white-space: normal; ' +
						  'color: #fff; ' +
						  'background-color: #DBCC9F; ' +
						  'border-radius: 2px; ' +
						  'cursor: pointer; ' +
						  'line-height:14px; ' +
						  '}'
					), currentWindow.document.getElementsByTagName("head")[0])
				;

			}

			// 第一次调用 .back2top 去获取滚动条元素
			this.scrollEl = dances.uAgent.webkit ?
				currentWindow.document.body :
				currentWindow.document.documentElement
			;

			// 拷贝原始配置
			this.argsBak = dances.extend({}, conf);

			// 验证参数
			conf = fValidArgs(conf, {

				text     : "string",
				title    : "string",
				speed    : "number",
				height   : "number",
				effect   : "boolean",
				disableUI: "boolean",
				callback : "function"

			}, {
				text     : "返回顶部⇡",
				title    : "返回顶部",
				speed    : 0,
//				height   : scrollEl.scrollHeight / 2,
				height   : 500,
				effect   : false,
				disableUI: false
			});

			this.conf = conf;

			// 计算
			this.setHPoint(conf.height);

			backEl = dances.El(
				'<span id="dances-back2top" class="dances-back2top dances-back2top-ui none" title="返回顶部">' +
				'返回顶部⇡' +
				'</span>'
			);

			this.backEl = backEl;

			this.$backEl =
			$(backEl).bind("click.dances_back2top", function(){
				$(_this.scrollEl).animate({scrollTop: 0}, {
					duration: conf.speed,

					complete: function(){
						"function" === typeof conf.callback && conf.callback(backTop);
					}

				});
			})
			;

			backEl.firstChild.nodeValue = conf.text;
			backEl.setAttribute("title", conf.title);

			this.core = (function(_this){

				var
					bShow,

					iWin = winAio[currentWindow.back2top_hashKey],

					$backEl = _this.$backEl,
					scrollEl = _this.scrollEl,

					pointH = _this.pointH

				;

				if(_this.conf.effect){
					return function(){
						var
							degree
						;

						$backEl.css("opacity", 0).removeClass("none");
						degree = scrollEl.scrollTop / (pointH - iWin.viewH);
						degree < 1 ?
							$backEl.css("opacity", degree) :
							$backEl.css("opacity", 1)
						;

					};

				}else{
					return function(){
						if(scrollEl.scrollTop > pointH - iWin.viewH){
							if(!bShow){
								$backEl.removeClass("none");
								bShow = true;
							}
						}else{
							if(bShow){
								$backEl.addClass("none");
								bShow = false;
							}
						}
					};
				}

			})(this);

			winAio[currentWindow.back2top_hashKey].coreArr.push(this.core);

			// 页面加载后迅速执行一次
			$(function(){
				_this.$backEl.appendTo("body");
				fListenScroll();
			});

			this.init = function(){
				return this;
			};

			return this;
		},

		// 计算设定的高度
		setHPoint: function(height){
			var
				pointH,

				scrollEl = this.scrollEl
			;

			// 计算 百分比
			if(0 < height && height <= 1){
				pointH = scrollEl.scrollHeight * height;

				// 计算 负向模式
			}else if(height < 0){
				if(scrollEl.scrollHeight + height > 0){
					pointH = scrollEl.scrollHeight + height;
				}else{
					pointH = scrollEl.scrollHeight / 2;
				}

			}else if(0 === height){
				pointH = scrollEl.scrollHeight / 2;

			}else{
				pointH = height;
			}

			this.pointH = pointH;

			return this;
		},

		update: function(){
			this.setHPoint(this.argsBak);
			return this;
		},

		on: function(){

		},

		off: function(){

		},

		toggle: function(){

		}
	};

	backTop = function(){
		var
			back2top = create(BackTop)
		;

		back2top.init.apply(back2top, arguments);

		return back2top;
	};

	backTop.switchWindow = function(_win){
		var
			base = winArr,
			len = base.length,

			bPristine = true
		;

		if(currentWindow.top === top){

			while(len--){
				if(base[len] === _win){
					bPristine = false;
					break;
				}
			}

			bPristine && base.push(_win);

			currentWindow = _win;
		}

		return backTop;
	};

	backTop.resume = function(){
		if(!this.bOn){
			fBind();
			this.bOn = true;
		}

		return this;
	};

	backTop.pause = function(){
		if(this.bOn){
			fUnbind();
			this.bOn = false;
		}

		return this;
	};

	backTop.toggle = function(){
		this.bOn ? this.off() : this.on();
		return this;
	};

	exprots[name || "back2top"] = backTop;

	window.define && define.amd && define.amd.back2top && define(function(){
		return backTop;
	});

})(window.dances);