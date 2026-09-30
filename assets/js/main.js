/* ==========================================================================
   Site interactions for brahimmahmoudi.com (vanilla JavaScript, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

  /* ---------- Photography: card carousel + full screen viewer ---------- */
  var track = document.querySelector("[data-gallery]");
  if (track) {
    var photos = Array.prototype.slice.call(track.querySelectorAll(".photo"));
    var prevButton = document.querySelector("[data-carousel-prev]");
    var nextButton = document.querySelector("[data-carousel-next]");
    var toggleButton = document.querySelector("[data-carousel-toggle]");
    var progressBar = document.querySelector("[data-carousel-bar]");
    var counter = document.querySelector("[data-carousel-count]");
    var centered = 0;

    // Fade each photo in once it has loaded
    photos.forEach(function (link) {
      var img = link.querySelector("img");
      var markLoaded = function () { img.classList.add("is-loaded"); };
      if (img.complete && img.naturalWidth) markLoaded();
      else {
        img.addEventListener("load", markLoaded);
        img.addEventListener("error", markLoaded);
      }
    });

    // The card closest to the middle is full size and bright, the others shrink and dim
    var updateCards = function () {
      var box = track.getBoundingClientRect();
      var middle = box.left + box.width / 2;
      var bestDistance = Infinity;
      photos.forEach(function (card, index) {
        var r = card.getBoundingClientRect();
        var distance = Math.abs(r.left + r.width / 2 - middle);
        card.style.setProperty("--focus", Math.max(0, 1 - distance / (box.width * 0.55)).toFixed(3));
        if (distance < bestDistance) { bestDistance = distance; centered = index; }
      });
      if (counter) counter.textContent = (centered + 1) + " / " + photos.length;
      if (progressBar) {
        var max = track.scrollWidth - track.clientWidth;
        var visible = track.clientWidth / track.scrollWidth * 100;
        progressBar.style.width = visible + "%";
        progressBar.style.left = (max > 0 ? track.scrollLeft / max : 0) * (100 - visible) + "%";
      }
    };
    var framePending = false;
    var requestUpdate = function () {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(function () { framePending = false; updateCards(); });
    };
    // Side padding so that the first and the last card can sit exactly in the middle
    var sizePadding = function () {
      track.style.paddingLeft = Math.max(16, (track.clientWidth - photos[0].offsetWidth) / 2) + "px";
      track.style.paddingRight = Math.max(16, (track.clientWidth - photos[photos.length - 1].offsetWidth) / 2) + "px";
    };
    track.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", function () { sizePadding(); requestUpdate(); });
    sizePadding();

    // Start on the first card that leaves no empty space on its left, so the row looks full
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var before = 0;
    for (var start = 0; start < photos.length - 1; start++) {
      if (before >= (track.clientWidth - photos[start].offsetWidth) / 2) break;
      before += photos[start].offsetWidth + gap;
    }
    track.style.scrollBehavior = "auto"; // jump there directly, no animation on page load
    track.scrollLeft = photos[start].offsetLeft - (track.clientWidth - photos[start].offsetWidth) / 2;
    track.style.scrollBehavior = "";
    updateCards();

    var goTo = function (index) {
      var card = photos[(index + photos.length) % photos.length];
      track.scrollTo({
        left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    };

    // Autoplay: moves every few seconds while the carousel is on screen,
    // pauses on hover, focus, touch or with the pause button, never runs with reduced motion
    var autoplay = !reduceMotion.matches;
    var onScreen = false;
    var holding = false;
    var timer = null;
    var schedule = function () {
      clearInterval(timer);
      timer = null;
      if (autoplay && onScreen && !holding && !document.hidden) {
        timer = setInterval(function () { goTo(centered + 1); }, 3500);
      }
    };
    var setAutoplay = function (on) {
      autoplay = on;
      if (toggleButton) {
        toggleButton.classList.toggle("is-paused", !on);
        toggleButton.setAttribute("aria-label", on ? "Pause the slideshow" : "Play the slideshow");
      }
      schedule();
    };
    setAutoplay(autoplay);

    if (toggleButton) toggleButton.addEventListener("click", function () { setAutoplay(!autoplay); });
    if (prevButton) prevButton.addEventListener("click", function () { goTo(centered - 1); schedule(); });
    if (nextButton) nextButton.addEventListener("click", function () { goTo(centered + 1); schedule(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.35 }).observe(track);
    }
    document.addEventListener("visibilitychange", schedule);
    track.addEventListener("mouseenter", function () { holding = true; schedule(); });
    track.addEventListener("mouseleave", function () { holding = false; schedule(); });
    track.addEventListener("focusin", function () { holding = true; schedule(); });
    track.addEventListener("focusout", function () { holding = false; schedule(); });
    track.addEventListener("touchstart", function () { holding = true; schedule(); }, { passive: true });
    track.addEventListener("touchend", function () {
      setTimeout(function () { holding = false; schedule(); }, 4000);
    });

    // Drag with the mouse on desktop (touch screens scroll natively)
    var dragStartX = 0;
    var dragStartScroll = 0;
    var dragging = false;
    var dragged = false;
    track.addEventListener("dragstart", function (event) { event.preventDefault(); });
    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      dragged = false;
      dragStartX = event.clientX;
      dragStartScroll = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var dx = event.clientX - dragStartX;
      if (!dragged && Math.abs(dx) > 6) {
        dragged = true;
        track.classList.add("is-dragging");
      }
      if (dragged) track.scrollLeft = dragStartScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!dragging) return;
      dragging = false;
      if (dragged) {
        track.classList.remove("is-dragging");
        goTo(centered); // settle on the nearest card
      }
    });

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

      track.addEventListener("click", function (event) {
        var link = event.target.closest(".photo");
        if (!link) return;
        event.preventDefault();
        if (dragged) { dragged = false; return; } // end of a drag, not a click
        showPhoto(photos.indexOf(link));
        viewer.showModal();
        document.body.classList.add("no-scroll");
        holding = true;
        schedule();
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
        goTo(current); // bring the carousel to the last photo seen
        holding = false;
        schedule();
      });
    }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
