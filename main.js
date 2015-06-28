var request = require('request');
var cheerio = require('cheerio');
var Promise = require('promise');
var fs = require('fs');

var parser = require('./libs/parser.js');

var allPost = [], allData = [], done = false, allImages = [];


function getAllPosts(host){
	return new Promise(function(resolve, reject){
		var ddd = [], cPage = 0, cpURL = "", self = this, type, links = [];
		console.log('allPost', allPost.length);
		console.log('allImages', allImages.length);
		
		function callback(error, response, body) { 
			if (!error && response.statusCode == 200) {

				if(body.indexOf('</html>') > -1){
					parseBody(body);
				}else{
					start(cpURL);
				}
		    	
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
				cpURL = host+'/?page='+cPage;
				console.log(cpURL);
				start(cpURL);
			}
		}

		function parseBody(body){
			$ = cheerio.load(body);

			var src, posts, pl;
			posts = $('a.img');
			pl =  posts.length;

			console.log('length', pl);
			for (var i = 0; i < posts.length; i++) {
				var post = posts.eq(i);
				var link = post.attr('href');
				saveData(link);
			};

			if(pl === 0){
				console.log(body);
			}

			nextPage(pl);
		}


		function saveData(data){
			allPost.push(data);
			ddd.push(data);
		}


		// 开始
		function start(page_url){
			var options = {
			    url: page_url,
			    timeout: 1000,
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


function getPageImgs(link){
	return new Promise(function(resolve, reject){
		var data = {};

		data.link = link;
		data.imgs = [];

		function callback(error, response, body) { 
			if (!error && response.statusCode == 200) {
		    	parseBody(body);
			}else{
				console.log(error);
				start(link);
			}
		}

		function end(){
			resolve(data);
		}


		function parseBody(body){
			$ = cheerio.load(body);

			var imgs = $('[bigimgsrc!=""]');

			console.log('found images', imgs.length);
			for (var i = 0; i < imgs.length; i++) {
				var img = imgs.eq(i);
				var src = img.attr('bigimgsrc');

				if(src){
					saveData(src);
				}
			};

			end();
		}


		function saveData(src){
			data.imgs.push(src);
		}


		// 开始
		function start(page_url){
			var options = {
			    url: page_url,
			    timeout: 10000,
			    headers: {
			    	'Referer' : page_url,
			    	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
			    }
			}; 

			request(options, callback);
		}

		start(link);
	})
}


var DATA_PATH = "./data";

function downloadImg(url){
	return new Promise(function(resolve, reject){

		function end(data){
			resolve(data);
		}

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
		
		function fetch(r){
			if(r) console.log(r, save_name);
			request(options)
			.on('error', function(err) {
				console.log('failed', save_name);
				fetch('err');
			})
			.pipe(
				fs.createWriteStream(DATA_PATH+'/'+save_name)
			)
			.on('close', function(){
				end(save_name);
				console.log('sucess', save_name);
			})
		}
		fetch();
	})
}


function downloadImgs(dataI){
	return new Promise(function(resolve, reject){

		if(!dataI){
			allImages = allImages;
		}else{
			allImages = dataI;
		}

		function end(){
			resolve();
		}

		(function repeat(){

			var allImgsL = allImages.length, limit = 5;

			// if(allDataL === 0){
			// 	return end();
			// }

			if(allImgsL === 0){
				if(!dataI && getAllImgsDone){
					return end();
				}

				if(dataI && getAllImgsDone){
					return end();
				}

				//  wait 1s
				return setTimeout(repeat, 1000);
			}

			console.log('images quee', allImgsL);
			var linkP = [];

			var quee = [];
			for (var i = 0; i < allImgsL; i++) {
				var data = allImages.pop();

				if(data.imgs.length){
					data.imgs.forEach(function(img){
						quee.push(
							downloadImg(img)
						);
					})
				}
				
				if(i === limit) break;
			};	

			Promise.all(quee).then(function(){
				console.log(arguments[0]);
				repeat();
			})

		})();

	})
}



function getAllImgs(dataI){
	return new Promise(function(resolve, reject){

		if(!dataI){
			links = allPost;
		}else{
			links = dataI;
		}

		// console.log("allImgs aleardy", allImgs.length);

		// if(!allImages){
		// 	var allImages = [];
		// 	onsole.log("new allImages");
		// }

		function end(){
			resolve(allImages);
		}

		(function repeat(){

			var linksL = links.length, limit = 5;

			if(linksL === 0){
				if(!dataI && done){
					return end();
				}

				if(dataI && done){
					return end();
				}

				//  wait 1s
				return setTimeout(repeat, 1000);
			}

			console.log('links quee', linksL);

			var linkP = [];

			var quee = [];
			for (var i = 0; i < linksL; i++) {
				var link = links.pop();
				quee.push(
					getPageImgs(link)
				);
				if(i === limit) break;
			};	

			Promise.all(quee).then(function(){
				// console.log(arguments[0])
				allImages = allImages.concat(arguments[0])
				repeat();
			})

		})();

	})
}

var getAllImgsDone = false;
function downloader(host){
	console.log(host);

	getAllPosts(host).then(function(){
		done = true;
	});

	getAllImgs().then(function(data){
		getAllImgsDone = true;
	}).catch(function(err){
		console.log(err);
	});

	downloadImgs().then(function(data){
		console.log(data);
	}).catch(function(err){
		console.log(err);
	});

	// downloadImgs();
}



// getPageImgs(links).then(function(data){
// 	console.log(data);
// }).catch(function(err){
// 	console.log(err);
// });



// var imgs = [ 'http://imglf2.ph.126.net/yZNrUWznvlpHpGApCLdTAA==/6630183758350412654.jpg',
//        'http://imglf2.ph.126.net/W83K991zKGAzMzo6qRdW7Q==/6630719220513316316.jpg',
//        'http://imglf1.ph.126.net/VqCFQfA_C7-il0E4is_a9g==/6630808280955218653.jpg',
//        'http://imglf1.ph.126.net/fFHMz3EfuJnPeFlMeJKoEw==/6630929227234284958.jpg',
//        'http://imglf2.ph.126.net/5JuMwQzymROHX-nOo2Tcag==/6630623563001757530.jpg',
//        'http://imglf1.ph.126.net/ZiPo9VQ0uPhIzFEdhxomJQ==/6630676339559884234.jpg',
//        'http://imglf0.ph.126.net/NUohL7jez1WEsepNlombig==/6630178260792273810.jpg',
//        'http://imglf1.ph.126.net/xz5wHqwrwAfWnAqbPSkJgw==/6630766499513366239.jpg',
//        'http://imglf1.ph.126.net/Cu1ObtblSr2DdT2gLrkYUA==/6630312401210864182.jpg',
//        'http://imglf1.ph.126.net/cWNnOYCBWIvCRtQ1g1bP9A==/6630312401210864173.jpg' ];

// downloadImg("http://imglf1.ph.126.net/cWNnOYCBWIvCRtQ1g1bP9A==/6630312401210864173.jpg").then(function(data){
// 	console.log(data);
// }).catch(function(err){
// 	console.log(err);
// });


module.exports = downloader;