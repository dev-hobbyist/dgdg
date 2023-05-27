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
	this.GeneratePost = function(post, category_list){
		var showdown  = require('showdown');
		converter = new showdown.Converter();

		var template = fs.readFileSync(__dirname + '/template/post.html', 'utf-8');
		var md_path = __dirname + `/posts/${post.year}/${post.month}/${post.index}.md`;
		var md = fs.readFileSync(md_path, 'utf-8');
		var md_html = converter.makeHtml(md);
		template = template.replace('{MD2HTML}', md_html);

		//TITLE
		template = template.replace('{TITLE}', post.title);

		var date_posted = new Date(post.timestamp_posted);
		var date_posted_format = date_posted.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
		template = template.replace('{TIME_POSTED}', date_posted_format);

		var date_updated = new Date(post.timestamp_updated);
		var date_updated_format = date_updated.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});

		if(date_posted_format == date_updated_format){
			template = template.replace('{TIME_UPDATED}', '');
		}else{
			date_updated_format = 'Updated at ' + date_updated_format
			template = template.replace('{TIME_UPDATED}', date_updated_format);
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
				var post_list = await service.GetPostList();
				var category_list = await service.GetCategoryList();

				//index html
				await self.GenerateIndex();
				await self.GenerateCagetories(post_list, category_list);

				//Post
				for(var pi=0 ; pi<post_list.length ; pi++){
					var p = post_list[pi];
					self.GeneratePost(p, category_list);
				}

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
				<a href="${path}/category_${c.index}.html?name=${c.category}">${c.category}</a>
			</span>
			`;
		}
		return input.replace('{CATEGORY_LIST_MENU}', h);
	};
	this.GenerateIndex = async function () {
		return new Promise(async function (resolve, reject) {
			try {
				var index_path = __dirname + `/template/index.html`;
				var index_content = fs.readFileSync(index_path, 'utf-8');

				var post_list = await service.GetPostList();
				var category_list = await service.GetCategoryList();

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
				reject('Fail GenerateIndex');
			}
		});
	};
	this.GenerateCagetories = async function (post_list, category_list) {
		return new Promise(async function (resolve, reject) {
			try {
				var template = fs.readFileSync(__dirname + `/template/category.html`, 'utf-8');

				//CATEGORY_LIST_MENU
				template = self.Update_CATEGORY_LIST_MENU('.', template, category_list);
				
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
								<div><a href="./posts/${p.year}/${p.month}/${p.index}.html?category=${c.category}&title=${p.title}">${p.title}</a></div>
								`;
							}
						}
						html = html.replace('{POST_LIST_BY_CATEGORY}', post_list_html);

						fs.writeFileSync(__dirname + `/../docs/category_${c.index}.html`, html);	
					}

				}

				resolve();
			} catch (err) {
				reject('Fail GenerateCagetories');
			}
		});
	};
};

module.exports = new SiteGenerator();