const http = require('http');
const express = require('express');
const api = require('./api.js');
var cors = require('cors');

const blog_site = express();
http.createServer(blog_site).listen(1080);
blog_site.use(express.static('../docs/'));

const cms_site = express();
cms_site.use(express.json({ limit: '50mb' }));
cms_site.use(cors());

http.createServer(cms_site).listen(1081);
cms_site.use(express.static('./docs'));
cms_site.use('/api', api);
