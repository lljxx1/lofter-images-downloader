var request = require('request');
var cheerio = require('cheerio');
var Promise = require('promise');
var fs = require('fs');

var allData = [], done = false;

function getAllPages(host){
	return new Promise(function(resolve, reject){
		var ddd = [], cPage = 0, cpURL = "";

		function callback(error, response, body) { 
			if (!error && response.statusCode == 200) {
		    	parseBody(body);
			}else{
				console.log(error);
				start(cpURL);
			}
		}

		function end(){
			console.log('end');
			resolve(ddd);
		}

		function nextPage(pl){
			cPage++;
			if(pl === 0){
				console.log(pl);
				end();
			}else{
				cpURL = host+'/page/'+cPage;
				console.log(cpURL);
				start(cpURL);
			}
		}

		function parseBody(body){
			var src, posts, pl;

			$ = cheerio.load(body);

			posts = $('.post');
			pl =  posts.length;

			console.log('length', pl);
			for (var i = 0; i < posts.length; i++) {
				var post = posts.eq(i);

				var photo_posts = post.find('.photo-posts');

				var imgs = photo_posts.find('img');

				var postData = {};

				postData.name = photo_posts.text().trim();
				postData.imgs = [];

				for (var c = 0; c < imgs.length; c++) {
					var img = imgs.eq(c);
					postData.imgs.push({
						src: img.attr('src'),
						alt: img.attr('alt')
					});
					
				};

				if(postData.imgs.length){
					saveData(postData);
				}

			};

			nextPage(pl);
		}


		function saveData(data){
			allData.push(data);

			ddd.push(data);
		}


		// 开始
		function start(page_url){
			var options = {
			    url: page_url,
			    timeout: 10000,
			    headers: {
			    	'Referer' : host,
			    	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
			    }
			}; 

			request(options, callback);
		}

		nextPage();
	})
}


var DATA_PATH = "./data0606";

function downloadImgs(data){
	return new Promise(function(resolve, reject){

		if(data) allData = data;
 		
 		var sucess = 0, failed = 0; 

		function end(){
			console.log('sucessed', sucess);
			console.log('failed', failed);
			resolve();
		}

		function fetchImg(url, save){
			var options = {
			    url: url,
			    headers: { 
			    	'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
			    }
			}; 

			function random(){
				return Math.floor(Math.random() * ( 1000 + 1));
			}

			var save_name;

			save = random() +'-'+random()  +'-'+random()  +'-'+random()  +'-'+random();

			save_name = save+'.jpg';
			
			function f(r){
				if(r) console.log(r, save_name);
				request(options)
				.on('error', function(err) {
					console.log('failed', save_name);
					f('err');
				})
				.pipe(
					fs.createWriteStream(DATA_PATH+'/'+save_name)
				)
				.on('close', function(){
					console.log('sucess', save_name);
					sucess++;
				})
			}
			f();
		}

		function next(){

			if(!allData.length && done) return end();
			var data = allData.shift();

			if(data && data.imgs){
				// console.log(data);
				for (var c = 0; c < data.imgs.length; c++) {
					var img =  data.imgs[c];
					if(img.src){
						fetchImg(img.src);
					}
				};
			}

			setTimeout(next, 100);
		}

		next();
	})
}



function downloader(host){
	getAllPages(host).then(function(){
		done = true;
	});

	downloadImgs();
}


module.exports = downloader;