document.addEventListener('DOMContentLoaded', function () {

  // Smooth scroll for in-page anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
        return;
      }
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Fade-in sections as they enter the viewport
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.hero, .intro-text, .color-blocks, .body-text, .zine-section, .bottom-split, .ryd-intro, .ryd-gallery, .ryd-faq'
  ).forEach(function (el) {
    el.classList.add('fade-in');
    observer.observe(el);
  });



  // Company category filters (All Companies page)
  var filterButtons = document.querySelectorAll('.ryd-filter-button');
  if (filterButtons.length) {
    var cards = document.querySelectorAll('#all-companies-grid .ryd-card');
    var grid = document.getElementById('all-companies-grid');
    var emptyState = document.getElementById('filter-empty-state');

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');

        filterButtons.forEach(function (other) {
          other.classList.toggle('is-active', other === button);
        });

        var visibleCount = 0;
        cards.forEach(function (card) {
          var match = filter === 'all' || card.getAttribute('data-category') === filter;
          card.hidden = !match;
          if (match) visibleCount++;
        });

        if (grid) grid.hidden = visibleCount === 0;
        if (emptyState) emptyState.hidden = visibleCount !== 0;
      });
    });
  }

  // FAQ accordion (Request Your Data page)
  document.querySelectorAll('.ryd-accordion-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));

      // Close any other open item (single-open behavior)
      document.querySelectorAll('.ryd-accordion-trigger[aria-expanded="true"]').forEach(function (other) {
        if (other !== trigger) {
          other.setAttribute('aria-expanded', 'false');
          var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
          if (otherPanel) otherPanel.hidden = true;
        }
      });

      trigger.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

});

function emailCompany(emailAddress) {
  
  var email = `mailto:${emailAddress}?subject=CCPA%20Data%20Subject%20Access%20Request&body=I%20am%20a%20resident%20of%20California.%20I%20am%20writing%20to%20exercise%20my%20data%20rights%20under%20state%20law.%0D%0A%0D%0AFirst%2C%20I%20would%20like%20to%20exercise%20my%20right%20to%20know%20whether%20your%20business%20has%20processed%20my%20personal%20information.%20Please%20reply%20to%20acknowledge%20whether%20your%20business%20has%20processed%20my%20personal%20information%20or%20the%20personal%20information%20of%20my%20household.%0D%0A%0D%0ASecond%2C%20if%20your%20business%20has%20processed%20my%20personal%20information%2C%20I%20would%20like%20to%20exercise%20my%20right%20to%20access%20a%20copy%20of%20that%20information.%20To%20the%20extent%20technically%20possible%2C%20I%20would%20like%20to%20access%20both%20my%20identifiable%20and%20pseudonymous%20data.%20If%20you%20process%20personal%20data%20related%20to%20my%20household%2C%20to%20the%20extent%20allowed%20by%20law%2C%20I%20would%20also%20like%20to%20request%20access%20to%20household%20information.%20Please%20reply%20to%20acknowledge%20your%20receipt%20of%20my%20access%20request.%0D%0A%0D%0AThird%2C%20I%20would%20like%20a%20list%20of%20third%20parties%20you%20have%20shared%20my%20data%20with.%0D%0AName%3A%0D%0APhone%3A%0D%0AAddress%3A%0D%0ACity%3A%0D%0AState%3A%20CA%0D%0AZip%3A%0D%0AEmail%20Addresses%3A%0D%0A%0D%0ALastly%2C%20under%20California%20law%2C%20companies%20are%20also%20required%20to%20provide%20any%20%E2%80%9Cinferences%20drawn%20from%20any%20of%20the%20information%20identified%20in%20this%20subdivision%20to%20create%20a%20profile%20about%20a%20consumer%20reflecting%20the%20consumer%E2%80%99s%20preferences%2C%20characteristics%2C%20psychological%20trends%2C%20predispositions%2C%20behavior%2C%20attitudes%2C%20intelligence%2C%20abilities%2C%20and%20aptitudes%2C%E2%80%9D%20since%20inferences%20are%20considered%20personal%20information.%20Please%20provide%20me%20with%20any%20of%20the%20inferences%20your%20business%20and%20its%20service%20providers%20may%20have%20created%20about%20me.%C2%A0%0D%0A%0D%0APlease%20let%20me%20know%20if%20any%20other%20information%20is%20required%20to%20verify%20my%20request.`
  window.location.href = email;
}