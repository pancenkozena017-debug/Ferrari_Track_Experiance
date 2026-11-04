const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  themeToggle.setAttribute(
    "aria-pressed",
    String(document.documentElement.classList.contains("dark")),
  );

  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.setAttribute("aria-pressed", String(isDark));
  });
}
