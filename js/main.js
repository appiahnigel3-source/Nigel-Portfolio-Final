"use strict";

const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const header = select("#siteHeader");
const menuButton = select("#menuButton");
const navLinks = select("#navLinks");
const navigationLinks = selectAll("#navLinks a[href^='#']");
let scrollQueued = false;

function updateHeader() {
  header?.classList.toggle("scrolled", window.scrollY > 18);
  scrollQueued = false;
}

window.addEventListener("scroll", () => {
  if (scrollQueued) return;
  window.requestAnimationFrame(updateHeader);
  scrollQueued = true;
}, { passive: true });
updateHeader();

function setMenu(open) {
  menuButton?.classList.toggle("open", open);
  navLinks?.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  menuButton?.setAttribute("aria-expanded", String(open));
  const label = menuButton?.querySelector(".sr-only");
  if (label) label.textContent = open ? "Close navigation" : "Open navigation";
}

menuButton?.addEventListener("click", () => setMenu(!navLinks?.classList.contains("open")));
navigationLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

const observedSections = navigationLinks
  .map((link) => select(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-38% 0px -54%", threshold: 0 });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

const revealElements = selectAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("in-view"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -40px" });
  revealElements.forEach((element) => revealObserver.observe(element));
}

if (finePointer && !reducedMotion) {
  const spotlight = select("#spotlight");
  window.addEventListener("pointermove", (event) => {
    if (!spotlight) return;
    spotlight.style.left = `${event.clientX}px`;
    spotlight.style.top = `${event.clientY}px`;
    spotlight.style.opacity = "1";
  }, { passive: true });

  selectAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const rotateX = ((event.clientY - bounds.top) / bounds.height - .5) * -2.2;
      const rotateY = ((event.clientX - bounds.left) / bounds.width - .5) * 2.2;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  selectAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * .08;
      const y = (event.clientY - bounds.top - bounds.height / 2) * .08;
      element.style.transform = `translate3d(${x}px,${y}px,0)`;
    });
    element.addEventListener("pointerleave", () => { element.style.transform = ""; });
  });

  const parallax = select("[data-parallax]");
  const terminal = select(".terminal-card", parallax || document);
  parallax?.addEventListener("pointermove", (event) => {
    if (!terminal) return;
    const bounds = parallax.getBoundingClientRect();
    terminal.style.setProperty("--terminal-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 7}px`);
    terminal.style.setProperty("--terminal-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 7}px`);
  });
  parallax?.addEventListener("pointerleave", () => {
    terminal?.style.setProperty("--terminal-x", "0px");
    terminal?.style.setProperty("--terminal-y", "0px");
  });
  window.addEventListener("scroll", () => {
    if (!parallax) return;
    const bounds = parallax.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
    parallax.style.setProperty("--parallax-y", `${window.scrollY * .025}px`);
  }, { passive: true });
}

const contactForm = select("#contactForm");
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const message = String(data.get("message") || "").trim();
  const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
  window.location.href = `mailto:nigelpiah@gmail.com?subject=${subject}&body=${body}`;
});

const counters = selectAll("[data-count]");
function setCounter(counter, value) {
  counter.textContent = String(value).padStart(2, "0");
}

if (reducedMotion || !("IntersectionObserver" in window)) {
  counters.forEach((counter) => setCounter(counter, Number(counter.dataset.count)));
} else {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      const target = Number(counter.dataset.count);
      const start = performance.now();
      const duration = 700;
      function animate(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCounter(counter, Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(animate);
      }
      window.requestAnimationFrame(animate);
      observer.unobserve(counter);
    });
  }, { threshold: .7 });
  counters.forEach((counter) => {
    setCounter(counter, 0);
    counterObserver.observe(counter);
  });
}

const gallery = select("#projectGallery");
const galleryTrigger = select("[data-gallery-open]");
const gallerySlides = selectAll("[data-gallery-slide]");
const galleryThumbnails = selectAll("[data-gallery-index]");
const galleryCurrent = select("#galleryCurrent");
let currentSlide = 1;
let galleryReturnFocus = null;

function showSlide(index) {
  currentSlide = (index + gallerySlides.length) % gallerySlides.length;
  gallerySlides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === currentSlide));
  galleryThumbnails.forEach((thumbnail, thumbnailIndex) => {
    const active = thumbnailIndex === currentSlide;
    thumbnail.classList.toggle("is-active", active);
    if (active) thumbnail.setAttribute("aria-current", "true");
    else thumbnail.removeAttribute("aria-current");
  });
  if (galleryCurrent) galleryCurrent.textContent = String(currentSlide + 1);
}

function openGallery() {
  if (!gallery) return;
  galleryReturnFocus = document.activeElement;
  gallery.hidden = false;
  document.body.classList.add("dialog-open");
  showSlide(1);
  select("[data-gallery-close]", gallery)?.focus();
}

function closeGallery() {
  if (!gallery || gallery.hidden) return;
  gallery.hidden = true;
  document.body.classList.remove("dialog-open");
  galleryReturnFocus?.focus();
}

galleryTrigger?.addEventListener("click", openGallery);
selectAll("[data-gallery-close]", gallery || document).forEach((button) => button.addEventListener("click", closeGallery));
select("[data-gallery-previous]", gallery)?.addEventListener("click", () => showSlide(currentSlide - 1));
select("[data-gallery-next]", gallery)?.addEventListener("click", () => showSlide(currentSlide + 1));
galleryThumbnails.forEach((thumbnail) => thumbnail.addEventListener("click", () => showSlide(Number(thumbnail.dataset.galleryIndex))));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    closeGallery();
  }
  if (!gallery || gallery.hidden) return;
  if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
  if (event.key === "ArrowRight") showSlide(currentSlide + 1);
  if (event.key !== "Tab") return;
  const focusable = selectAll("button:not([disabled]), a[href]", gallery);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const year = select("#year");
if (year) year.textContent = String(new Date().getFullYear());
