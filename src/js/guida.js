/**
 * Guida funzionalità — navigazione indice e pulsante «torna su».
 */

function initGuidaNav() {
  const links = Array.from(document.querySelectorAll(".guida-nav-list a[href^='#']"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
    });
  };

  if ("IntersectionObserver" in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((sec) => observer.observe(sec));
  }

  links.forEach((a) => {
    a.addEventListener("click", () => {
      const id = (a.getAttribute("href") || "").slice(1);
      if (id) setActive(id);
    });
  });
}

function initBackToTop() {
  const btn = document.getElementById("guida-back-top");
  if (!btn) return;

  const update = () => {
    btn.classList.toggle("is-visible", window.scrollY > 420);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGuidaNav();
  initBackToTop();
});
