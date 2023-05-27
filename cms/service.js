const fs = require('fs');

function Service(){
	var self = this;
	this.GetSiteConfig = async function(){
		return new Promise(async function(resolve, reject){
			try{
				var site_config = {};
				var str = fs.readFileSync(__dirname + '/../site_config.json', "utf8");
				if(str){
					site_config = JSON.parse(str);
				}
				resolve(site_config);
			}catch(err){
				console.debug('FAIL GetSiteConfig');
				resolve(null);
			}
		});
	};
	this.GetPostList = async function(){
		return new Promise(async function(resolve, reject){
			try{
				var path = __dirname + '/posts/_post_list.json';
				var file_content = fs.readFileSync(path, "utf8");
				var post_list = JSON.parse(file_content);
				resolve(post_list);
			}catch(err){
				console.debug('FAIL GetPostList');
				resolve([]);
			}
		});
	};
	this.SavePostList = async function(post_list){
		return new Promise(async function(resolve, reject){
			try{
				var path = __dirname + '/posts/_post_list.json';
				fs.writeFileSync(path, JSON.stringify(post_list));
				resolve([]);
			}catch(err){
				console.debug('FAIL SavePostList');
				resolve([]);
			}
		});
	};
	this.SavePost = async function(year, month, index, data){
		return new Promise(async function(resolve, reject){
			try{
				var dir = __dirname + `/posts/${year}/${month}`;
				if (!fs.existsSync(dir)){
					fs.mkdirSync(dir, { recursive: true });
				}

				var path = __dirname + `/posts/${year}/${month}/${index}.md`;
				fs.writeFileSync(path, data.md);
				resolve();
			}catch(err){
				console.debug('err ' + err);
				reject('Fail SavePost');
			}	
		});
	};

	this.GetCategoryList = async function(){
		return new Promise(async function(resolve, reject){
			try{
				var path = __dirname + '/posts/_category_list.json';
				var file_content = fs.readFileSync(path, "utf8");
				var category_list = JSON.parse(file_content);
				resolve(category_list);
			}catch(err){
				console.debug('FAIL GetCategoryList');
				resolve([]);
			}
		});
	};
	this.SaveCategoryList = async function(category_list){
		return new Promise(async function(resolve, reject){
			try{
				var path = __dirname + '/posts/_category_list.json';
				fs.writeFileSync(path, JSON.stringify(category_list));
				resolve();
			}catch(err){
				console.debug('FAIL SaveCategoryList');
				resolve([]);
			}
		});
	};
}

module.exports = new Service();