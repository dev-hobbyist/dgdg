function POST(url, req, cb){
	$.ajax({
		url: url,
		type: 'POST',
		data: JSON.stringify(req),
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		success: function (res) {
			cb(res);
		}
	});
}

function GET(url, cb){
	$.ajax({
		url:  url,
		type: 'GET',
		data: null,
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		success: function (res) {
			cb(res);
		}
	});
}
