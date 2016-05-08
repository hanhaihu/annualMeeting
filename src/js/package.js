(function(){
	var URL_STATUS = '/wx-meeting-ajax/shake/status',
		URL_TOP5 = '/meeting-ajax/shake/top-result';

	// 开始或者结束的时间,秒数
	var shakeStart = null,
		shakeEnd = null;

	var timer = null;

	function startCounter(data){
		// 还有多久结束
		var startRemain = data.end_time - data.current_time;
		// 浏览器当前时间
		var curr = parseInt(new Date().getTime()/1000);

		shakeEnd = curr + startRemain;
		refreshTime();
		startTimer();
	}

	function refreshTime(){
		var diff = $('#diff');
		if(diff.length === 0){
			$('.view').remove();
			$('body').append($('#tpl-diff').html());
			diff = $('#diff');
		}

		var curr = parseInt(new Date().getTime()/1000);

		var currLimit = shakeEnd - curr;

		var hour=0,min=0,sec=0;

		if(currLimit >= 0){
			var html = $('#tpl-time').html();
			sec = currLimit%60;
			min = parseInt(currLimit/60);

			html = html.replace('{m}', min < 10 ? '0'+min : min);
			html = html.replace('{s}', sec < 10 ? '0'+sec : sec);
			diff.find('.time').html(html);
		}

		if(currLimit <= 0){
			stopTimer();
			queryTop5();
			// 查询top5 10秒后，再看看有没有下次
			setTimeout(nextQuery, 10000);
		}
	}

	function startTimer(){
		stopTimer();
		timer = setInterval(refreshTime, 500);
	}

	function stopTimer(){
		if(timer){
			clearInterval(timer);
			timer = null;
		}
	}

	// 查询摇奖时间
	function query(top5Showed){
		utils.ajax({
			type : 'GET',
			url : URL_STATUS,

			success : function(resp){
				if(resp.flag === 1){
					// 正在摇
					if(resp.data && resp.data.begin_time && resp.data.current_time >= resp.data.begin_time && resp.data.current_time < resp.data.end_time){
						startCounter(resp.data);

					// 没到时间呢？
					}else if(resp.data && resp.data.begin_time && resp.data.current_time < resp.data.begin_time){
						// 多少时间后开始下一次
						var nextTime = resp.data.begin_time - resp.data.current_time;
						nextTime = nextTime*1000;
						setTimeout(query, nextTime);
					}else if(!top5Showed){
						queryTop5();
					}	
				}
			}
		});
	}

	function nextQuery(){
		console.log('next query');
		query(true);
	}
	
	function queryTop5(){
		utils.ajax({
			type : 'GET',
			url : URL_TOP5,

			success : function(resp){
				if(resp.flag === 1){
					showTop5(resp.data);
				}
			}
		});
	}

	function showTop5(data){
		$('.view').remove();
		$('body').append($('#tpl-table').html());

		var tpl = $('#tpl-tr').html();
		var html = '';
		for(var i=0;i<data.length;i++){
			var item = data[i];
			var itemHtml = tpl.replace('{num}', i+1);
			itemHtml = itemHtml.replace('{img}', item.headimgurl);
			itemHtml = itemHtml.replace('{name}', item.name);
			itemHtml = itemHtml.replace('{amount}', item.amount);
			html += itemHtml;
		}
		$('table').html(html);
	}

	function init(){
		query();
	}

	$(init);
}());