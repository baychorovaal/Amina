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
      modalImg.src = encodeMediaPath(item.src);
      modalImg.alt = "";
      caption.textContent = item.title || "";
    };

    const openModal = (link) => {
      const lang = document.body.getAttribute("data-lang") || "ru";
      const galleryId = link.dataset.gallery;

      if (galleryId) {
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
        galleryItems = [
          {
            src: getLightboxSrc(link),
            title: getLightboxTitle(link, lang),
          },
        ];
        currentIndex = 0;
      }

      showSlide(currentIndex);
      updateNavVisibility();
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modalImg.src = "";
      modalImg.alt = "";
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
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.querySelector("#name")?.value.trim() || "";
      const email = form.querySelector("#email")?.value.trim() || "";
      const message = form.querySelector("#message")?.value.trim() || "";
      const subject = encodeURIComponent(`LEDIPROVIZOR — сообщение от ${name || "клиента"}`);
      const body = encodeURIComponent(
        `Имя: ${name}\nEmail: ${email}\n\n${message}`
      );
      window.location.href = `mailto:lediprovizor@gmail.com?subject=${subject}&body=${body}`;
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
