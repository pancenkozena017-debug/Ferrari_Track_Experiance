(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#typed-text")) {
    if (typeof Typed === "function") {
      new Typed("#typed-text", {
        strings: ["потужність Ferrari", "адреналін треку", "точність телеметрії"],
        typeSpeed: 60,
        backSpeed: 35,
        backDelay: 1400,
        loop: true
      });
    } else {
      console.error("Typed.js не завантажився; анімацію тексту пропущено.");
    }
  }

  if (document.querySelector("[data-fancybox='ferrari-gallery']")) {
    if (typeof Fancybox !== "undefined") {
      Fancybox.bind("[data-fancybox='ferrari-gallery']", {});
    } else {
      console.error("Fancybox не завантажився; модальна галерея недоступна.");
    }
  }

  const reviewsElement = document.querySelector(".pilot-reviews-swiper");
  if (reviewsElement) {
    const paginationElement = reviewsElement.querySelector(".swiper-pagination");
    const nextButton = reviewsElement.querySelector(".swiper-button-next");
    const previousButton = reviewsElement.querySelector(".swiper-button-prev");

    if (typeof Swiper === "function" && paginationElement && nextButton && previousButton) {
      new Swiper(reviewsElement, {
        loop: true,
        spaceBetween: 24,
        autoplay: {
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        pagination: {
          el: paginationElement,
          clickable: true
        },
        navigation: {
          nextEl: nextButton,
          prevEl: previousButton
        },
        breakpoints: {
          320: {
            slidesPerView: 1
          },
          768: {
            slidesPerView: 2
          },
          1024: {
            slidesPerView: 3
          }
        }
      });
    } else {
      console.error("Swiper або елементи керування каруселлю не знайдено.");
    }
  }

    document.querySelectorAll("[data-track-calculator]").forEach((widget, index) => {
      const carSelect = widget.querySelector("[data-car-select]");
      const lapsInput = widget.querySelector("[data-laps-input]");
      const telemetrySelect = widget.querySelector("[data-telemetry-select]");
      const videoCheck = widget.querySelector("[data-video-check]");
      const totalPrice = widget.querySelector("[data-total-price]");
      const calcErrorContainer = widget.querySelector("[data-calc-error-container]");
      const lapsHint = widget.querySelector("[data-laps-hint]");

      if (!carSelect || !lapsInput || !telemetrySelect || !videoCheck || !totalPrice || !calcErrorContainer || !lapsHint) {
        console.error("Не вдалося ініціалізувати калькулятор: у віджеті відсутні обов'язкові елементи.", widget);
        return;
      }

      const createUniqueId = (base) => {
        let id = base;
        let suffix = 1;
        while (document.getElementById(id)) {
          id = `${base}-${suffix++}`;
        }
        return id;
      };

      lapsHint.id = createUniqueId(`track-calculator-${index}-laps-hint`);
      calcErrorContainer.id = createUniqueId(`track-calculator-${index}-laps-error`);
      lapsInput.setAttribute("aria-describedby", `${lapsHint.id} ${calcErrorContainer.id}`);

      const setError = (message, invalidInput = null) => {
        calcErrorContainer.textContent = message;
        calcErrorContainer.classList.remove("hidden");
        lapsInput.classList.remove("border-red-500", "focus:ring-red-500", "text-red-900", "bg-red-50");
        lapsInput.classList.add("border-gray-300", "focus:ring-red-600", "text-gray-900", "bg-white");
        lapsInput.removeAttribute("aria-invalid");

        if (invalidInput === lapsInput) {
          lapsInput.classList.remove("border-gray-300", "focus:ring-red-600", "text-gray-900", "bg-white");
          lapsInput.classList.add("border-red-500", "focus:ring-red-500", "text-red-900", "bg-red-50");
          lapsInput.setAttribute("aria-invalid", "true");
        }
      };

      const clearError = () => {
        calcErrorContainer.textContent = "";
        calcErrorContainer.classList.add("hidden");
        lapsInput.classList.remove("border-red-500", "focus:ring-red-500", "text-red-900", "bg-red-50");
        lapsInput.classList.add("border-gray-300", "focus:ring-red-600", "text-gray-900", "bg-white");
        lapsInput.removeAttribute("aria-invalid");
      };

      const calculateTrackCost = () => {
        const carRate = Number(carSelect.value);
        if (![700, 1100, 1200, 1500].includes(carRate)) {
          totalPrice.textContent = "$0";
          setError("Оберіть коректну модель Ferrari.");
          return;
        }

        const lapsCount = Number(lapsInput.value);
        if (!Number.isInteger(lapsCount) || lapsCount < 1 || lapsCount > 50) {
          totalPrice.textContent = "$0";
          setError(
            lapsCount < 1
              ? "Мінімальна кількість кіл для заїзду — 1."
              : "Кількість кіл має бути цілим числом від 1 до 50.",
            lapsInput
          );
          return;
        }

        const telemetryRate = Number(telemetrySelect.value);
        if (![0, 250, 500].includes(telemetryRate)) {
          totalPrice.textContent = "$0";
          setError("Оберіть коректний пакет телеметрії.");
          return;
        }

        const videoRate = videoCheck.checked ? 150 : 0;
        const total = (carRate * lapsCount) + telemetryRate + videoRate;
        if (!Number.isFinite(total) || total < 0) {
          totalPrice.textContent = "$0";
          setError("Не вдалося розрахувати вартість. Перевірте вибрані параметри.");
          return;
        }

        clearError();
        totalPrice.textContent = `$${total.toLocaleString("en-US")}`;
      };

      lapsInput.addEventListener("input", calculateTrackCost);
      lapsInput.addEventListener("change", calculateTrackCost);
      [carSelect, telemetrySelect, videoCheck].forEach((input) => {
        input.addEventListener("change", calculateTrackCost);
      });

      calculateTrackCost();
    });
  });
})();
