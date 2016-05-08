(function(global){
	var FLAG_UNBIND = -1,FLAG_UNCONCERN = -10,FLAG_SUC = 1;

	var URL_STATUS = '/wx-meeting-ajax/bind/request-json-nianhui-bind-status',
		URL_BIND = '/wx-meeting-ajax/bind/request-json-nianhui-bind';

	// http拦截器
	function ajaxProxy(opts){
		var suc = opts.success;
		var unbind = opts.unbind;
		var unconcern = opts.unconcern;
		opts.dataType = 'json';

		var data = opts.data;
		if(!data){
			data = {};
		}
		var openidDom = $('#openid');
		if(openidDom && openidDom.length > 0){
			data.openid = $.trim(openidDom.html());	
		}
		opts.data = data;
		opts.success = function(data){
			switch(data.flag){
				case FLAG_UNCONCERN:
					unconcern && unconcern.apply(this, arguments);		
					break;
				case FLAG_UNBIND:
					unbind && unbind.apply(this, arguments);		
					break;
				default:
					suc && suc.apply(this, arguments);
			}
		};	
	}

	// 工具类
	var utils = {
		ajax : function(opts){
			ajaxProxy(opts);
			$.ajax(opts);
		},

		bind : function(cb){
			var number = $.trim($('#input-number').val());
			var name = $.trim($('#input-name').val());
			if(!number || !name){
				utils.bindErr('工号和姓名不能为空!');
				return ;
			}
			utils.bindErr('');

			utils.ajax({
				type : 'POST',
				url : URL_BIND,
				data : {
					number : number,
					name : name
				},
				success : function(resp){
					if(resp.flag === 1){
						utils.bindSuc({
							number : number,
							name : name
						});	

						cb && cb();
					}else{
						utils.bindErr(resp.msg);
					}
				}
			});
		},

		bindSuc : function(data){
			var html = $('#tpl-bind').html();
			html = html.replace('{number}', data.number);
			html = html.replace('{name}', data.name);
			$('#pack-top').html(html);
		},

		bindErr : function(msg){
			$('#errTxt').html(msg);
		}
	};

	global.utils = utils;
}(window));

(function(){

	try{
		var ua = navigator.userAgent.toLowerCase();  
	    if(ua.match(/MicroMessenger/i) == "micromessenger") { 
	    	document.write('<script src="https://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>');	
	    	document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {
        		WeixinJSBridge.call('hideOptionMenu');
    		});
	    }
		
	}catch(e){
		console.log('err,', e);
	}
	
}());