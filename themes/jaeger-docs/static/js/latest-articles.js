function get_latest_post(){
  fetch('https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/jaegertracing')
   .then((res) => res.json())
   .then((data) => {
      const res = data.items
      const posts = res.filter(item => item.categories.length > 0)
      // Functions to create a short text out of whole blog's content
      function toText(node) {
         let tag = document.createElement('div')
         tag.innerHTML = node
         node = tag.innerText
         return node
      }
      function shortenText(text,startingPoint ,maxLength) {
         return text.length > maxLength?
         text.slice(startingPoint, maxLength) + '...':
         text
      }
      // Put things in right spots of markup
      let output = '';
      for(var i = 0; i<posts.length; i++){
        console.log(posts[i].link)
         output += `
         <li class="blog__post">
            <a href="${posts[i].link}">
               <img src="${posts[i].thumbnail}" class="blog__topImg"></img>
               <div class="blog__content">
                  <div class="blog_preview">
                     <h2 class="blog__title">${shortenText(posts[i].title, 0, 50)}</h2>

                     <p class="blog__intro">${shortenText(toText(posts[i].content),0, 200)}</p>
                  </div>
                  <hr>
                  <div class="blog__info">
                     <span class="blog__author">${posts[i].author}</span>
                     <span class="blog__date">${posts[i].pubDate.slice(0, 10)}</span>
                  </div>
               </div>
            <a/>
         </li>`
        }
        document.querySelector('.blog__slider').innerHTML = output
        $(document).ready(function () {
            $("#blog").show();
        });
  })
}

try{
  get_latest_post();
}
catch(err){
  console.log(err.message);
}
