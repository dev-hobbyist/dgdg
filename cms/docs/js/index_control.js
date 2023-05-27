$(document).ready(function () {
	console.debug('test index control ');
	window._index_control = new IndexControl().Init();
});

function IndexControl(){
	var self = this;
	this._editor = null;
	this._post_list = null;
	this._selected_post = null;
	this._category_list = null;
	this._site_config = null;

	this.Init = function(){
		self.GetSiteConfig();
		self.GetPostList();
		self.GetCategoryList();

		const Editor = toastui.Editor;
		const { codeSyntaxHighlight } = Editor.plugin;
		self._editor = new Editor({
			el: document.querySelector('#id_editor'),
			height: '860px',
			initialEditType: 'wysiwyg',
			plugins: [codeSyntaxHighlight]
		});	
		return this;
	};

	this.GetSiteConfig = function(){
		GET('/api/get_site_config', function(res){
			if(res.ok){
				self._site_config = res.site_config;
				$('title').html(self._site_config.title);
				$('#id_label_title').html(self._site_config.title);
			}else{
				alert(res.err);
			}
		});
	};

	this.OpenNewPost = function(){
		self._selected_post = null;
		self._editor.setMarkdown('');
		$('#id_title').val('');
		self.DISP_CategorySelect();
	};

	this.DISP_CategorySelect = function(category_index){
		var h = '';
		for(var i=0 ; i<self._category_list.length ; i++){
			var c = self._category_list[i];
			var selected = '';
			if(c.index == category_index){
				selected = 'selected';
			}
			h += `<option val="${c.index}" ${selected}>${c.category}</option>`;
		}
		$('#id_select_category').html(h);
	};

	this.Save = function(){
		var title = $('#id_title').val().trim();
		var keyword = $('#id_keyword').val().trim();
		var md = self._editor.getMarkdown();
		var category = $('#id_select_category').val();
		var category_index = 0;
		for(var i=0 ; i<self._category_list.length ; i++){
			if(self._category_list[i].category == category){
				category_index = self._category_list[i].index;
				break;
			}
		}

		var url = '';
		if(self._selected_post == null){
			var data = {
				title: title,
				category_index: category_index,
				keyword: keyword,
				md: md
			};	
			url = '/api/save_post';
		}else{
			var data = {
				index: self._selected_post.index,
				year: self._selected_post.year,
				month: self._selected_post.month,
				title: title,
				category_index: category_index,
				keyword: keyword,
				md: md
			};	
			url = '/api/update_post';
		}

		POST(url, data, function(res){
			if(res.ok){
				if(self._selected_post == null){
					self.ShowMsg('save ok');
				}else{
					self.ShowMsg('update ok');
				}
				self.GetPostList();
			}else{
				alert(res.err);
			}
		});
	};

	this.GetPostList = function(){
		GET('/api/get_post_list', function(res){
			self._post_list = res.post_list;
			if(res.ok){
				var h = `
					<table class="table table-sm small table-striped">
					<tr>
					<td>Y</td>
					<td>M</td>
					<td>I</td>
					<td>Title</td>
					</tr>
				`;
				for(var i=0 ; i<self._post_list.length ; i++){
					var p = self._post_list[i];
					var on_click = `window._index_control.LoadPost(${p.index})`;
					var date_updated = new Date(p.timestamp_updated);
					var date_updated_format = date_updated.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
		
					h += `
					<tr style="cursor:pointer" onClick="${on_click}">
						<td>${p.year}</td>
						<td>${p.month}</td>
						<td>${p.index}</td>
						<td>
							${p.title}
							<br>
							<font style="font-size:0.7em; color:gray">${date_updated_format}</font>
						</td>
					</tr>
					`;
				}
				h += '</table>'
				$('#id_post_list').html(h);
			}else{
				alert(res.err);
			}
		});
	};

	this.LoadPost = function(index){
		var post = null;
		for(var i=0 ; i<self._post_list.length ; i++){
			if(self._post_list[i].index == index){
				post = self._post_list[i];
				self._selected_post = post;
				break;
			}
		}
		if(post == null){
			return;
		}

		self.DISP_CategorySelect(post.category_index);

		GET(`/api/get_post?year=${post.year}&month=${post.month}&index=${post.index}`, function(res){
			if(res.ok){
				$('#id_title').val(post.title);
				$('#id_keyword').val(post.keyword);
				self._editor.setMarkdown(res.md);
			}else{
				alert(res.err);
			}
		});
	};

	this.Export = function(){
		if(self._selected_post == null){
			alert('no post selected');
			return;
		}
		GET(`/api/export?index=${self._selected_post.index}`, function(res){
			if(res.ok){
				self.ShowMsg('Export OK');
			}else{
				alert(res.err);
			}
		});
	};

	this.ExportAll = function(){
		GET('/api/export_all', function(res){
			if(res.ok){
				self.ShowMsg('Export All OK');
			}else{
				alert(res.err);
			}
		});
	};

	this.AddCatetory = function(){
		var category = prompt("Category");
		console.debug('category ' + category);
		category = category.trim();
		if(category == null || category == ''){
			return;
		}

		var req = {
			category: category
		};
		POST('/api/add_category', req, function(res){
			if(res.ok){
				self.GetCategoryList();
			}else{
				alert(res.err);
			}
		})
	};

	this.EditCategory = function(index){
		console.debug('test ' );
		var category = null;
		for(var i=0 ; i<self._category_list.length ; i++){
			if(self._category_list[i].index == index){
				category = self._category_list[i].category;
				break;
			}
		}
		if(category == null){
			return;
		}

		var changed_category = prompt("Edit Category", category);
		if(changed_category == null || changed_category == ''){
			return;
		}

		var req = {
			index: index,
			category: changed_category
		};
		POST('/api/edit_category', req, function(res){
			if(res.ok){
				self.GetCategoryList();
			}else{
				alert(res.err);
			}
		});
	};

	this.GetCategoryList = function(){
		GET('/api/get_category_list', function(res){
			if(res.ok){
				self._category_list = res.category_list;
				var h = '';
				for(var i=0 ; i<self._category_list.length ; i++){
					var c = self._category_list[i];
					var onClick = `window._index_control.EditCategory(${c.index})`;
					console.debug(i + ' ' + onClick);
					h += `
					<div>
						${c.category}
						<span class="badge" onClick="${onClick}" style="cursor:pointer"><i class="fas fa-edit"></i></span>
					</div>
					`;
				}
				$('#id_category_list').html(h);
			}else{
				alert(res.err);
			}
		})
	};

	this.ShowMsg = function(msg){
		$('#id_msg').html(msg);
		setTimeout(function(){
			$('#id_msg').html('');
		}, 1000);
	};
}