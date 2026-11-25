(() => {
  "use strict";

  const STORAGE_KEY = "ferrariTrackExperience";
  const DRAFT_KEY = "ferrariTrackBookingDraft";
  const OWNER_EMAIL = "pancenkozena017@gmail.com";
  const ENDPOINT_URL = "https://api.web3forms.com/submit";
  const ACCESS_KEY = "b2cfbab0-59c6-4591-9023-7617eccff55a";
  const SUCCESS_MESSAGE = "Заявку успішно надіслано менеджеру! Деталі збережено у вашому кабінеті.";
  const bookingRates = {
    "testa-rossa": 1200,
    "488-pista": 700,
    laferrari: 1100,
    "499p": 1500
  };
  const carNames = {
    "testa-rossa": "Ferrari 250 Testa Rossa",
    "488-pista": "Ferrari 488 Pista",
    laferrari: "Ferrari LaFerrari",
    "499p": "Ferrari 499P"
  };
  const trackNames = {
    monza: "Monza Circuit",
    spa: "Spa-Francorchamps",
    nurburgring: "Nürburgring Nordschleife"
  };
  const elements = {
    authDialog: document.querySelector("#auth-dialog"),
    dashboardDialog: document.querySelector("#dashboard-dialog"),
    openButton: document.querySelector("#auth-open-button"),
    userControls: document.querySelector("#auth-user-controls"),
    userName: document.querySelector("#auth-user-name"),
    notice: document.querySelector("#auth-notice"),
    feedback: document.querySelector("#auth-feedback"),
    toast: document.querySelector("#auth-toast")
  };

  if (!elements.authDialog || !elements.dashboardDialog || !elements.openButton ||
      !elements.userControls || !elements.userName || !elements.notice ||
      !elements.feedback || !elements.toast) {
    return;
  }

  let state = { users: [], currentUserId: null };
  let storageError = "";
  let toastTimer;
  const activeSubmissions = new WeakSet();

  const getField = (form, name) => form.elements.namedItem(name);
  const getCurrentUser = () => state.users.find((user) => user.id === state.currentUserId) || null;

  const readState = () => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { users: [], currentUserId: null };

    const parsed = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed.users) ||
        !(parsed.currentUserId === null || typeof parsed.currentUserId === "string")) {
      throw new Error("Збережені дані акаунта мають некоректний формат.");
    }
    if (parsed.users.some((user) => !user || typeof user.id !== "string" ||
        typeof user.name !== "string" || typeof user.email !== "string" ||
        typeof user.salt !== "string" || typeof user.passwordHash !== "string")) {
      throw new Error("Профіль користувача має некоректний формат.");
    }

    return parsed;
  };

  const saveState = (nextState) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    state = nextState;
    renderUserControls();
  };

  const setFeedback = (message) => {
    elements.feedback.textContent = message;
  };

  const setNotice = (message) => {
    elements.notice.textContent = message;
    elements.notice.hidden = !message;
  };

  const showToast = (message) => {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
      elements.toast.textContent = "";
    }, 6000);
  };

  const renderUserControls = () => {
    const user = getCurrentUser();
    elements.openButton.hidden = Boolean(user);
    elements.userControls.hidden = !user;
    elements.userName.textContent = user ? user.name : "";
  };

  const openAuth = (message) => {
    setFeedback(storageError);
    setNotice(message || "");
    if (!elements.authDialog.open) elements.authDialog.showModal();
  };

  const setAuthTab = (name) => {
    document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      const selected = tab.dataset.authTab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll("[data-auth-form]").forEach((form) => {
      form.hidden = form.dataset.authForm !== name;
    });
    setFeedback("");
  };

  const passwordDigest = async (password, salt) => {
    if (!window.crypto || !window.crypto.subtle || typeof TextEncoder !== "function") {
      throw new Error("Захищене збереження пароля недоступне в цьому браузері. Відкрийте сайт через HTTPS або localhost.");
    }

    const passwordBytes = new TextEncoder().encode(password);
    const saltBytes = new TextEncoder().encode(salt);
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const digest = await window.crypto.subtle.deriveBits({
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations: 120000
    }, keyMaterial, 256);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const createSalt = () => {
    if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
      throw new Error("Генератор захищених випадкових значень недоступний у цьому браузері.");
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const validateAuthForm = (form, mode) => {
    const fields = Array.from(form.querySelectorAll("input"));
    fields.forEach((field) => {
      field.setCustomValidity("");
      field.removeAttribute("aria-invalid");
    });

    const name = getField(form, "name");
    const email = getField(form, "email");
    const password = getField(form, "password");
    const normalizedEmail = email.value.trim().toLowerCase();

    if (mode === "register" && name.value.trim().length < 2) {
      name.setCustomValidity("Введіть ім’я щонайменше з двох символів.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      email.setCustomValidity("Введіть коректну адресу електронної пошти.");
    }
    if (password.value.length < 6) {
      password.setCustomValidity("Пароль має містити щонайменше 6 символів.");
    }

    const valid = form.reportValidity();
    if (!valid) {
      const invalid = form.querySelector(":invalid");
      if (invalid) {
        setFeedback(invalid.validationMessage);
        invalid.setAttribute("aria-invalid", "true");
        invalid.focus();
      }
    }

    return valid ? { name, email: normalizedEmail, password } : null;
  };

  const getCalculatorSelection = () => {
    const calculator = document.querySelector("[data-auth-calculator]");
    if (!calculator) {
      return { laps: 5, telemetry: 0, video: false };
    }

    const laps = Number(getField(calculator, "laps").value);
    const telemetry = Number(getField(calculator, "telemetry").value);
    const video = getField(calculator, "video").checked;
    return { laps, telemetry, video };
  };

  const getPrice = (car, laps, telemetry, video) => {
    const rate = bookingRates[car];
    if (!rate || !Number.isInteger(laps) || laps < 1 || laps > 50 ||
        ![0, 250, 500].includes(telemetry)) {
      throw new Error("Перевірте модель автомобіля, кількість кіл і пакет телеметрії.");
    }
    return rate * laps + telemetry + (video ? 150 : 0);
  };

  const sendBookingEmail = async (user, booking) => {
    if (!ACCESS_KEY || ACCESS_KEY === "PASTE_WEB3FORMS_ACCESS_KEY_HERE") {
      throw new Error("Email-відправлення не налаштоване: додайте Web3Forms access key у js/auth.js.");
    }

    const coachNames = {
      solo: "Без інструктора",
      marco: "Marko Trevisan — персональний коуч",
      matteo: "Matteo Rossi — гоночний інженер",
      luca: "Luca Benetti — інструктор із пілотування"
    };
    const telemetryNames = {
      0: "Basic Telemetry",
      250: "Pro Telemetry + Coach",
      500: "VIP Telemetry Lab"
    };
    const additionalOptions = [
      `Супровід: ${coachNames[booking.coach] || "Без інструктора"}`,
      `Телеметрія: ${telemetryNames[booking.telemetry]}`,
      booking.video ? "4K відеозапис з Overlay телеметрії" : "Без відеозапису"
    ];
    const formattedPrice = `$${booking.total.toLocaleString("en-US")}`;
    const submittedAt = new Date().toLocaleString("uk-UA");
    const customerPhone = typeof user.phone === "string" ? user.phone.trim() : "";
    const message = [
      `Клієнт: ${user.name}`,
      `Email: ${user.email}`,
      ...(customerPhone ? [`Телефон: ${customerPhone}`] : []),
      `Автомобіль: ${carNames[booking.car]}`,
      `Траса: ${trackNames[booking.track]}`,
      `Дата трек-дня: ${booking.date}`,
      `Кількість кіл: ${booking.laps}`,
      `Додаткові опції: ${additionalOptions.join("; ")}`,
      `Підсумкова вартість: ${formattedPrice}`,
      `Дата й час оформлення: ${submittedAt}`
    ].join("\n");
    const payload = {
      access_key: ACCESS_KEY,
      subject: `Нова заявка на Ferrari Track Day — ${user.name}`,
      from_name: "Ferrari Track Experience",
      email: user.email,
      replyto: user.email,
      owner_email: OWNER_EMAIL,
      customer_name: user.name,
      ...(customerPhone ? { customer_phone: customerPhone } : {}),
      car: carNames[booking.car],
      track: trackNames[booking.track],
      laps: booking.laps,
      additional_options: additionalOptions.join("; "),
      total_price: formattedPrice,
      track_day_date: booking.date,
      submitted_at: submittedAt,
      message
    };

    let response;
    try {
      response = await window.fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error("Не вдалося надіслати заявку через помилку мережі. Перевірте з’єднання та спробуйте ще раз.");
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Email-сервіс повернув некоректну відповідь. Спробуйте надіслати заявку ще раз.");
    }

    if (!response.ok || !result || String(result.success).toLowerCase() !== "true") {
      throw new Error(result && typeof result.message === "string"
        ? result.message
        : `Email-сервіс не прийняв заявку (HTTP ${response.status}).`);
    }
  };

  const buildFormBooking = (form) => {
    const calculator = getCalculatorSelection();
    const car = getField(form, "car").value;
    const track = getField(form, "track").value;
    const date = getField(form, "date").value;
    const coach = getField(form, "coach");
    const name = getField(form, "name");
    const email = getField(form, "email");
    const consent = getField(form, "consent");
    if (!carNames[car] || !trackNames[track] || !date) {
      throw new Error("Перевірте дані бронювання.");
    }

    return {
      car,
      track,
      date,
      laps: calculator.laps,
      telemetry: calculator.telemetry,
      video: calculator.video,
      coach: coach ? coach.value : "solo",
      contactName: name.value.trim(),
      contactEmail: email.value.trim(),
      consent: consent.checked,
      total: getPrice(car, calculator.laps, calculator.telemetry, calculator.video)
    };
  };

  const buildCalculatorBooking = (form) => {
    const carRate = Number(getField(form, "car").value);
    const car = Object.keys(bookingRates).find((key) => bookingRates[key] === carRate);
    const track = getField(form, "track").value;
    const date = getField(form, "date").value;
    const laps = Number(getField(form, "laps").value);
    const telemetry = Number(getField(form, "telemetry").value);
    const video = getField(form, "video").checked;

    if (!car || !trackNames[track] || !date) {
      throw new Error("Оберіть автомобіль, трасу, дату та перевірте кількість кіл.");
    }

    return {
      car,
      track,
      date,
      laps,
      telemetry,
      video,
      coach: "solo",
      consent: getField(form, "consent").checked,
      total: getPrice(car, laps, telemetry, video)
    };
  };

  const normalizeDraft = (draft) => {
    if (!draft || !carNames[draft.car] || !trackNames[draft.track] ||
        typeof draft.date !== "string" || !draft.date ||
        typeof draft.laps !== "number" || !Number.isInteger(draft.laps) ||
        draft.laps < 1 || draft.laps > 50 ||
        ![0, 250, 500].includes(draft.telemetry) ||
        typeof draft.video !== "boolean") {
      throw new Error("Чернетка бронювання пошкоджена. Створіть заявку ще раз.");
    }

    return {
      car: draft.car,
      track: draft.track,
      date: draft.date,
      laps: draft.laps,
      telemetry: draft.telemetry,
      video: draft.video,
      coach: typeof draft.coach === "string" ? draft.coach : "solo",
      contactName: typeof draft.contactName === "string" ? draft.contactName : "",
      contactEmail: typeof draft.contactEmail === "string" ? draft.contactEmail : "",
      consent: draft.consent === true,
      total: getPrice(draft.car, draft.laps, draft.telemetry, draft.video)
    };
  };

  const persistBooking = (booking) => {
    const user = getCurrentUser();
    if (!user) throw new Error("Для збереження бронювання потрібно увійти в акаунт.");

    const savedBooking = {
      ...normalizeDraft(booking),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      status: "Підтверджено"
    };
    const nextState = {
      ...state,
      users: state.users.map((item) => item.id === user.id
        ? { ...item, orders: [...(Array.isArray(item.orders) ? item.orders : []), savedBooking] }
        : item)
    };
    saveState(nextState);
    return savedBooking;
  };

  const getBookingFeedback = (source) => source === "calculator"
    ? document.querySelector("[data-calculator-feedback]")
    : document.querySelector("#booking-feedback");

  const submitAndSaveBooking = async (booking, form, source, clearDraft) => {
    if (form && activeSubmissions.has(form)) return false;
    if (form) activeSubmissions.add(form);

    const submitButton = form
      ? form.querySelector('button[type="submit"]')
      : null;
    const originalButtonContent = submitButton ? submitButton.innerHTML : "";
    const wasDisabled = submitButton ? submitButton.disabled : false;
    const feedback = getBookingFeedback(source);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.textContent = "Надсилання заявки...";
    }
    if (feedback) feedback.textContent = "";

    try {
      const user = getCurrentUser();
      if (!user) throw new Error("Увійдіть у профіль перед надсиланням заявки.");

      await sendBookingEmail(user, booking);
      persistBooking(booking);
      if (clearDraft) window.sessionStorage.removeItem(DRAFT_KEY);
      if (form && form.matches("[data-auth-booking]")) form.reset();

      if (feedback) feedback.textContent = SUCCESS_MESSAGE;
      showToast(SUCCESS_MESSAGE);
      return true;
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Не вдалося надіслати заявку. Спробуйте ще раз.";
      if (feedback) feedback.textContent = message;
      showToast(message);
      return false;
    } finally {
      if (submitButton) {
        submitButton.disabled = wasDisabled;
        submitButton.removeAttribute("aria-busy");
        submitButton.innerHTML = originalButtonContent;
      }
      if (form) activeSubmissions.delete(form);
    }
  };

  const completePendingBooking = async () => {
    let savedDraft;
    try {
      savedDraft = window.sessionStorage.getItem(DRAFT_KEY);
      if (!savedDraft) return false;
      const pending = JSON.parse(savedDraft);
      const booking = normalizeDraft(pending.booking || pending);
      const source = pending.source === "calculator" ? "calculator" : "booking";
      const form = document.querySelector(source === "calculator"
        ? "[data-auth-calculator]"
        : "[data-auth-booking]");
      return await submitAndSaveBooking(booking, form, source, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не вдалося оформити бронювання.";
      const feedback = document.querySelector("#booking-feedback") ||
        document.querySelector("[data-calculator-feedback]");
      if (feedback) feedback.textContent = message;
      showToast(message);
      return false;
    }
  };

  const renderDashboard = () => {
    const user = getCurrentUser();
    if (!user) return;

    const name = elements.dashboardDialog.querySelector("[data-profile-name]");
    const email = elements.dashboardDialog.querySelector("[data-profile-email]");
    const orderList = elements.dashboardDialog.querySelector("[data-order-list]");
    const emptyOrders = elements.dashboardDialog.querySelector("[data-empty-orders]");
    if (!name || !email || !orderList || !emptyOrders) return;

    name.textContent = user.name;
    email.textContent = user.email;
    orderList.replaceChildren();

    const orders = Array.isArray(user.orders) ? user.orders.slice().reverse() : [];
    emptyOrders.hidden = orders.length > 0;
    orders.forEach((order) => {
      const item = document.createElement("li");
      const heading = document.createElement("h4");
      const details = document.createElement("p");
      const date = document.createElement("p");
      const status = document.createElement("span");
      heading.textContent = `${carNames[order.car] || "Ferrari"} — ${trackNames[order.track] || "Траса"}`;
      details.textContent = `${order.laps} кіл · $${Number(order.total).toLocaleString("en-US")} · ${order.date}`;
      date.textContent = `Оформлено: ${new Date(order.createdAt).toLocaleString("uk-UA")}`;
      status.className = "auth-order-status";
      status.textContent = order.status || "Підтверджено";
      item.append(heading, details, date, status);
      orderList.append(item);
    });
  };

  const setBookingContact = () => {
    const user = getCurrentUser();
    const name = document.querySelector("#booking-name");
    const email = document.querySelector("#booking-email");
    if (user && name && !name.value) name.value = user.name;
    if (user && email && !email.value) email.value = user.email;
  };

  const handleAuthSubmit = async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-auth-form]")) return;
    event.preventDefault();
    setFeedback("");

    const mode = form.dataset.authForm;
    const values = validateAuthForm(form, mode);
    if (!values) return;
    if (storageError) {
      setFeedback(storageError);
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      const users = state.users.slice();
      const existing = users.find((user) => user.email === values.email);

      if (mode === "register") {
        if (existing) throw new Error("Ця електронна пошта вже зареєстрована. Увійдіть до акаунта.");
        const salt = createSalt();
        const user = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          name: values.name.value.trim(),
          email: values.email,
          phone: getField(form, "phone").value.trim(),
          salt,
          passwordHash: await passwordDigest(values.password.value, salt),
          orders: []
        };
        users.push(user);
        saveState({ users, currentUserId: user.id });
      } else {
        if (!existing) throw new Error("Акаунт із такою адресою не знайдено. Перевірте дані або зареєструйтеся.");
        const digest = await passwordDigest(values.password.value, existing.salt);
        if (digest !== existing.passwordHash) throw new Error("Неправильний email або пароль.");
        saveState({ ...state, currentUserId: existing.id });
      }

      setBookingContact();
      elements.authDialog.close();
      setFeedback("");
      await completePendingBooking();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Не вдалося виконати операцію.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  };

  const handleBookingSubmit = async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) ||
        !form.matches("[data-auth-booking], [data-auth-calculator]")) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (activeSubmissions.has(form)) return;
    if (!form.reportValidity()) return;

    const isCalculator = form.matches("[data-auth-calculator]");
    const source = isCalculator ? "calculator" : "booking";
    try {
      const booking = isCalculator ? buildCalculatorBooking(form) : buildFormBooking(form);
      if (!getCurrentUser()) {
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ booking, source }));
        openAuth("Для завершення бронювання увійдіть або створіть персональний акаунт");
        setAuthTab("login");
        return;
      }

      await submitAndSaveBooking(booking, form, source, false);
    } catch (error) {
      const feedback = getBookingFeedback(source);
      if (feedback) feedback.textContent = error instanceof Error ? error.message : "Не вдалося оформити бронювання.";
    }
  };

  try {
    state = readState();
    if (!getCurrentUser()) state.currentUserId = null;
  } catch (error) {
    storageError = error instanceof Error
      ? `Не вдалося прочитати локальні дані акаунта: ${error.message}`
      : "Не вдалося прочитати локальні дані акаунта.";
  }

  renderUserControls();
  setAuthTab("login");
  setBookingContact();

  const openButton = elements.openButton;
  openButton.addEventListener("click", () => openAuth(""));
  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setAuthTab(tab.dataset.authTab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const next = tab.dataset.authTab === "login" ? "register" : "login";
      setAuthTab(next);
      const nextTab = document.querySelector(`[data-auth-tab="${next}"]`);
      if (nextTab) nextTab.focus();
    });
  });

  document.addEventListener("submit", (event) => {
    if (event.target instanceof HTMLFormElement && event.target.matches("[data-auth-form]")) {
      void handleAuthSubmit(event);
      return;
    }
    void handleBookingSubmit(event);
  }, true);

  document.querySelectorAll("[data-auth-form] input").forEach((field) => {
    field.addEventListener("input", () => {
      field.setCustomValidity("");
      field.removeAttribute("aria-invalid");
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  [elements.authDialog, elements.dashboardDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      }
    });
  });

  document.querySelectorAll("[data-open-dashboard]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuth("");
        return;
      }
      renderDashboard();
      elements.dashboardDialog.showModal();
    });
  });

  document.querySelectorAll("[data-sign-out]").forEach((button) => {
    button.addEventListener("click", () => {
      try {
        saveState({ ...state, currentUserId: null });
        elements.dashboardDialog.close();
        showToast("Ви вийшли з акаунта.");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Не вдалося вийти з акаунта.");
      }
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      state = readState();
      renderUserControls();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не вдалося оновити стан акаунта.");
    }
  });
})();
