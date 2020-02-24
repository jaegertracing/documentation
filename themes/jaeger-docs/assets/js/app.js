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
