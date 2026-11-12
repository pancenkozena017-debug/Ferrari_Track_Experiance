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
      calcErrorContainer.setAttribute("aria-live", "polite");
      calcErrorContainer.setAttribute("aria-atomic", "true");
      lapsInput.setAttribute("aria-describedby", `${lapsHint.id} ${calcErrorContainer.id}`);

      const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      });

      const calculateTrackCost = ({ carValue, lapsValue, telemetryValue, includeVideo }) => {
        const normalizedLaps = lapsValue.trim();
        if (!/^\d+$/.test(normalizedLaps)) {
          return { total: 0, error: "Вкажіть кількість кіл від 1 до 50.", invalidLaps: true };
        }

        const lapsCount = Number(normalizedLaps);
        if (!Number.isInteger(lapsCount) || lapsCount < 1 || lapsCount > 50) {
          return { total: 0, error: "Вкажіть кількість кіл від 1 до 50.", invalidLaps: true };
        }

        const carRate = Number(carValue);
        if (![700, 1100, 1200, 1500].includes(carRate)) {
          return { total: 0, error: "Оберіть коректну модель Ferrari.", invalidLaps: false };
        }

        const telemetryRate = Number(telemetryValue);
        if (![0, 250, 500].includes(telemetryRate)) {
          return { total: 0, error: "Оберіть коректний пакет телеметрії.", invalidLaps: false };
        }

        const total = carRate * lapsCount + telemetryRate + (includeVideo ? 150 : 0);
        if (!Number.isSafeInteger(total) || total < 0) {
          return {
            total: 0,
            error: "Не вдалося розрахувати вартість. Перевірте вибрані параметри.",
            invalidLaps: false
          };
        }

        return { total, error: "", invalidLaps: false };
      };

      const renderCalculation = (result) => {
        totalPrice.textContent = currencyFormatter.format(result.total);
        calcErrorContainer.textContent = result.error;
        calcErrorContainer.classList.toggle("hidden", !result.error);

        lapsInput.classList.toggle("border-red-500", result.invalidLaps);
        lapsInput.classList.toggle("focus:ring-red-500", result.invalidLaps);
        lapsInput.classList.toggle("text-red-900", result.invalidLaps);
        lapsInput.classList.toggle("bg-red-50", result.invalidLaps);
        lapsInput.classList.toggle("border-gray-300", !result.invalidLaps);
        lapsInput.classList.toggle("focus:ring-red-600", !result.invalidLaps);
        lapsInput.classList.toggle("text-gray-900", !result.invalidLaps);
        lapsInput.classList.toggle("bg-white", !result.invalidLaps);
        if (result.invalidLaps) {
          lapsInput.setAttribute("aria-invalid", "true");
        } else {
          lapsInput.removeAttribute("aria-invalid");
        }
      };

      let previousInputs;
      const updateTrackCost = () => {
        const inputs = [carSelect.value, lapsInput.value, telemetrySelect.value, videoCheck.checked];
        if (previousInputs && inputs.every((value, inputIndex) => value === previousInputs[inputIndex])) {
          return;
        }
        previousInputs = inputs;

        const result = calculateTrackCost({
          carValue: carSelect.value,
          lapsValue: lapsInput.value,
          telemetryValue: telemetrySelect.value,
          includeVideo: videoCheck.checked
        });
        renderCalculation(result);
      };

      const safelyCalculateTrackCost = () => {
        runOptionalFeature("розрахунок калькулятора", updateTrackCost);
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
