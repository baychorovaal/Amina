(() => {
  const setLang = (lang) => {
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

  const setupLightbox = () => {
    const modal = document.querySelector(".lightbox");
    if (!modal) return;
    const modalImg = modal.querySelector("img");
    const caption = modal.querySelector(".lightbox-caption");
    const closeBtn = modal.querySelector(".lightbox-close");

    document.querySelectorAll("[data-lightbox]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        let src = link.getAttribute("href") || link.dataset.lightbox;
        if (!src || src === "#") {
          src = link.querySelector("img")?.getAttribute("src") || "";
        }
        const lang = document.body.getAttribute("data-lang") || "ru";
        const titleRu = link.dataset.titleRu || link.dataset.title || "";
        const titleEn = link.dataset.titleEn || "";
        const title = lang === "en" && titleEn ? titleEn : titleRu;
        modalImg.src = src;
        modalImg.alt = title;
        caption.textContent = title;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
      });
    });

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modalImg.src = "";
      modalImg.alt = "";
      caption.textContent = "";
    };

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    closeBtn?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupNavToggle();
    setupLightbox();
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.langSwitch));
    });
    setLang("ru");
  });
})();
