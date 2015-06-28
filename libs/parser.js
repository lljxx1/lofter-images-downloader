

module.exports = {

	lofter : function($, self){

	},

	tumblr: function($, self){
		var src, posts, pl;
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
				self.saveData(postData);
			}

		};

		return pl;
	}

}