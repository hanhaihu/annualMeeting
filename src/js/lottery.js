(function(){

	var URL_MEMBERS = '/meeting-ajax/luck/request-json-nianhui-luck-all',
		URL_YAO_FLAG = '/meeting-ajax/luck/request-json-nianhui-switch';

	var STATE_UP = 1;
	var STATE_SMOOTH = 2;
	var STATE_SLOW = 3;

	var SPEED_MIN = 1;

	var IMG_BATCH_COUNT = 10; // 开启多少的并发来加载图片

	var timer = null;

	var frameMap = {
		10 : 20,
		9 : 20,
		8 : 20,
		7 : 30,
		6 : 30,
		5 : 40,
		4 : 40,
		3 : 50,
		2 : 50,
		1 : 50
	}; // 一张变化多少次
	var speed = 10;// 一秒移动多少张
	var diff = null;// 两次运动的时间间隔
	var translateYUnit = null; // 一次运动之间的距离
	var count = null; // 运动次数

	var currSpeed = 0;
	var currFrame = 2;

	var tpl = null;
	var number = null;
	var doms = null;

	var currWinners = null;
	var members = null;

	var memberIndex = 0;

	var resultShowed = false;

	// 预加载完成的个数
	var imgLoadedCount = 0;


	function nextPersion(){
		var index = memberIndex;
		memberIndex++;
		if(memberIndex >= members.length){
			memberIndex = 0;
		}
		return members[index].headimgurl;
	}

	function nextWinner(index){
		return index < currWinners.length ? currWinners[index].headimgurl : 'images/lottery.jiang.png';
	}

	function random(){
		var win = false;
		if(state === STATE_UP){
			currSpeed++;
			if(currSpeed === speed){
				state = STATE_SMOOTH;
			}
			currFrame = frameMap[currSpeed];
			diff = 1000.0/currSpeed/currFrame;
			translateYUnit = 100.0/currFrame;
			console.log('speed:', currSpeed);
		}else if(state === STATE_SLOW){
			currSpeed--;
			if(currSpeed === SPEED_MIN){
				win = true;
			}
			currFrame = frameMap[currSpeed];
			diff = 1000.0/currSpeed/currFrame;
			translateYUnit = 100.0/currFrame;
			console.log('speed:', currSpeed);
		}
		count = 0;
		
		for(var i=0;i<number;i++){
			var img = win ? nextWinner(i) : nextPersion();
			var dom = $(doms[i]);
			var last = dom.children().last();
			last.siblings().remove();
			dom.append(tpl.replace('{img}', img));
		}
	}

	function position(){
		count++;
		if(count > currFrame){
			// 减速并且已经见到最小速度了
			if(currSpeed === SPEED_MIN && state === STATE_SLOW){
				showFinish();
				// 本次结束 10秒后显示下一次
				setTimeout(queryStatus, 10000);
				return ;
			}
			random();
		}

		var curr = count*translateYUnit;
		var translate = 'translateY(-'+ (curr) +'%)';
		for(var i=0;i<number;i++){
			var dom = $(doms[i]).children();
			dom.css('transform', translate);
		}

		setTimeout(position, diff);
	}

	function imgPreLoad(){
		var count = 0;
		function loadImg(url){
			var img = new Image();
			console.log('预加载图片,',url);
			// 发送完毕后删除元素，防止页面元素累加
			$(img).one('load error',function(){
				this.parentNode.removeChild(this);
				count++;
				console.log('图片已经预加载了', count, '张');
				if(imgLoadedCount < members.length){
					loadImg(members[imgLoadedCount].headimgurl);
					imgLoadedCount++;
				}
			});
			img.src = members[i].headimgurl;
			img.style.display = 'none';
			document.body.appendChild(img);
		}

		for(var i=0;i<IMG_BATCH_COUNT && i < members.length;i++){
			imgLoadedCount++;
			loadImg(members[i].headimgurl);
		}
	}

	// 结束了显示本次结果
	function showFinish(data){
		if(resultShowed){
			return ;
		}
		
		resultShowed = true;
		if(data){
			currWinners = data;
		}

		if(!number){
			number = currWinners.length;
		}

		$('#main').removeClass();
		$('#main').addClass('main num-' + number);

		$('.portrait').remove();
		$('.txts').children().remove();
		var tpl = $('#tpl-result').html(),
			txtTpl = $('#tpl-txt').html(),
			splitTpl = $('#tpl-split').html();
		
		for(var i=0;i<number;i++){
			$('.cover').before(tpl.replace('{img}', i < currWinners.length ? currWinners[i].headimgurl : 'images/lottery.jiang.png'));	

			if(number > 4 && i*2 === number){
				$('.txts').append(splitTpl);
			}

			$('.txts').append(txtTpl.replace('{txt}', i < currWinners.length ? (currWinners[i].number + currWinners[i].name) : ''));
		}
	}

	function start(){
		random();
		setTimeout(position, diff);
	}

	function letsgo(num){
		console.log('fast up...');
		resultShowed = false;
		state = STATE_UP;
		number = num;

		$('.portrait').remove();
		$('.txts').children().remove();
		var tpl = $('#tpl-portrait').html();
		for(var i=0;i<num;i++){
			$('.cover').before(tpl);	
		}

		var main = $('#main');
		main.removeClass();
		main.addClass('main num-' + num);

		doms = $('.portrait');
		start();
	}

	function letsStop(data){
		state = STATE_SLOW;
		currWinners = data;
		console.log('slow donw...');
	}

	function queryStopStatus(){
		utils.ajax({
			type : 'GET',
			url : URL_YAO_FLAG,

			success : function(resp){
				if(resp.flag === 1){
					if(resp.switch === 2){
						letsStop(resp.data);
						return ;
					}
				}
				setTimeout(queryStopStatus, 500);
			},
			error : function(){
				setTimeout(queryStopStatus, 500);
			}
		});
	}

	function queryStatus(){
		utils.ajax({
			type : 'GET',
			url : URL_YAO_FLAG,

			success : function(resp){
				if(resp.flag === 1){
					if(resp.switch === 1){
						letsgo(resp.number);
						queryStopStatus();
						return ;
					}else if(resp.switch === 2){
						showFinish(resp.data);
					}
				}
				setTimeout(queryStatus, 500);
			},
			error : function(){
				setTimeout(queryStatus, 500);	
			}
		});
	}

	function queryMembers(){
		utils.ajax({
			type : 'GET',
			url : URL_MEMBERS,

			success : function(resp){
				if(resp.flag === 1){
					members = resp.data;
					imgPreLoad();
					queryStatus();
				}
			}
		});
	}

	function init(){
		tpl = $('#tpl-img').html();
		queryMembers();
	}

	$(init);
}());