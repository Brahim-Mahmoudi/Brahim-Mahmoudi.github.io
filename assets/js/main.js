/* ==========================================================================
   Site interactions for brahimmahmoudi.com (vanilla JavaScript, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector("[data-header]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme (light / dark) ---------- */
  var THEME_KEY = "bm-theme";
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var themeButton = document.querySelector("[data-theme-toggle]");
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return root.dataset.theme || (darkQuery.matches ? "dark" : "light");
  }

  function syncThemeUI() {
    var dark = currentTheme() === "dark";
    if (themeButton) themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    if (themeColorMeta) themeColorMeta.setAttribute("content", dark ? "#121013" : "#7f1146");
  }

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable: theme lasts for this visit */ }
      syncThemeUI();
    });
  }
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", syncThemeUI);
  syncThemeUI();

  /* ---------- Header: solid background once the page is scrolled ---------- */
  var ticking = false;
  function updateHeader() {
    header.classList.toggle("is-solid", window.scrollY > 40);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });
    document.addEventListener("click", function (event) {
      if (header.classList.contains("nav-open") && !header.contains(event.target)) setNav(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("nav-open")) {
        setNav(false);
        navToggle.focus();
      }
    });
    var desktop = window.matchMedia("(min-width: 960px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function (event) {
        if (event.matches) setNav(false);
      });
    }
  }

  /* ---------- Highlight the nav link of the section on screen ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var hero = document.getElementById("top");

  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navLinks.forEach(function (link) {
          if (link.getAttribute("href") === id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    navLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute("href"));
      if (section) spy.observe(section);
    });
    if (hero) spy.observe(hero); // clears the highlight when back at the top
  }

  /* ---------- Reveal-on-scroll animations ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, index) {
      child.style.setProperty("--reveal-delay", index * 90 + "ms");
    });
  });

  var revealItems = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealItems.forEach(function (el) { revealer.observe(el); });
  }

  /* ---------- External links open in a new tab ---------- */
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    if (link.host === window.location.host) return;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    var hint = document.createElement("span");
    hint.className = "sr-only";
    hint.textContent = " (opens in a new tab)";
    link.appendChild(hint);
  });

  /* ---------- Toast + clipboard ---------- */
  var toast = document.querySelector("[data-toast]");
  var toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    area.remove();
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function clean(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  // APA citation built from the publication card itself (no duplicated text to maintain)
  function citationFor(pub) {
    var link = pub.querySelector("[data-cite-link]");
    return clean(pub.querySelector(".pub-authors")) + " (" + clean(pub.querySelector(".pub-year")) + "). " +
      clean(pub.querySelector(".pub-title")) + ". " + clean(pub.querySelector("[data-venue]")) + "." +
      (link ? " " + link.href : "");
  }

  document.addEventListener("click", function (event) {
    var copyButton = event.target.closest("[data-copy]");
    var citeButton = event.target.closest("[data-cite]");
    if (!copyButton && !citeButton) return;

    var text = copyButton ? copyButton.dataset.copy : citationFor(citeButton.closest(".pub"));
    var message = copyButton ? (copyButton.dataset.copyMessage || "Copied") : "Citation copied (APA)";
    copyText(text).then(function (ok) {
      showToast(ok ? message : "Copy failed, please copy it manually");
    });
  });

  /* ---------- Publication filters ---------- */
  var filterButtons = document.querySelectorAll("[data-filter]");
  var pubs = Array.prototype.slice.call(document.querySelectorAll(".pub"));
  var pubCount = document.querySelector("[data-pub-count]");

  function countFor(type) {
    return type === "all" ? pubs.length : pubs.filter(function (p) { return p.dataset.type === type; }).length;
  }

  function applyFilter(type) {
    var shown = 0;
    pubs.forEach(function (pub) {
      var match = type === "all" || pub.dataset.type === type;
      pub.hidden = !match;
      if (match) {
        shown++;
        pub.classList.add("is-visible");
      }
    });
    filterButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === type));
    });
    if (pubCount) pubCount.textContent = shown + (shown === 1 ? " publication" : " publications");
  }

  filterButtons.forEach(function (btn) {
    var count = btn.querySelector(".count");
    var n = countFor(btn.dataset.filter);
    if (count) count.textContent = n;
    if (n === 0 && btn.dataset.filter !== "all") btn.hidden = true;
    btn.addEventListener("click", function () { applyFilter(btn.dataset.filter); });
  });
  if (pubs.length) applyFilter("all");

  /* ---------- Lightbox for diagrams ---------- */
  var dialog = document.querySelector("[data-lightbox-dialog]");
  if (dialog && typeof dialog.showModal === "function") {
    var dialogImg = dialog.querySelector("img");
    var dialogCaption = dialog.querySelector("figcaption");

    document.addEventListener("click", function (event) {
      var link = event.target.closest("a[data-lightbox]");
      if (!link) return;
      event.preventDefault();
      var thumb = link.querySelector("img");
      dialogImg.src = link.href;
      dialogImg.alt = thumb ? thumb.alt : "";
      dialogCaption.textContent = link.dataset.caption || dialogImg.alt;
      dialog.showModal();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-lightbox-close]")) dialog.close();
    });
    dialog.addEventListener("close", function () { dialogImg.removeAttribute("src"); });
  }

  /* ---------- Google Drive viewer, loaded on demand ---------- */
  document.querySelectorAll("[data-embed]").forEach(function (box) {
    var button = box.querySelector("[data-embed-load]");
    if (!button) return;
    button.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = box.dataset.embed;
      frame.title = box.dataset.embedTitle || "Embedded document";
      frame.allow = "autoplay; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      box.replaceChildren(frame);
      frame.focus();
    });
  });

  /* ---------- Photography: fade-in, "show all" button, full screen viewer ---------- */
  var gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    var photos = Array.prototype.slice.call(gallery.querySelectorAll(".photo"));
    var VISIBLE_PHOTOS = 12;

    photos.forEach(function (link, index) {
      var img = link.querySelector("img");
      var markLoaded = function () { img.classList.add("is-loaded"); };
      if (img.complete && img.naturalWidth) markLoaded();
      else {
        img.addEventListener("load", markLoaded);
        img.addEventListener("error", markLoaded);
      }
      if (index >= VISIBLE_PHOTOS) link.classList.add("is-extra");
    });

    var moreButton = document.querySelector("[data-gallery-more]");
    var moreLabel = document.querySelector("[data-gallery-more-label]");
    if (moreButton && photos.length > VISIBLE_PHOTOS) {
      var setMore = function (expanded) {
        gallery.classList.toggle("is-expanded", expanded);
        moreButton.setAttribute("aria-expanded", String(expanded));
        moreLabel.textContent = expanded ? "Show fewer photos" : "Show all " + photos.length + " photos";
      };
      setMore(false);
      moreButton.hidden = false;
      moreButton.addEventListener("click", function () {
        var expand = !gallery.classList.contains("is-expanded");
        setMore(expand);
        if (!expand) gallery.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
      });
    }

    var viewer = document.querySelector("[data-viewer]");
    if (viewer && typeof viewer.showModal === "function") {
      var viewerImg = viewer.querySelector("[data-viewer-img]");
      var viewerCount = viewer.querySelector("[data-viewer-count]");
      var viewerMeta = viewer.querySelector("[data-viewer-meta]");
      var current = 0;

      var preload = function (index) {
        var img = new Image();
        img.src = photos[(index + photos.length) % photos.length].href;
      };

      var showPhoto = function (index) {
        current = (index + photos.length) % photos.length;
        var link = photos[current];
        var thumb = link.querySelector("img");

        // Show the small version right away, then swap in the large one once it has loaded
        viewerImg.src = thumb.currentSrc || thumb.src;
        viewerImg.alt = thumb.alt;
        var large = new Image();
        large.onload = function () { if (photos[current] === link) viewerImg.src = link.href; };
        large.src = link.href;

        viewerCount.textContent = (current + 1) + " / " + photos.length;
        viewerMeta.replaceChildren();
        link.querySelectorAll(".photo-meta span").forEach(function (item) {
          var pill = document.createElement("span");
          pill.textContent = item.textContent;
          viewerMeta.appendChild(pill);
        });
        preload(current + 1);
        preload(current - 1);
      };

      gallery.addEventListener("click", function (event) {
        var link = event.target.closest(".photo");
        if (!link) return;
        event.preventDefault();
        showPhoto(photos.indexOf(link));
        viewer.showModal();
        document.body.classList.add("no-scroll");
      });

      viewer.querySelector("[data-viewer-prev]").addEventListener("click", function () { showPhoto(current - 1); });
      viewer.querySelector("[data-viewer-next]").addEventListener("click", function () { showPhoto(current + 1); });
      viewer.querySelector("[data-viewer-close]").addEventListener("click", function () { viewer.close(); });

      // Clicking the dark area around the photo closes the viewer
      viewer.addEventListener("click", function (event) {
        if (event.target === viewer || event.target.hasAttribute("data-viewer-stage")) viewer.close();
      });

      viewer.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") { event.preventDefault(); showPhoto(current - 1); }
        if (event.key === "ArrowRight") { event.preventDefault(); showPhoto(current + 1); }
      });

      // Swipe left / right on phones
      var touchStartX = null;
      viewer.addEventListener("touchstart", function (event) { touchStartX = event.touches[0].clientX; }, { passive: true });
      viewer.addEventListener("touchend", function (event) {
        if (touchStartX === null) return;
        var dx = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
      });

      viewer.addEventListener("close", function () {
        document.body.classList.remove("no-scroll");
        viewerImg.removeAttribute("src");
      });
    }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
