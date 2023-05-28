const http = require('http');
const express = require('express');
const api = require('./api.js');
var cors = require('cors');
const fs = require('fs');
const site_generator = require('./site_generator');

var str = fs.readFileSync(__dirname + '/../site_config.json', 'utf-8');
var site_config = JSON.parse(str);

const blog_site = express();
http.createServer(blog_site).listen(site_config.http_port);
blog_site.use(express.static('../docs/'));

const cms_site = express();
cms_site.use(express.json({ limit: '50mb' }));
cms_site.use(cors());

http.createServer(cms_site).listen(site_config.cms_http_port);
cms_site.use(express.static('./docs'));
cms_site.use('/api', api);





///////////////

var category_ms = 0;
var index_ms = 0;
var keyword_ms = 0;
var post_ms = 0;
function intervalFunc() {
  fs.stat(__dirname + '/template/category.html', function(err, stat){
		if(category_ms != 0 && category_ms != stat.mtimeMs){
			site_generator.ExportAll();
		}
		category_ms = stat.mtimeMs;
	});
  fs.stat(__dirname + '/template/index.html', function(err, stat){
		if(index_ms != 0 && index_ms != stat.mtimeMs){
			site_generator.ExportAll();
		}
		index_ms = stat.mtimeMs;
	});
  fs.stat(__dirname + '/template/keyword.html', function(err, stat){
		if(keyword_ms != 0 && keyword_ms != stat.mtimeMs){
			site_generator.ExportAll();
		}
		keyword_ms = stat.mtimeMs;
	});
  fs.stat(__dirname + '/template/post.html', function(err, stat){
		if(post_ms != 0 && post_ms != stat.mtimeMs){
			site_generator.ExportAll();
		}
		post_ms = stat.mtimeMs;
	});
}

setInterval(intervalFunc, 1000);