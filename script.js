(() => {
  const LANG_KEY = "lediprovizor-lang";

  const getSavedLang = () => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" || saved === "ru" ? saved : "ru";
  };

  const setLang = (lang, persist = true) => {
    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-ru-html]").forEach((el) => {
      const ru = el.getAttribute("data-ru-html");
      const en = el.getAttribute("data-en-html");
      if (lang === "en" && en) {
        el.innerHTML = en;
      } else if (ru) {
        el.innerHTML = ru;
      }
    });
    document.querySelectorAll("[data-ru]").forEach((el) => {
      const ru = el.getAttribute("data-ru");
      const en = el.getAttribute("data-en");
      if (lang === "en" && en) {
        el.textContent = en;
      } else if (ru) {
        el.textContent = ru;
      }
    });
    document.querySelectorAll("[data-ru-placeholder]").forEach((el) => {
      const ru = el.getAttribute("data-ru-placeholder");
      const en = el.getAttribute("data-en-placeholder");
      if (lang === "en" && en) {
        el.setAttribute("placeholder", en);
      } else if (ru) {
        el.setAttribute("placeholder", ru);
      }
    });
    document.querySelectorAll("[data-ru-aria]").forEach((el) => {
      const ru = el.getAttribute("data-ru-aria");
      const en = el.getAttribute("data-en-aria");
      if (lang === "en" && en) {
        el.setAttribute("aria-label", en);
      } else if (ru) {
        el.setAttribute("aria-label", ru);
      }
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.langSwitch === lang);
    });
    document.querySelectorAll(".article-toggle").forEach((toggle) => {
      const article = toggle.closest(".blog-article");
      const isOpen = article?.classList.contains("is-expanded");
      const expand = lang === "en" ? toggle.getAttribute("data-en") : toggle.getAttribute("data-ru");
      const collapse = lang === "en" ? toggle.getAttribute("data-en-collapse") : toggle.getAttribute("data-ru-collapse");
      if (expand) toggle.textContent = isOpen && collapse ? collapse : expand;
    });
    if (persist) {
      localStorage.setItem(LANG_KEY, lang);
    }
  };

  const setupNavToggle = () => {
    const toggle = document.querySelector(".nav-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    document.querySelectorAll(".nav a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 980) {
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  };

  const encodeMediaPath = (path) => {
    if (!path || /^https?:\/\//.test(path)) return path || "";
    return path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
  };

  const imageCache = new Map();

  const preloadImage = (src) => {
    if (!src || imageCache.has(src)) return imageCache.get(src);
    const img = new Image();
    img.decoding = "async";
    img.src = encodeMediaPath(src);
    imageCache.set(src, img);
    return img;
  };

  const preloadGallery = (galleryId) => {
    if (!galleryId) return;
    document.querySelectorAll(`[data-lightbox][data-gallery="${galleryId}"]`).forEach((item) => {
      preloadImage(getLightboxSrc(item));
    });
  };

  const setupImagePreload = () => {
    const sources = new Set();
    document.querySelectorAll("[data-lightbox]").forEach((el) => {
      const src = getLightboxSrc(el);
      if (src) sources.add(src);
    });

    const preloadAll = () => sources.forEach((src) => preloadImage(src));

    if ("requestIdleCallback" in window) {
      requestIdleCallback(preloadAll, { timeout: 2500 });
    } else {
      setTimeout(preloadAll, 400);
    }

    document.querySelectorAll("[data-lightbox]").forEach((el) => {
      el.addEventListener(
        "pointerenter",
        () => {
          preloadImage(getLightboxSrc(el));
          preloadGallery(el.dataset.gallery);
        },
        { passive: true }
      );
    });
  };

  const getLightboxSrc = (link) => {
    let src =
      link.dataset.lightboxSrc ||
      link.getAttribute("href") ||
      link.dataset.lightbox;
    if (!src || src === "#") {
      src = link.querySelector("img")?.getAttribute("src") || "";
    }
    return src;
  };

  const getLightboxTitle = (link, lang) => {
    const titleRu = link.dataset.titleRu || link.dataset.title || "";
    const titleEn = link.dataset.titleEn || "";
    return lang === "en" && titleEn ? titleEn : titleRu;
  };

  const setupLightbox = () => {
    const modal = document.querySelector(".lightbox");
    if (!modal) return;
    const modalImg = modal.querySelector("img");
    const caption = modal.querySelector(".lightbox-caption");
    const closeBtn = modal.querySelector(".lightbox-close");
    const prevBtn = modal.querySelector(".lightbox-prev");
    const nextBtn = modal.querySelector(".lightbox-next");
    let galleryItems = [];
    let currentIndex = 0;

    const updateNavVisibility = () => {
      const hasGallery = galleryItems.length > 1;
      if (prevBtn) prevBtn.style.display = hasGallery ? "" : "none";
      if (nextBtn) nextBtn.style.display = hasGallery ? "" : "none";
    };

    const showSlide = (index) => {
      if (!galleryItems.length) return;
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[currentIndex];
      const cached = preloadImage(item.src);
      const encoded = encodeMediaPath(item.src);

      modalImg.classList.toggle("is-ready", cached.complete);
      modalImg.classList.toggle("is-loading", !cached.complete);
      modalImg.src = encoded;
      modalImg.alt = "";
      caption.textContent = item.title || "";

      if (!cached.complete) {
        const onReady = () => {
          modalImg.classList.remove("is-loading");
          modalImg.classList.add("is-ready");
          modalImg.removeEventListener("load", onReady);
        };
        modalImg.addEventListener("load", onReady);
      }

      if (modalImg.decode) {
        modalImg.decode().catch(() => {});
      }

      const nextItem = galleryItems[(currentIndex + 1) % galleryItems.length];
      const prevItem =
        galleryItems[(currentIndex - 1 + galleryItems.length) % galleryItems.length];
      if (nextItem) preloadImage(nextItem.src);
      if (prevItem) preloadImage(prevItem.src);
    };

    const openModal = (link) => {
      const lang = document.body.getAttribute("data-lang") || "ru";
      const galleryId = link.dataset.gallery;

      if (galleryId) {
        preloadGallery(galleryId);
        const seen = new Set();
        galleryItems = [];
        document.querySelectorAll(`[data-lightbox][data-gallery="${galleryId}"]`).forEach((item) => {
          const src = getLightboxSrc(item);
          if (!src || seen.has(src)) return;
          seen.add(src);
          galleryItems.push({
            src,
            title: getLightboxTitle(item, lang),
          });
        });
        const clickedSrc = getLightboxSrc(link);
        galleryItems.sort((a, b) => {
          const num = (src) => parseInt(src.match(/(\d+)/)?.[1] || "0", 10);
          return num(a.src) - num(b.src);
        });
        currentIndex = Math.max(
          0,
          galleryItems.findIndex((item) => item.src === clickedSrc)
        );
      } else {
        const src = getLightboxSrc(link);
        preloadImage(src);
        galleryItems = [
          {
            src,
            title: getLightboxTitle(link, lang),
          },
        ];
        currentIndex = 0;
      }

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      showSlide(currentIndex);
      updateNavVisibility();
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      caption.textContent = "";
      galleryItems = [];
      currentIndex = 0;
      updateNavVisibility();
    };

    document.querySelectorAll("[data-lightbox]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openModal(link);
      });
    });

    prevBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      showSlide(currentIndex - 1);
    });

    nextBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      showSlide(currentIndex + 1);
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    closeBtn?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("is-open")) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft" && galleryItems.length > 1) showSlide(currentIndex - 1);
      if (event.key === "ArrowRight" && galleryItems.length > 1) showSlide(currentIndex + 1);
    });

    updateNavVisibility();
  };

  const setupVideoModal = () => {
    const modal = document.querySelector(".video-lightbox");
    if (!modal) return;
    const video = modal.querySelector("video");
    const caption = modal.querySelector(".lightbox-caption");
    const closeBtn = modal.querySelector(".lightbox-close");
    if (!video) return;

    document.querySelectorAll("[data-video]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const src = trigger.dataset.video;
        if (!src) return;
        video.src = encodeMediaPath(src);
        caption.textContent = "";
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        video.play().catch(() => {});
      });
    });

    const closeModal = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      caption.textContent = "";
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    };

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    closeBtn?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  };

  const setupContactForm = () => {
    const form = document.querySelector(".contact-form");
    if (!form) return;
    const status = form.querySelector(".form-status");
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const lang = document.body.getAttribute("data-lang") || "ru";
      const sendingText = lang === "en" ? "Sending…" : "Отправка…";
      const successText =
        lang === "en"
          ? "Thank you! Your message has been sent."
          : "Спасибо, ваше сообщение отправлено!";
      const errorText =
        lang === "en"
          ? "Something went wrong. Please try again or email us at lediprovizor@gmail.com."
          : "Не удалось отправить сообщение. Попробуйте ещё раз или напишите на lediprovizor@gmail.com.";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.sending = "true";
        submitBtn.textContent = sendingText;
      }
      if (status) {
        status.hidden = true;
        status.className = "form-status";
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          form.reset();
          if (status) {
            status.textContent = successText;
            status.className = "form-status form-status-success";
            status.hidden = false;
          }
        } else {
          throw new Error(data.error || "Form submission failed");
        }
      } catch (_) {
        if (status) {
          status.textContent = errorText;
          status.className = "form-status form-status-error";
          status.hidden = false;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.dataset.sending = "false";
          const label =
            lang === "en"
              ? submitBtn.getAttribute("data-en") || "Send"
              : submitBtn.getAttribute("data-ru") || "Отправить";
          submitBtn.textContent = label;
        }
      }
    });
  };

  const setupArticleToggle = () => {
    document.querySelectorAll(".blog-article").forEach((article) => {
      const toggle = article.querySelector(".article-toggle");
      if (!toggle) return;
      toggle.addEventListener("click", () => {
        const isOpen = article.classList.toggle("is-expanded");
        const lang = document.body.getAttribute("data-lang") || "ru";
        const expandRu = toggle.getAttribute("data-ru") || "Читать полностью";
        const expandEn = toggle.getAttribute("data-en") || "Read full";
        const collapseRu = toggle.getAttribute("data-ru-collapse") || "Свернуть";
        const collapseEn = toggle.getAttribute("data-en-collapse") || "Collapse";
        toggle.textContent = isOpen
          ? lang === "en"
            ? collapseEn
            : collapseRu
          : lang === "en"
            ? expandEn
            : expandRu;
      });
    });
  };

  const setupVideoPreviews = () => {
    document.querySelectorAll(".reels-video-card").forEach((card) => {
      const video = card.querySelector("video");
      const src = card.dataset.video;
      if (!video || !src) return;
      const encoded = encodeMediaPath(src);
      video.src = `${encoded}#t=0.1`;
      video.load();
      video.addEventListener("loadeddata", () => {
        try {
          video.currentTime = 0.1;
        } catch (_) {}
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupNavToggle();
    setupLightbox();
    setupImagePreload();
    setupVideoModal();
    setupContactForm();
    setupArticleToggle();
    setupVideoPreviews();
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.langSwitch));
    });
    setLang(getSavedLang(), false);
  });
})();
