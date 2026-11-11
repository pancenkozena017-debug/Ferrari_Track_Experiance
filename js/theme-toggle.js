const themeToggle = document.getElementById("theme-toggle");
const root = document.documentElement;

if (themeToggle) {
  themeToggle.setAttribute(
    "aria-pressed",
    String(root.classList.contains("dark")),
  );

  themeToggle.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    root.classList.toggle("light-theme", !isDark);
    const heroImage = document.querySelector("#home > img");
    if (heroImage) {
      heroImage.src = isDark
        ? "assets/images/hero-bg.webp"
        : "assets/images/Hero_bg_white.webp";
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.setAttribute("aria-pressed", String(isDark));
  });
}
