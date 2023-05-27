var express = require('express');
var service = require('./service.js');
var site_generator = require('./site_generator.js');
var router = express.Router();
const fs = require('fs');

router.post('/save_post', async function(req, res){
	try{
		var data = req.body;
		var post_list = await service.GetPostList();

		var dateObj = new Date();
		var month = dateObj.getUTCMonth() + 1; //months from 1-12
		var year = dateObj.getUTCFullYear();

		var post_index = post_list.length + 1;
		var timestamp = new Date().getTime();

		await service.SavePost(year, month, post_index, data);
		
		post_list.push({
			year: year,
			month: month,
			index: post_index,
			title: data.title,
			category_index: data.category_index,
			keyword: keyword,
			timestamp_posted: timestamp,
			timestamp_updated: timestamp,
		});
		await service.SavePostList(post_list);

		res.send({
			ok:1,
			post_index: post_index
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to save_post'
		});
	}
});

router.post('/update_post', async function(req, res){
	try{
		var data = req.body;
		var index = data.index;
		var title = data.title;
		var year = data.year;
		var month = data.month;
		var category_index = data.category_index;
		var keyword = data.keyword;
		var timestamp = new Date().getTime();

		await service.SavePost(year, month, index, data);
		
		var post_list = await service.GetPostList();
		for(var i=0 ; i<post_list.length ; i++){
			if(post_list[i].index == index){
				post_list[i].title = title;
				post_list[i].category_index = category_index;
				post_list[i].keyword = keyword;
				post_list[i].timestamp_updated = timestamp;
				break;
			}
		}
		await service.SavePostList(post_list);

		res.send({
			ok:1,
			index: index
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to save_post'
		});
	}
});

router.get('/get_post_list', async function(req, res){
	try{
		var post_list = await service.GetPostList();
		res.send({
			ok:1,
			post_list: post_list
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to get_post_list'
		});
	}
});

router.get('/get_post', async function(req, res){
	try{
		console.debug('req.query.year ' + req.query.year);
		var path = __dirname + `/posts/${req.query.year}/${req.query.month}/${req.query.index}.md`;
		var md = fs.readFileSync(path, "utf-8");
		console.debug('md ' + md);
		// var post_list = await service.GetPostList();
		res.send({
			ok:1,
			md: md
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to get_post'
		});
	}
});

router.get('/export', async function(req, res){
	try{
		await site_generator.Export(req.query.index);
		res.send({
			ok:1
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to export'
		});
	}
});

router.get('/export_all', async function(req, res){
	try{
		await site_generator.ExportAll();
		res.send({
			ok:1
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to export'
		});
	}
});

router.post('/add_category', async function(req, res){
	try{
		var category = req.body.category;
		var category_list = await service.GetCategoryList();
		var index = category_list.length + 1;
		category_list.push({
			index: index,
			category: category
		});
		await service.SaveCategoryList(category_list);

		res.send({
			ok:1
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to add_category'
		});
	}
});

router.post('/edit_category', async function(req, res){
	try{
		var index = req.body.index;
		var category = req.body.category;
		var category_list = await service.GetCategoryList();
		for(var i=0 ; i<category_list.length ; i++){
			if(category_list[i].index == index){
				category_list[i].category = category;
			}
		}
		await service.SaveCategoryList(category_list);

		res.send({
			ok:1
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to edit_category'
		});
	}
});

router.get('/get_category_list', async function(req, res){
	try{
		var category_list = await service.GetCategoryList();
		res.send({
			ok:1,
			category_list: category_list
		});
	}catch(err){
		console.error(err);
		res.send({
			ok:0,
			err:'failed to get_category_list'
		});
	}
});

module.exports = router;