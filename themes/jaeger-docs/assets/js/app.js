function scrollOffset() {
  var navbarOffset = -1 * (document.querySelector("nav.navbar").offsetHeight + 15);
  var shiftWindow = function() { scrollBy(0, navbarOffset) };
  window.addEventListener("hashchange", shiftWindow);
  window.addEventListener("pageshow", shiftWindow);
  function load() { if (window.location.hash) shiftWindow(); }
}

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

function tableOfContents(tocifyOptions) {
  $("#toc").tocify(tocifyOptions);
}

$(function () {
  scrollOffset();
  addLinkAnchors();
  navbarToggle();
  controlModals();

  var tocifyOptions = {
    context: '.content--docs',
    selectors: 'h2,h3,h4',
    showAndHide: false,
    smoothScroll: true,
    theme: 'jqueryui',
    scrollTo: $('.navbar').height()
  }

  tableOfContents(tocifyOptions);
});
