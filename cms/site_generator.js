const fs = require('fs');
var service = require('./service.js');

function SiteGenerator(){
	var self = this;

	this.Export = async function(index){
		return new Promise(async function(resolve, reject){
			try{
				var post = null;
				var post_list = await service.GetPostList();
				for(var pi=0 ; pi<post_list.length ; pi++){
					if(post_list[pi].index == index){
						post = post_list[pi];
						break;
					}
				}
				if(post == null){
					reject('Failed to find post ' + index);
				}
				var category_list = await service.GetCategoryList();
				self.GeneratePost(post, category_list);

				resolve();
			}catch(err){
				console.debug('err ' + err);
				reject('Fail Export');
			}
		});
	};
	this.GeneratePost = function(post, category_list, site_config){
		var showdown  = require('showdown');
		converter = new showdown.Converter();

		var template = fs.readFileSync(__dirname + '/template/post.html', 'utf-8');
		var md_path = __dirname + `/posts/${post.year}/${post.month}/${post.index}.md`;
		var md = fs.readFileSync(md_path, 'utf-8');
		var md_html = converter.makeHtml(md);
		template = template.replace('{MD2HTML}', md_html);

		//TITLE
		template = template.replace(/{TITLE}/g, site_config.title);

		//POST_TITLE
		template = template.replace('{POST_TITLE}', post.title);

		//TIME_POSTED
		var date_posted = new Date(post.timestamp_posted);
		var date_posted_format = date_posted.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
		template = template.replace('{TIME_POSTED}', date_posted_format);

		//TIME_UPDATED
		var date_updated = new Date(post.timestamp_updated);
		var date_updated_format = date_updated.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
		if(date_posted_format == date_updated_format){
			template = template.replace('{TIME_UPDATED}', '');
		}else{
			date_updated_format = 'Updated at ' + date_updated_format
			template = template.replace('{TIME_UPDATED}', date_updated_format);
		}

		//KEYWORD
		{
			var h = `Keywords : `;
			var keyword_arr = post.keyword.split(',');
			for(var i=0 ; i<keyword_arr.length ; i++){
				var keyword = keyword_arr[i].trim();
				var keyword_low_case = keyword.toLowerCase();
				h += `
				<a href="../../../keyword/${keyword_low_case}.html">${keyword}</a>
				`;
			}
			template = template.replace('{KEYWORD}', h);
		}

		//CATEGORY_LIST_MENU
		template = self.Update_CATEGORY_LIST_MENU('../../..', template, category_list);

		var dir = __dirname + `/../docs/posts/${post.year}/${post.month}/`;
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir, { recursive: true });
		}		
		fs.writeFileSync(dir + `/${post.index}.html`, template);
	};
	this.ExportAll = async function(){
		return new Promise(async function(resolve, reject){
			try{
				fs.rmdirSync(__dirname + '/../docs/', {recursive: true, force: true});
				fs.mkdirSync(__dirname + '/../docs/');

				var post_list = await service.GetPostList();
				var category_list = await service.GetCategoryList();
				var site_config = await service.GetSiteConfig();

				//index html
				await self.GenerateIndex(site_config);

				//categories
				await self.GenerateCagetories(post_list, category_list, site_config);

				//Post
				for(var pi=0 ; pi<post_list.length ; pi++){
					var p = post_list[pi];
					self.GeneratePost(p, category_list, site_config);
				}

				//keyword
				await self.GenerateKeywordPages(post_list, category_list, site_config);

				resolve();
			}catch(err){
				console.debug('err ' + err);
				reject('Fail Export');
			}	
		});
	};
	//CATEGORY_LIST_MENU
	this.Update_CATEGORY_LIST_MENU = function(path, input, category_list){
		var h = '';
		for(var i=0 ; i<category_list.length ; i++){
			var c = category_list[i];
			h += `
			<span style="margin:5px">
				<a href="${path}/category/${c.category}.html">${c.category}</a>
			</span>
			`;
		}
		return input.replace('{CATEGORY_LIST_MENU}', h);
	};
	this.GenerateIndex = async function (site_config) {
		return new Promise(async function (resolve, reject) {
			try {
				var index_path = __dirname + `/template/index.html`;
				var index_content = fs.readFileSync(index_path, 'utf-8');

				var post_list = await service.GetPostList();
				var category_list = await service.GetCategoryList();

				//TITLE
				index_content = index_content.replace(/{TITLE}/g, site_config.title);

				//CATEGORY_LIST_MENU
				index_content = self.Update_CATEGORY_LIST_MENU('.', index_content, category_list);
				
				{//RECENT_POST_LIST_BY_CATEGORY
					var h = `<div class="row">`;
					for(var ci=0 ; ci<category_list.length ; ci++){
						var c = category_list[ci];

						h += `
						<div class="col-6 py-5">
							<div class="border py-1 px-1"><b>${c.category}</b></div>
						`;

						for(var pi=0 ; pi<post_list.length ; pi++){
							var p = post_list[pi];
							if(p.category_index == c.index){
								var date = new Date(p.timestamp_posted);
								var date_format = date.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});

								h += `
								<div class="px-3 py-1 d-flex">
									<div class="w-100">
										<a href="./posts/${p.year}/${p.month}/${p.index}.html?category=${c.category}&title=${p.title}">${p.title}</a>
									</div>
									<div class="w-100 text-right" style="font-size:0.8em; color:gray">
										${date_format}
									</div>
								</div>`;
							}
						}
						h += `</div>`;
					}
					h += `</div>`;

					index_content = index_content.replace('{RECENT_POST_LIST_BY_CATEGORY}', h);
				}
				
				fs.writeFileSync(__dirname + '/../docs/index.html', index_content);	

				resolve();
			} catch (err) {
				console.debug('err ' + err);
				reject('Fail GenerateIndex');
			}
		});
	};
	this.GenerateCagetories = async function (post_list, category_list, site_config) {
		return new Promise(async function (resolve, reject) {
			try {
				var dir = __dirname + `/../docs/category/`;
				if (!fs.existsSync(dir)){
					fs.mkdirSync(dir, { recursive: true });
				}		
		
				var template = fs.readFileSync(__dirname + `/template/category.html`, 'utf-8');

				// TITLE
				template = template.replace(/{TITLE}/g, site_config.title);

				//CATEGORY_LIST_MENU
				template = self.Update_CATEGORY_LIST_MENU('..', template, category_list);
				
				//Category title

				{//POST_LIST_BY_CATEGORY
					for(var ci=0 ; ci<category_list.length ; ci++){
						var c = category_list[ci];
						var html = template.replace('{CATEGORY_NAME}', c.category);
						// var html = template;

						var post_list_html = '';
						for(var pi=0 ; pi<post_list.length ; pi++){
							var p = post_list[pi];
							if(p.category_index == c.index){
								post_list_html += `
								<div><a href="../posts/${p.year}/${p.month}/${p.index}.html?category=${c.category}&title=${p.title}">${p.title}</a></div>
								`;
							}
						}
						html = html.replace('{POST_LIST_BY_CATEGORY}', post_list_html);

						fs.writeFileSync(__dirname + `/../docs/category/${c.category}.html`, html);	
					}

				}

				resolve();
			} catch (err) {
				reject('Fail GenerateCagetories');
			}
		});
	};
	this.GenerateKeywordPages = async function (post_list, category_list, site_config) {
		return new Promise(async function (resolve, reject) {
			try {
				var keyword_list = [];
				var keyword_page_list = [];

				for(var i=0 ; i<post_list.length ; i++){
					var post = post_list[i];
					var keyword_str = post.keyword;
					var keyword_arr = keyword_str.split(',');
					for(var k=0 ; k<keyword_arr.length ; k++){
						var keyword = keyword_arr[k].trim();
						keyword = keyword.toLowerCase();

						var keyword_found = false;
						for(var t=0 ; t<keyword_list.length ; t++){
							if(keyword_list[t] == keyword){
								keyword_found = true;
								break;
							}
						}
						if(keyword_found == false){
							keyword_list.push(keyword);
							keyword_page_list[keyword] = [];
						}

						var category = '';
						for(var c=0 ; c<category_list.length ; c++){
							if(category_list[c].index == post.category_index){
								category = category_list[c].category;
								break;
							}
						}
						keyword_page_list[keyword].push({
							year: post.year,
							month: post.month,
							index: post.index,
							title: post.title,
							category: category,
							timestamp_updated: post.timestamp_updated
						});
					}
				}

				var template = fs.readFileSync(__dirname + `/template/keyword.html`, 'utf-8');

				//TITLE
				template = template.replace(/{TITLE}/g, site_config.title);

				//CATEGORY_LIST_MENU
				template = self.Update_CATEGORY_LIST_MENU('..', template, category_list);

				var dir = __dirname + `/../docs/keyword/`;
				if (!fs.existsSync(dir)){
					fs.mkdirSync(dir, { recursive: true });
				}				

				for(var t=0 ; t<keyword_list.length ; t++){
					var keyword = keyword_list[t];
					var html = template.replace('{KEYWORD}', keyword);
					var post_list_html = '';
					for(var p=0 ; p<keyword_page_list[keyword].length ; p++){
						var post = keyword_page_list[keyword][p];						
						post_list_html += `
						<div><a href="../posts/${post.year}/${post.month}/${post.index}.html?category=${post.category}&title=${post.title}">${post.title}</a></div>
						`;
						html = html.replace('{POST_LIST_BY_KEYWORD}', post_list_html);
					}
					fs.writeFileSync(__dirname + `/../docs/keyword/${keyword}.html`, html);	
				}
				resolve();
			} catch (err) {
				console.debug('err ' + err);
				reject('Fail GenerateKeywordPages');
			}
		});
	};
};

module.exports = new SiteGenerator();