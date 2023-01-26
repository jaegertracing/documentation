function addLinkAnchors() {
  anchors.options = {
    icon: '#'
  };
  anchors.add('.content--docs h2, .content--docs h3, .content--docs h4, .content--docs h5, .content--docs h6');
}

function navbarToggle() {
  // Get all "navbar-burger" elements
  var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach(function($el) {
      $el.addEventListener('click', function (e) {
        e.preventDefault();

        // Get the target from the "data-target" attribute
        var target = $el.dataset.target;
        var $target = document.getElementById(target);

        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }
}

function controlModals() {
  $('.popup-term').click(function() {
    var term = this.dataset.modalId;
    var html = $('html');
    var modal = $('.modal');
    modal.addClass('is-active');
    html.addClass('is-clipped');

    modal.click(function() {
      modal.removeClass('is-active');
      html.removeClass('is-clipped');
    });
  });
}

function dropdownToggle() {
  const trigger = $('.dropdown');

  if (trigger) {
    trigger.click(function() {
      $(this).toggleClass('is-active')
    });
  }
}

$(function () {
  addLinkAnchors();
  navbarToggle();
  controlModals();
  dropdownToggle();

  // https://tscanlin.github.io/tocbot/#api
  tocbot.init({
    // Where to render the table of contents.
    tocSelector: '.toc',
    // Where to grab the headings to build the table of contents.
    contentSelector: '.content--docs',
    // Which headings to grab inside of the contentSelector element.
    headingSelector: 'h1, h2, h3',
    headingsOffset: 110,
    // expand all
    collapseDepth: Number.MAX_SAFE_INTEGER,
    // Don't override styles on tocbot's CSS classes (except activeLinkClass
    // which doesn't have an extraActiveLinkClasses)
    extraLinkClasses: 'jaeger-toc-page-link',
    extraListClasses: 'jaeger-toc-page-list',
    listItemClass: 'jaeger-toc-page-item',
  });
});

//Add Copy button to code snippets.

function addCopyButtons(clipboard) {
  document.querySelectorAll('pre > code').forEach(function (codeBlock) {
      var button = document.createElement('button');
      button.className = 'copy-code-button';
      button.type = 'button';
      button.innerText = 'Copy';

      button.addEventListener('click', function () {
          clipboard.writeText(codeBlock.innerText).then(function () {
              /* Chrome doesn't seem to blur automatically,
                 leaving the button in a focused state. */
              button.blur();

              button.innerText = 'Copied!';

              setTimeout(function () {
                  button.innerText = 'Copy';
              }, 1000);
          }, function (error) {
              button.innerText = 'Error';
          });
      });

      var pre = codeBlock.parentNode;
      if (pre.parentNode.classList.contains('highlight')) {
          var highlight = pre.parentNode;
          //highlight.insertBefore(button, pre);
          pre.insertBefore(button, codeBlock);
      } else {
          pre.parentNode.insertBefore(button, pre);
      }
  });
}

if (navigator && navigator.clipboard) {
  addCopyButtons(navigator.clipboard);
} else {
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.7.0/clipboard-polyfill.promise.js';
  script.integrity = 'sha256-waClS2re9NUbXRsryKoof+F9qc1gjjIhc2eT7ZbIv94=';
  script.crossOrigin = 'anonymous';
  script.onload = function() {
      addCopyButtons(clipboard);
  };

  document.body.appendChild(script);
}
