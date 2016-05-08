(function(){
	var URL_STATUS = '/wx-meeting-ajax/shake/status',
		URL_SHAKE = '/wx-meeting-ajax/shake/shakehb';

	var STATUS_UNKONW = 0,
		STATUS_WATTING = 1,
		STATUS_SHAKING = 2,
		STATUS_END = 3,
		STATUS_RESULT = 4;

	var shakeStart = null,
		shakeEnd = null;

	var timer = null,
		endTimer = null;


	var shakeRequest = false;

	var status = STATUS_UNKONW;

	// 没有绑定？显示表单
	function showForm(){
		$('.view').remove();
		$('#main').append($('#tpl-form').html());
		$('body').addClass($('#tpl-form').data('body'));
		$('#bindBtn').on('click', function(){
			utils.bind(bindSuc);
		});
	}

	// 没有关注？显示二维码
	function showQrcode(data){
		$('.view').remove();
		$('#main').append($('#tpl-qr').html().replace('{img}', data.imgurl));
		$('body').addClass($('#tpl-qr').data('body'));
	}

	// 绑定成功
	function bindSuc(){
		$('#startBtn').addClass('active');
		$('#startBtn').on('click', startShake);
	}

	// 开始摇
	function startShake(){
		$('#form-container').remove();
		$('body').removeClass($('#tpl-form').data('body'));
		query();
	}

	// 结束摇
	function theEnd(){
		status = STATUS_END;
		shakeStart = null;
		shakeEnd = null;
		$('#wtime').html($('#tpl-end').html());
		$('#wtime').addClass('end');
	}

	// 倒计时
	function waitting(data){
		$('#topTip').html('距摇奖开始还有');
		status = STATUS_WATTING;

		// 本次时长
		var timeLen = data.end_time - data.begin_time;
		// 还有多久开始
		var startRemain = data.begin_time - data.current_time;
		// 当前时间
		var curr = parseInt(new Date().getTime()/1000);

		shakeStart = curr + startRemain;
		shakeEnd = shakeStart + timeLen;

		refresh();
		startTimer();
	}

	// 到摇的时间啦
	function startShaking(data){
		// 本次时长
		var timeLen = data.end_time - data.begin_time;
		// 还有多久开始
		var startRemain = data.begin_time - data.current_time;
		// 当前时间
		var curr = parseInt(new Date().getTime()/1000);

		shakeStart = curr + startRemain;
		shakeEnd = shakeStart + timeLen;
		shaking();
	}

	// 刷新倒计时
	function refresh(){
		var html = '';
		var curr = parseInt(new Date().getTime()/1000);

		var currLimit = shakeStart - curr;

		var hour=0,min=0,sec=0;

		if(currLimit > 0){
			html = $('#tpl-time').html();
			sec = currLimit%60;
			currLimit = parseInt(currLimit/60);

			min = currLimit%60;
			currLimit = parseInt(currLimit/60);

			hour = currLimit;

			html = html.replace('{h}', hour < 10 ? '0'+hour : hour);
			html = html.replace('{m}', min < 10 ? '0'+min : min);
			html = html.replace('{s}', sec < 10 ? '0'+sec : sec);
		}else{
			stopTimer();
			shaking();
		}
		$('#wtime').html(html);
	}

	// 停止倒计时定时器
	function stopTimer(){
		if(timer){
			clearInterval(timer);
			timer = null;
		}
	}

	// 开始倒计时定时器
	function startTimer(){
		stopTimer();
		timer = setInterval(refresh, 1000);
	}

	// 停止一下请求的定时器
	function stopEndTimer(){
		if(endTimer){
			clearTimeout(endTimer);
			endTimer = null;
		}
	}

	// 下一次请求的定时器
	function startEndTimer(){
		stopEndTimer();
		var curr = parseInt(new Date().getTime()/1000);
		var endLimit = shakeEnd - curr;
		endTimer = setTimeout(reset, endLimit*1000);
	}

	// 修改摇的样式
	function shaking(){
		status = STATUS_SHAKING;
		$('#topTip').html('');
		$('#phone').addClass('shake animated infinite');
		handleShakingEvent();
		startEndTimer();
	}

	// x,y,z任意两个方位摇得快就算快速摇动
	function isFastSpeed(speeds, minSpeed){
		var fastCount = 0;
		for(var i=0;i<speeds.length;i++){
			if(speeds[i] > minSpeed){
				fastCount++;
			}
		}
		return fastCount>=2;
	}

	// 摇动事件监听处理
	function handleShakingEvent(){
		var minSpeed = 100,
			fastCount = 0,
			timeScope = 80,
		    x = y = z = last_x = last_y = last_z = null;

		// 统计依据, 指定时间内连续超过某个速度，就认为在快速的摇
		var earlyTime = 0;
		var keepTime = 0;
		function detect(eventData){
			if(status !== STATUS_SHAKING){
				unbindEvent(detect);
				return ;
			}

			var acceleration = eventData.accelerationIncludingGravity,
		        currTime = new Date().getTime();

		    x = acceleration.x;
			y = acceleration.y;
			z = acceleration.z;

			// 第一次，先记录一个位置
		    if(last_x === null){
		    	last_x = x;
		    	last_y = y;
		    	last_z = z;
		    	last_update = currTime;
		    	return ;
		    }
		    var diffTime = currTime - last_update;
	        last_update = currTime;
	        var speedX = Math.abs(last_x-x) * 1000 / diffTime;
	        var speedY = Math.abs(last_y-y) * 1000 / diffTime;
	        var speedZ = Math.abs(last_z-z) * 1000 / diffTime;
	        var isFast = isFastSpeed([speedX, speedY, speedZ], minSpeed);
	        if(isFast){
	        	if(earlyTime === 0){
	        		// 高速的第一个时间点
	        		earlyTime = currTime;
	        	}else{
	        		// 高速保持了多久？
	        		keepTime = currTime - earlyTime;
	        	}

	        	// 连续保持多少次高速
	        	fastCount++;
	        }else{
	        	fastCount = 0;
	        	keepTime = 0;
	        	earlyTime = 0;
	        }

	        if (fastCount > 1 && keepTime >= timeScope) {
	        	// 摇一次就停止事件监听，等下一次再重新监听
	        	unbindEvent(detect);
	            doShake();
	        }
	        
	        last_x = x;
	        last_y = y;
	        last_z = z;
		}

		window.addEventListener('devicemotion', detect, false);
		shaked = false;
	}

	function unbindEvent(method){
		setTimeout(function(){
			window.removeEventListener('devicemotion', method);	
		}, 1);
		
	}

	// 向服务器请求红包
	function doShake(){
		if(shakeRequest){
			return ;
		}

		shakeRequest = true;
		var count = 0;
		utils.ajax({
			type : 'GET',
			url : URL_SHAKE,

			success : function(resp){
				if(resp.flag === 1){
					if(resp.data.amount){
						showAmount(resp.data);
					}else{
						showAd(resp.data);
					}		
				}else{
					doNextShake();	
				}
				shakeRequest = false;
			},
			unbind : function(data){
				showForm();
			},
			error : function(){
				shakeRequest = false;
				doNextShake();
			}
		});
	}

	// 一次摇完了，开始下一次摇
	function doNextShake(){
		setTimeout(handleShakingEvent,1000);
	}

	function showResult(data){
		var html = $('#tpl-result').html();
		
		$('#main').children('.view').remove();
		$('#main').append(html);
		$('body').addClass($('#tpl-result').data('body'));

		$('#ctuBtn').on('click', function(){
			$('#main').children('.view').remove();
			$('body').removeClass($('#tpl-result').data('body'));
			query();
		});
	}

	// 展示摇中的红包
	function showAmount(data){
		status = STATUS_RESULT;
		showResult(data);

		// 广告
		var moneyHtml = $('#tpl-money').html();
		moneyHtml = moneyHtml.replace('{money}', data.amount);
		$('#pack-top').html(moneyHtml);

		// 新年祝福
		$('#pack-tip').html($('#tpl-tip').html());
	}

	// 展示广告
	function showAd(data){
		status = STATUS_RESULT;
		showResult(data);

		// 广告
		var adHtml = $('#tpl-ad').html();
		adHtml = adHtml.replace('{href}', data.clickurl || 'javascript:void(0)');
		adHtml = adHtml.replace('{img}', data.imgurl || 'javascript:void(0)');
		$('#pack-top').html(adHtml);

		// 新年祝福
		$('#pack-tip').html($('#tpl-nyear').html());
	}

	// 展示摇红包的背景灯
	function show(){
		if($('#topTip').size() !== 0){
			return ;
		}
		$('.view').remove();
		$('#main').append($('#tpl-bonus').html());
		$('body').addClass($('#tpl-bonus').data('body'));
		$('#bindBtn').on('click', function(){
			utils.bind(bindSuc);
		});
	}

	// 本次结束，重置定时器并请求下次时间
	function reset(){
		stopTimer();
		stopEndTimer();
		$('#phone').removeClass('shake animated infinite')
		$('#topTip').html('');
		$('#wtime').html('');
		query();
	}

	// 查询摇奖时间
	function query(){
		utils.ajax({
			type : 'GET',
			url : URL_STATUS,

			success : function(resp){
				if(resp.flag === 1){
					show();
					if(!resp.data || !resp.data.begin_time){
						theEnd();
					}else if(resp.data.current_time < resp.data.begin_time){
						waitting(resp.data);
					}else if(resp.data.current_time > resp.data.begin_time && resp.data.current_time < resp.data.end_time){
						startShaking(resp.data);
					}else{
						theEnd();
					}
				}
			},
			unbind : function(data){
				showForm();
			},
			unconcern : function(resp){
				showQrcode(resp.data);
			}
		});
	}
	
	function init(){
		query();
	}

	$(init);
}());