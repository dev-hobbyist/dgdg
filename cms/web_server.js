const http = require('http');
const express = require('express');
const api = require('./api.js');
var cors = require('cors');
const fs = require('fs');

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
