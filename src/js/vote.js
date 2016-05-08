/*
 *所有JS都闭包
 */

(function() {
    // 没有绑定？显示表单
    function showForm() {
        $('#main').empty();
        $('#main').append($('#tpl-form').html());
        $('#bindBtn').on('click', function() {
            utils.bind(bindSuc);
        });
    }

    // 没有关注？绑定二维码
    function showQrcode(data) {
        $('#main').append($('#tpl-qr').html().replace('{img}', data.imgurl));
    }

    // 绑定成功
    function bindSuc() {
        $('#startBtn').addClass('active');
        $('#startBtn').on('click', getStatus);
    }

    //禁止投票，置灰
    function unVote(resp) {
        showProgram(resp);
        $('.showList input').attr('disabled', 'true');
        $('.confirm').css('background', 'grey').text('时间未到');
        setTimeout(function() {
            alert("投票尚未开始");
        }, 2000);

    }
    //展示节目列表
    function showProgram(resp) {
        var html = $('#tpl-vote').html();
        $('#main').html(html);
        var tpl = $('#tpl-pro').html();
        var fragment = '';
        for (var i = 0; i < resp.data.programs.length; i++) {
            var item = resp.data.programs[i];
            var itemHtml = tpl.replace('{name}', item.name).replace('{performer}', item.performer ? item.performer : '')
            fragment += itemHtml;
        }
        $('.showList').html(fragment);
        $('.showList li').each(function(index) {
            $(this).data('id', resp.data.programs[index].id);
        })
    }
    //展示投票结果
    function showResult(data) {
        var html = $('#tpl-voteResult').html();
        $('#main').html(html);
        var resultTpl = $('#tpl-result').html();
        var newFragment = '';
        var totalVote = null;
        for (var i = 0; i < data.data.programs.length; i++) {
            totalVote += Number(data.data.programs[i].vote_number);
        }
        for (var i = 0; i < data.data.programs.length; i++) {
            var resultItem = data.data.programs[i];
            var resultItemHtml = resultTpl.replace('{order}', i + 1)
                .replace('{name}', resultItem.name)
                .replace('{performer}', resultItem.performer ? resultItem.performer : '')
                .replace('{count}', resultItem.vote_number + '票')
                .replace('{percent}', totalVote == 0 ? '0.00'+'%':(resultItem.vote_number / totalVote * 100).toFixed(2) + "%")
                .replace('{process}', 'width:' + (totalVote == 0 ? '0.00'+'%' : (resultItem.vote_number / totalVote * 100).toFixed(2) + "%"));
            newFragment += resultItemHtml;
        }
        $('.voteResult').html(newFragment)
        badgePosition(data); //印章位置
    }

    function badgePosition(data) {
        var programId = data.data.program_id;
        switch (programId) {
            case 1:
                $('.badge').css('top', '15.4%');
                break;
            case 2:
                $('.badge').css('top', '23.6%');
                break;
            default:
                var top = ((programId - 2) * 0.075 + 0.236) * 100;
                top += "%";
                $('.badge').css('top', top);
        }
    }


    //绑定 checkbox点击事件
    function voting() {
        var choice = $('.showList li .choice');
        for (var i = 0; i < choice.length; i++) {
            choice[i].onclick = function() {
                $('.checked')
                    .css('display', 'none')
                    .attr('checked', 'no');

                var checkbox = $(this).parent().find('.checked');
                checkbox
                    .css('display', 'block')
                    .attr('checked', 'yes');
            }
        }

        $('.confirm').on('click', function() {
            var program_id = getPRId();
            confirmVote(program_id);
        });
    }

    //获得节目id;
    function getPRId() {
        var checkbox = $('.checked[checked="yes"]');
        return checkbox.parents('li').data('id');
    }

    //发送投票
    function confirmVote(program_id) {
        utils.ajax({
            type: 'POST',
            url: '/wx-meeting-ajax/program/vote',
            data: {
                programid: program_id

            },
            success: function(data) {
                if (data.flag == 1 && data.data.program_id != -1) {
                    showResult(data);
                } else if (data.flag == 0) {
                    alert('发送失败请重新发送');
                } else {

                }
            }
        });
    }

    //切换未绑定与绑定时的背景
    function changeBackground() {
        $('#main').removeClass('short').addClass('full');
    }

    //切换body默认背景
    function changeDefault() {
        $('body').css({ 'background': 'url(../../images/result.red.jpg) repeat-y', 'background-size': 'contain' });

    }

    //获取投票状态信息

    function getStatus() {
        utils.ajax({
            type: 'GET',
            url: '/wx-meeting-ajax/program/info',
            success: function(resp) {
                changeDefault();
                if (resp.flag === -2) { //未到投票时间
                    changeBackground();
                    unVote(resp);
                } else if (resp.flag === 1 && resp.data.program_id === -1) { //投票进行中，
                    changeBackground();
                    showProgram(resp);
                    voting();
                } else if (resp.flag === 1 && resp.data.program_id != -1) { //投票进行中,已经投过票
                    changeBackground();
                    showResult(resp) //有印章
                } else if (resp.flag == 2 && resp.data.program_id === -1) { //投票已结束，没有投票
                    changeBackground();
                    showResult(resp);
                    removeBadge(); //无印章
                } else if (resp.flag == 2 && resp.data.program_id != -1) { //投票已结束，已投票
                    changeBackground();
                    showResult(resp) //有印章。
                }
            },
            unbind: function(data) {
                changeDefault();
                showForm();
                $('#main').addClass('short');
            },
            unconcern: function(data) {
                changeDefault();
                showQrcode(data.data);
                $('#main').addClass('short');
            }

        });
    }
    //去除印章
    function removeBadge() {
        $('.badge').css('display', 'none');
    }

    //初始化
    function init() {
        getStatus();
    }

    $(init);

}());
