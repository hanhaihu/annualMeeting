(function(){
	var URL_STATUS = '/wx-meeting-ajax/bind/request-json-nianhui-bind-status';

	function showForm(){
		$('#pack-top').html($('#tpl-form').html());
		$('#bindBtn').on('click', function(){
			utils.bind();
		});
	}

	// 没有关注？显示二维码
	function showQrcode(data){
		$('.view').remove();
		$('#pack-top').html($('#tpl-qr').html().replace('{img}', data.imgurl));

		$('#pack-tip').html('长按二维码关注公众号');
		$('#pack-tip').addClass('concern');
	}

	function init(){
		utils.ajax({
			type : 'GET',
			url : URL_STATUS,

			success : function(resp){
				if(resp.flag === 0){
					showForm();
				}else if(resp.flag === 1){
					utils.bindSuc(resp.data);	
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

	$(init);
}());