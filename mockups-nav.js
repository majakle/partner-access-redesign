(function () {
  const nav = document.querySelector(".primary-nav");
  if (!nav) return;
  const btn = nav.querySelector(".hamburger");
  const links = nav.querySelector(".nav-links");
  const cta = nav.querySelector(".nav-cta");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    links.classList.toggle("is-open", !open);
    if (cta) cta.classList.toggle("is-open", !open);
  });
})();
