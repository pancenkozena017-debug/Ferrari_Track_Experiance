(() => {
  "use strict";

  const endpoint = "https://formsubmit.co/ajax/panchenkozena017@gmail.com";

  document.querySelectorAll("form[data-email-form]").forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector("[data-form-feedback]");

    if (!(submitButton instanceof HTMLButtonElement) || !feedback) {
      console.error("Не вдалося ініціалізувати форму: відсутня кнопка або повідомлення про стан.", form);
      return;
    }

    const originalButtonContent = submitButton.innerHTML;
    let isSubmitting = false;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting || !form.reportValidity()) return;

      const nameField = form.elements.namedItem("name");
      if (nameField instanceof HTMLInputElement && nameField.value.trim().length < 2) {
        nameField.setCustomValidity("Введіть ім’я щонайменше з двох символів.");
        nameField.reportValidity();
        return;
      }
      if (nameField instanceof HTMLInputElement) nameField.setCustomValidity("");

      const payload = Object.fromEntries(
        Array.from(new FormData(form).entries(), ([name, value]) => {
          const field = form.elements.namedItem(name);
          const fieldValue = field instanceof HTMLSelectElement
            ? field.selectedOptions[0]?.textContent.trim() || value
            : typeof value === "string" ? value.trim() : value;
          return [name, fieldValue];
        })
      );
      payload._subject = form.dataset.emailSubject || "Нова заявка з сайту Ferrari Track Experience";
      payload._template = "table";

      isSubmitting = true;
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Надсилання...';
      feedback.textContent = "";
      delete feedback.dataset.state;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || String(result.success).toLowerCase() !== "true") {
          throw new Error(result.message || "Сервіс не прийняв заявку.");
        }

        form.reset();
        feedback.textContent = "Дякуємо! Ваш запит надіслано. Ми зв’яжемося з вами найближчим часом.";
        feedback.dataset.state = "success";
      } catch (error) {
        console.error("Не вдалося надіслати заявку.", error);
        feedback.textContent = "Не вдалося надіслати заявку. Перевірте з’єднання та спробуйте ще раз.";
        feedback.dataset.state = "error";
      } finally {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.innerHTML = originalButtonContent;
      }
    });

    const nameField = form.elements.namedItem("name");
    if (nameField instanceof HTMLInputElement) {
      nameField.addEventListener("input", () => nameField.setCustomValidity(""));
    }
  });
})();
