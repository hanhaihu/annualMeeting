/*
 *所有JS都闭包
 */

(function() {
    var STATUS_UNSTARTED = -2,
        STATUS_STARTED = 1,
        STATUS_END = 2;

    var inited = false,
        countDownInited = false,
        commentsStarted = false,
        processShowed = false;

    var timer = null,
        countDownTimer = null,
        commentsTimer = null,
        commentsIntervalTime = 12000,
        intervalTime = 500;

    var terminalTime = null;

    var lastComments = [],
        lastCommentTime = null;

    var voteCount = null;
    var commentCount = null;

    function showComment(resp) {
        if (lastComments && lastComments.length > 0) {
            init_screen(resp);
        }
    }

    //初始化弹幕
    function init_screen(resp) {
        if ($(".d_show").find('div').length == 0) {
            var comment = $(".d_show div");
            var pFragment = document.createDocumentFragment();
            for (var i = 0; i < resp.data.length; i++) {
                var div = document.createElement("div");
                div.innerHTML = resp.data[i].message;
                pFragment.appendChild(div);
            }
            $('.d_show').append(pFragment);
            var _top = 0;
            $(".d_show").find("div").show().each(function() {
                var _left = $('.dm').width();
                var _height = $('.dm').height();
                _top = _top + 50;
                if (_top >= _height - 55) {
                    _top = 0;
                }
                $(this).css({
                    left: _left,
                    top: _top,
                    color: getReandomColor(),
                    fontSize: getRandomNumber()
                });
                var time = 4000;
                time = random(17000, 24000);
                $(this).animate({
                    left: "-1600px"
                }, time, function() {
                    $(this).remove();
                });
            });

        } else {
            var nextComment = $('.nextShow div');
            var nextpFragment = document.createDocumentFragment();
            for (var i = 0; i < resp.data.length; i++) {
                var ndiv = document.createElement("div");
                ndiv.innerHTML = resp.data[i].message;
                nextpFragment.appendChild(ndiv);
            }
            $('.nextShow').append(nextpFragment);
            var __top = 0;
            $(".nextShow").find("div").show().each(function() {
                var __left = $('.dm').width();
                var __height = $('.dm').height();
                __top = __top + 50;
                if (__top >= __height - 55) {
                    __top = 0;
                }
                $(this).css({
                    left: __left,
                    top: __top,
                    color: getReandomColor(),
                    fontSize: getRandomNumber()
                });
                var nexttime = 4000;
                nexttime = random(17000, 24000);
                $(this).animate({
                    left: "-1600px"
                }, nexttime, function() {
                    $(this).remove();
                });
            });

        }
    }

    //获取随机字体大小
    function getRandomNumber() {
        function random(min, max) {
            return Math.floor(min + Math.random() * (max - min));
        }
        return random(30, 40) + 'px';
    }

    function random(min, max) {
        return Math.floor(min + Math.random() * (max - min));
    }

    //获取随机颜色
    function getReandomColor() {
        var colorContainer=['white','yellow','#69f51c'];
        // return '#' + (function(h) {
        //     return new Array(7 - h.length).join("0") + h
        // })((Math.random() * 0x1000000 << 0).toString(16))
        return  colorContainer[random(0,3)];
    }

    function initList(data) {
        var tpl = $('#tpl-pro').html();
        var html = '';
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var itemHtml = tpl
                .replace('{order}', i + 1)
                .replace('{name}', item.name)
                .replace('{performer}', item.performer ?item.performer:'');
            html += itemHtml;
        }
        $('.voteResult').html(html);

    }

    function refreshList(data) {
        if (!processShowed) {
            processShowed = true;
            $('.process').addClass('active');
        }

        var programList = $('.showName');
        var performerList = $('.show .team');
        var counts = $('.vote .count');
        var percent = $('.vote .percent');
        var totalVote = null;
        var progressBar = $('.progress-bar-warning');

        //填充节目数据和得票数
        for (var i = 0; i < programList.length; i++) {
            programList[i].innerHTML = data.data.programs[i].name;
            performerList[i].innerHTML = data.data.programs[i].performer;
            counts[i].innerHTML = data.data.programs[i].vote_number + '票';
            totalVote += Number(data.data.programs[i].vote_number);
        }

        //填充节目得票百分比
        for (var i = 0; i < percent.length; i++) {
            var ratio = null;
            if (totalVote == 0) {
                ratio = 0;
            } else {
                ratio = (data.data.programs[i].vote_number / totalVote * 100);
            }
            ratio = (ratio).toFixed(2) + "%";
            percent[i].innerHTML = ratio;
            progressBar[i].style.width = ratio;
        }
    }

    function show(resp) {
        if (!inited) {
            initList(resp.data.programs);
            inited = true;
        }
        if (resp.flag !== STATUS_UNSTARTED) {
            refreshList(resp);
        }
    }

    function startTimer() {
        if (timer) {
            return;
        }
        timer = setInterval(query, intervalTime);
    }

    function startCountDownTimer(last_time) {
        if (countDownInited) {
            return;
        }
        countDownInited = true;
        var curr = parseInt(new Date().getTime() / 1000);
        terminalTime = curr + last_time;
        initCountDown();
        showCountDown();
        countDownTimer = setInterval(showCountDown, intervalTime);
    }

    function initCountDown() {
        $('.time').html($('#tpl-time').html());
    }

    function showCountDown() {
        var curr = parseInt(new Date().getTime() / 1000);
        var currLastTime = terminalTime - curr;

        if (currLastTime < 0) {
            clearInterval(countDownTimer);
             stopComments();
            $('.time').remove();
            return;
        }

        var sec = currLastTime % 60;
        var min = parseInt(currLastTime / 60);

        $('#minutes').text((min > 10 ? min : '0' + min) + '分');
        $('#seconds').text((sec > 10 ? sec : '0' + sec) + '秒');
    }

    function query() {
        utils.ajax({
            type: 'GET',
            url: "/meeting-ajax/program/vote-result",
            success: function(resp) {
                switch (resp.flag) {
                    case STATUS_UNSTARTED:
                        //未开始，显示列表
                        show(resp);
                        startTimer();
                        break;
                    case STATUS_STARTED:
                        //已开始，显示投票和弹幕;
                        show(resp);
                        startTimer();
                        startCountDownTimer(resp.data.last_time);
                        startComments();
                        break;
                    case STATUS_END:
                        show(resp);
                        clearInterval(timer);
                        stopComments();
                        $('.time').css('display', 'none');
                        break;
                }
            }
        });
    }

    function startComments() {
        if (commentsStarted) {
            return;
        }
        commentsStarted = true;
        queryComments();
        commentsTimer = setInterval(queryComments, commentsIntervalTime);
    }

    function stopComments() {
        clearInterval(commentsTimer);
    }

    function queryComments() {
        utils.ajax({
            type: "POST",
            url: '/meeting-ajax/message/list/request-json-array',
            data: {
                start: lastCommentTime ? lastCommentTime : '',
                count: 10
            },
            success: function(resp) {
                if (resp.flag == 1) {
                    if (resp.data && resp.data.length > 0) {
                        lastCommentTime = resp.data[resp.data.length - 1].time;
                        lastComments = resp.data;
                        showComment(resp);
                    }
                }
            }
        });
    }

    //注意是LED
    function init() {
        query();
    }

    $(init);

}());
