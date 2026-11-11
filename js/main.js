(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const scheduleLowPriority = window.requestIdleCallback
      ? (callback) => window.requestIdleCallback(callback, { timeout: 1000 })
      : (callback) => window.setTimeout(callback, 0);
    const runOptionalFeature = (featureName, callback) => {
      try {
        callback();
      } catch (error) {
        console.error(`Не вдалося ініціалізувати ${featureName}.`, error);
      }
    };

    const themeToggle = document.querySelector("#theme-toggle");
    if (themeToggle) {
      runOptionalFeature("перемикач теми", () => {
        const root = document.documentElement;
        const updateHeroImage = (isDark) => {
          const heroImage = document.querySelector("#home > img");
          if (heroImage) {
            heroImage.src = isDark
              ? "assets/images/hero-bg.webp"
              : "assets/images/Hero_bg_white.webp";
          }
        };

        themeToggle.setAttribute("aria-pressed", String(root.classList.contains("dark")));
        themeToggle.addEventListener("click", () => {
          runOptionalFeature("перемикання теми", () => {
            const isDark = root.classList.toggle("dark");
            root.classList.toggle("light-theme", !isDark);
            updateHeroImage(isDark);
            themeToggle.setAttribute("aria-pressed", String(isDark));

            try {
              window.localStorage.setItem("theme", isDark ? "dark" : "light");
            } catch (error) {
              console.error("Не вдалося зберегти налаштування теми.", error);
            }
          });
        });
      });
    }

    const typedText = document.querySelector("#typed-text");
    if (typedText) {
      scheduleLowPriority(() => {
        runOptionalFeature("анімацію Typed.js", () => {
          if (typeof Typed !== "function") {
            console.error("Typed.js не завантажився; анімацію тексту пропущено.");
            return;
          }

          new Typed(typedText, {
            strings: ["потужність Ferrari", "адреналін треку", "точність телеметрії"],
            typeSpeed: 60,
            backSpeed: 35,
            backDelay: 1400,
            loop: true
          });
        });
      });
    }

    const hasFerrariGallery = document.querySelector("[data-fancybox='ferrari-gallery']");
    if (hasFerrariGallery) {
      scheduleLowPriority(() => {
        runOptionalFeature("галерею Fancybox", () => {
          if (typeof Fancybox === "undefined") {
            console.error("Fancybox не завантажився; модальна галерея недоступна.");
            return;
          }

          Fancybox.bind("[data-fancybox='ferrari-gallery']", {});
        });
      });
    }

    const reviewsElement = document.querySelector(".pilot-reviews-swiper");
    if (reviewsElement) {
      const paginationElement = reviewsElement.querySelector(".swiper-pagination");
      const nextButton = reviewsElement.querySelector(".swiper-button-next");
      const previousButton = reviewsElement.querySelector(".swiper-button-prev");

      if (paginationElement && nextButton && previousButton) {
        scheduleLowPriority(() => {
          runOptionalFeature("карусель відгуків Swiper", () => {
            if (typeof Swiper !== "function") {
              console.error("Swiper не завантажився; карусель відгуків недоступна.");
              return;
            }

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
          });
        });
      } else {
        console.error("Елементи керування каруселлю не знайдено.");
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

      const createUniqueId = (base, element) => {
        let id = base;
        let suffix = 1;
        while (document.getElementById(id) && document.getElementById(id) !== element) {
          id = `${base}-${suffix++}`;
        }
        return id;
      };

      lapsHint.id = createUniqueId(`track-calculator-${index}-laps-hint`);
      calcErrorContainer.id = createUniqueId("calc-error-container", calcErrorContainer);
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

      let previousInputs;
      const calculateTrackCost = () => {
        const inputs = [carSelect.value, lapsInput.value, telemetrySelect.value, videoCheck.checked];
        if (previousInputs && inputs.every((value, inputIndex) => value === previousInputs[inputIndex])) {
          return;
        }
        previousInputs = inputs;

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

      const safelyCalculateTrackCost = () => {
        runOptionalFeature("розрахунок калькулятора", calculateTrackCost);
      };

      lapsInput.addEventListener("input", safelyCalculateTrackCost, { passive: true });
      lapsInput.addEventListener("change", safelyCalculateTrackCost, { passive: true });
      [carSelect, telemetrySelect, videoCheck].forEach((input) => {
        input.addEventListener("change", safelyCalculateTrackCost, { passive: true });
      });

      scheduleLowPriority(safelyCalculateTrackCost);
    });

    const bookingForm = document.querySelector("#booking-form");
    const bookingDate = document.querySelector("#booking-date");
    const bookingCar = document.querySelector("#booking-car");
    const trackSelect = document.querySelector("#booking-track");
    const coachSelect = document.querySelector("#booking-coach");

    if (bookingForm && bookingDate && bookingCar && trackSelect && coachSelect) {
      runOptionalFeature("форми бронювання", () => {
        const query = new URLSearchParams(window.location.search);
        const requestedCar = query.get("car");
        const requestedTrack = query.get("track");
        const requestedCoach = query.get("instructor");
        const carOptions = new Set(["testa-rossa", "488-pista", "laferrari", "499p"]);
        const trackOptions = new Set(["monza", "spa", "nurburgring"]);
        const coachOptions = new Set(["marco", "matteo", "luca"]);
        const applyRequestedOptions = () => {
          if (carOptions.has(requestedCar)) bookingCar.value = requestedCar;
          if (trackOptions.has(requestedTrack)) trackSelect.value = requestedTrack;
          if (coachOptions.has(requestedCoach)) coachSelect.value = requestedCoach;
        };

        bookingDate.min = new Date().toLocaleDateString("en-CA");
        applyRequestedOptions();
        bookingForm.addEventListener("reset", () => {
          window.setTimeout(applyRequestedOptions, 0);
        });
      });
    }

    const bookingValidationForm = document.querySelector("#booking-form");
    const successModal = document.querySelector("#successModal");
    const closeModalButton = document.querySelector("#closeModalBtn");
    const successModalMessage = document.querySelector("#successModalMessage");

    if (bookingValidationForm && successModal && closeModalButton && successModalMessage) {
      runOptionalFeature("валідацію форми бронювання", () => {
        const namePattern = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'-]{2,50}$/;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phonePattern = /^\+?[0-9\s\(\)\-]{10,20}$/;
        const fields = Array.from(bookingValidationForm.querySelectorAll("input, select, textarea"));
        let returnFocusTo = null;

        bookingValidationForm.noValidate = true;
        successModalMessage.textContent =
          "Форма успішно пройшла клієнтську валідацію. Демонстрація успішного надсилання";

        const getErrorMessage = (field) => {
          if (field.name === "phone" || field.type === "tel") {
            return "Введіть коректний номер телефону";
          }

          switch (field.name) {
            case "name":
              return "Введіть коректне ім’я";
            case "email":
              return "Введіть коректну електронну пошту";
            case "track":
              return "Оберіть трасу";
            case "date":
              return "Оберіть бажану дату";
            case "consent":
              return "Потрібно надати згоду на обробку даних";
            default:
              return "Заповніть це поле";
          }
        };

        const isFieldValid = (field) => {
          const value = field.value;
          if (field.name === "name") return namePattern.test(value);
          if (field.name === "email") return emailPattern.test(value);
          if (field.name === "phone" || field.type === "tel") {
            return (!value.trim() && !field.required) || phonePattern.test(value);
          }
          if (field instanceof HTMLTextAreaElement) return value.trim().length > 0;
          if (
            field instanceof HTMLInputElement &&
            ["text", "search", "url"].includes(field.type) &&
            field.required
          ) {
            return value.trim().length > 0 && field.checkValidity();
          }
          return !field.required || field.checkValidity();
        };

        const getErrorElement = (field) => {
          const errorId = `${field.id || field.name}-error`;
          let error = document.getElementById(errorId);
          if (!error) {
            error = document.createElement("p");
            error.id = errorId;
            error.className = "error-msg mt-1 text-xs text-red-500";
            error.setAttribute("role", "alert");
            field.insertAdjacentElement("afterend", error);
          }
          return error;
        };

        const setFieldValidity = (field) => {
          const valid = isFieldValid(field);
          const errorId = `${field.id || field.name}-error`;
          const error = document.getElementById(errorId);
          field.classList.toggle("border-red-500", !valid);
          field.classList.toggle("focus:ring-red-500", !valid);
          field.setAttribute("aria-invalid", String(!valid));

          if (valid) {
            if (error) error.remove();
            const describedBy = (field.getAttribute("aria-describedby") || "")
              .split(/\s+/)
              .filter((id) => id && id !== errorId);
            if (describedBy.length > 0) {
              field.setAttribute("aria-describedby", describedBy.join(" "));
            } else {
              field.removeAttribute("aria-describedby");
            }
            return true;
          }

          const errorElement = getErrorElement(field);
          errorElement.textContent = getErrorMessage(field);
          const describedBy = new Set(
            (field.getAttribute("aria-describedby") || "")
              .split(/\s+/)
              .filter(Boolean)
          );
          describedBy.add(errorId);
          field.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
          return false;
        };

        const clearFieldError = (field) => {
          field.classList.remove("border-red-500", "focus:ring-red-500");
          field.removeAttribute("aria-invalid");
          const errorId = `${field.id || field.name}-error`;
          const error = document.getElementById(errorId);
          if (error) error.remove();
          const describedBy = (field.getAttribute("aria-describedby") || "")
            .split(/\s+/)
            .filter((id) => id && id !== errorId);
          if (describedBy.length > 0) {
            field.setAttribute("aria-describedby", describedBy.join(" "));
          } else {
            field.removeAttribute("aria-describedby");
          }
        };

        const closeModal = () => {
          successModal.classList.add("hidden");
          successModal.classList.remove("flex");
          document.body.classList.remove("overflow-hidden");
          if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
            returnFocusTo.focus();
          }
          returnFocusTo = null;
        };

        const openModal = () => {
          returnFocusTo = document.activeElement;
          successModal.classList.remove("hidden");
          successModal.classList.add("flex");
          document.body.classList.add("overflow-hidden");
          closeModalButton.focus();
        };

        fields.forEach((field) => {
          field.addEventListener("input", () => {
            runOptionalFeature("валідацію поля", () => {
              if (field.getAttribute("aria-invalid") === "true") setFieldValidity(field);
            });
          }, { passive: true });
          field.addEventListener("change", () => {
            runOptionalFeature("валідацію поля", () => {
              if (field.getAttribute("aria-invalid") === "true") setFieldValidity(field);
            });
          }, { passive: true });
        });

        bookingValidationForm.addEventListener("reset", () => {
          runOptionalFeature("очищення помилок форми", () => fields.forEach(clearFieldError));
        });

        bookingValidationForm.addEventListener("submit", (event) => {
          runOptionalFeature("надсилання форми бронювання", () => {
            event.preventDefault();
            const validatedFields = fields.filter(
              (field) =>
                field.required ||
                field.name === "name" ||
                field.name === "email" ||
                field.name === "phone" ||
                field.type === "tel" ||
                field instanceof HTMLTextAreaElement
            );
            const invalidFields = validatedFields.filter((field) => !setFieldValidity(field));
            if (invalidFields.length > 0) {
              invalidFields[0].focus();
              return;
            }
            bookingValidationForm.reset();
            openModal();
          });
        });

        closeModalButton.addEventListener("click", () => {
          runOptionalFeature("закриття вікна підтвердження", closeModal);
        });

        successModal.addEventListener("click", (event) => {
          if (event.target === successModal) {
            runOptionalFeature("закриття вікна підтвердження", closeModal);
          }
        });

        document.addEventListener("keydown", (event) => {
          if (successModal.classList.contains("hidden")) return;
          if (event.key === "Escape") {
            runOptionalFeature("закриття вікна підтвердження", closeModal);
            return;
          }
          if (event.key === "Tab") {
            event.preventDefault();
            closeModalButton.focus();
          }
        });
      });
    }

    const fleetTabs = Array.from(document.querySelectorAll(".fleet-tab"));
    if (fleetTabs.length > 0) {
      runOptionalFeature("перемикачі автопарку", () => {
        const carData = {
          "testa-rossa": {
            name: "Ferrari 250 Testa Rossa",
            model: "./assets/models/ferrari-250-testa-rossa/ferrari_250-v1.glb",
            description: "Легендарний гоночний Ferrari з атмосферним V12 і класичним характером витривалих перегонів.",
            engine: "3.0L V12",
            power: "300 к.с.",
            acceleration: "6,0 с",
            speed: "270 км/год",
            price: "$1,200"
          },
          "488-pista": {
            name: "Ferrari 488 Pista",
            model: "./assets/models/ferrari-488-pista/ferrari-488-v1.glb",
            description: "Легка, орієнтована на трек версія 488 із потужним V8 Twin-Turbo та гострою реакцією на кермо.",
            engine: "3.9L V8 Twin-Turbo",
            power: "720 к.с.",
            acceleration: "2,85 с",
            speed: "340 км/год",
            price: "$700"
          },
          laferrari: {
            name: "Ferrari LaFerrari",
            model: "./assets/models/ferrari-laferrari/ferrari_laferrari-v1.glb",
            description: "Гібридний суперкар Ferrari, що поєднує атмосферний V12 із системою HY-KERS.",
            engine: "6.3L V12 Hybrid",
            power: "963 к.с.",
            acceleration: "2,6 с",
            speed: "350 км/год",
            price: "$1,100"
          },
          "499p": {
            name: "Ferrari 499P",
            model: "./assets/models/ferrari-fxx-k-2015/ferrari_499p-v2.glb",
            description: "Гоночний прототип Ferrari для перегонів на витривалість із гібридною силовою установкою.",
            engine: "3.0L V6 Twin-Turbo Hybrid",
            power: "680 к.с.",
            acceleration: "≈2,5 с",
            speed: "≈340 км/год",
            price: "$1,500"
          }
        };
        const viewer = document.querySelector("#car-viewer");
        const panel = document.querySelector("#car-panel");
        const bookingLink = document.querySelector("#car-booking-link");
        const fields = {
          name: document.querySelector("#car-name"),
          description: document.querySelector("#car-description"),
          engine: document.querySelector("#car-engine"),
          power: document.querySelector("#car-power"),
          acceleration: document.querySelector("#car-acceleration"),
          speed: document.querySelector("#car-speed"),
          price: document.querySelector("#car-price")
        };

        if (!viewer || !panel || !bookingLink || Object.values(fields).some((field) => !field)) {
          console.error("Не вдалося ініціалізувати автопарк: відсутні обов'язкові DOM-елементи.");
          return;
        }

        const selectCar = (tab) => {
          const car = carData[tab.dataset.car];
          if (!car) {
            console.error("Не знайдено дані вибраного автомобіля.", tab.dataset.car);
            return;
          }

          viewer.src = car.model;
          viewer.alt = `Інтерактивна 3D-модель ${car.name}`;
          bookingLink.href = `index.html?car=${encodeURIComponent(tab.dataset.car)}#booking`;
          fields.name.textContent = car.name;
          fields.description.textContent = car.description;
          fields.engine.textContent = car.engine;
          fields.power.textContent = car.power;
          fields.acceleration.textContent = car.acceleration;
          fields.speed.textContent = car.speed;
          fields.price.textContent = car.price;
          panel.setAttribute("aria-labelledby", tab.id);

          fleetTabs.forEach((item) => {
            const selected = item === tab;
            item.setAttribute("aria-selected", String(selected));
            item.tabIndex = selected ? 0 : -1;
            item.classList.toggle("border-red-600", selected);
            item.classList.toggle("bg-red-600", selected);
            item.classList.toggle("text-white", selected);
            item.classList.toggle("border-slate-700", !selected);
            item.classList.toggle("bg-slate-900", !selected);
            item.classList.toggle("text-slate-300", !selected);
          });
        };

        fleetTabs.forEach((tab, index) => {
          tab.addEventListener("click", () => {
            runOptionalFeature("вибір автомобіля", () => selectCar(tab));
          });
          tab.addEventListener("keydown", (event) => {
            let nextIndex;
            if (event.key === "ArrowRight") nextIndex = (index + 1) % fleetTabs.length;
            if (event.key === "ArrowLeft") nextIndex = (index - 1 + fleetTabs.length) % fleetTabs.length;
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = fleetTabs.length - 1;
            if (nextIndex !== undefined) {
              event.preventDefault();
              fleetTabs[nextIndex].focus();
              runOptionalFeature("вибір автомобіля", () => selectCar(fleetTabs[nextIndex]));
            }
          });
        });
      });
    }
  });
})();
