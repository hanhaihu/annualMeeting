(function(){
	// 没有关注？显示二维码
	function showQrcode(data){
		$('.view').remove();
		$('#pack-top').html($('#tpl-qr').html().replace('{img}', data.imgurl));

		$('#pack-tip').html('长按二维码关注公众号');
		$('#pack-tip').addClass('concern');
	}

	function init(){
		showQrcode({
			imgurl : '/qcode.jpg'
		})
	}

	$(init);
}());