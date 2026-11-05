'use strict';

(() => {
  const form =
    document.getElementById('contactForm') ??
    document.getElementById('booking-form');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const successModalMessage = document.getElementById('successModalMessage');

  if (!form || !successModal || !closeModalBtn || !successModalMessage) {
    console.error('Форма або елементи модального вікна не знайдені.');
    return;
  }

  const namePattern = /^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'-]{2,50}$/;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phonePattern = /^\+?[0-9\s\(\)\-]{10,20}$/;
  const fields = Array.from(form.querySelectorAll('input, select, textarea'));
  let returnFocusTo = null;

  form.noValidate = true;
  successModalMessage.textContent =
    'Форма успішно пройшла клієнтську валідацію. Демонстрація успішного надсилання';

  function getErrorMessage(field) {
    if (field.name === 'phone' || field.type === 'tel') {
      return 'Введіть коректний номер телефону';
    }

    switch (field.name) {
      case 'name':
        return 'Введіть коректне ім’я';
      case 'email':
        return 'Введіть коректну електронну пошту';
      case 'track':
        return 'Оберіть трасу';
      case 'date':
        return 'Оберіть бажану дату';
      case 'consent':
        return 'Потрібно надати згоду на обробку даних';
      default:
        return 'Заповніть це поле';
    }
  }

  function isFieldValid(field) {
    const value = field.value;

    if (field.name === 'name') {
      return namePattern.test(value);
    }

    if (field.name === 'email') {
      return emailPattern.test(value);
    }

    if (field.name === 'phone' || field.type === 'tel') {
      return (!value.trim() && !field.required) || phonePattern.test(value);
    }

    if (field instanceof HTMLTextAreaElement) {
      return value.trim().length > 0;
    }

    if (
      field instanceof HTMLInputElement &&
      ['text', 'search', 'url'].includes(field.type) &&
      field.required
    ) {
      return value.trim().length > 0 && field.checkValidity();
    }

    return !field.required || field.checkValidity();
  }

  function getErrorElement(field) {
    const errorId = `${field.id || field.name}-error`;
    let error = document.getElementById(errorId);

    if (!error) {
      error = document.createElement('p');
      error.id = errorId;
      error.className = 'error-msg mt-1 text-xs text-red-500';
      error.setAttribute('role', 'alert');
      field.insertAdjacentElement('afterend', error);
    }

    return error;
  }

  function setFieldValidity(field) {
    const valid = isFieldValid(field);
    const errorId = `${field.id || field.name}-error`;
    const error = document.getElementById(errorId);

    field.classList.toggle('border-red-500', !valid);
    field.classList.toggle('focus:ring-red-500', !valid);
    field.setAttribute('aria-invalid', String(!valid));

    if (valid) {
      error?.remove();
      const describedBy = (field.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== errorId);

      if (describedBy.length > 0) {
        field.setAttribute('aria-describedby', describedBy.join(' '));
      } else {
        field.removeAttribute('aria-describedby');
      }

      return true;
    }

    const errorElement = getErrorElement(field);
    errorElement.textContent = getErrorMessage(field);
    const describedBy = new Set(
      (field.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(Boolean),
    );
    describedBy.add(errorId);
    field.setAttribute('aria-describedby', Array.from(describedBy).join(' '));

    return false;
  }

  function clearFieldError(field) {
    field.classList.remove('border-red-500', 'focus:ring-red-500');
    field.removeAttribute('aria-invalid');

    const errorId = `${field.id || field.name}-error`;
    document.getElementById(errorId)?.remove();
    const describedBy = (field.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => id && id !== errorId);

    if (describedBy.length > 0) {
      field.setAttribute('aria-describedby', describedBy.join(' '));
    } else {
      field.removeAttribute('aria-describedby');
    }
  }

  function openModal() {
    returnFocusTo = document.activeElement;
    successModal.classList.remove('hidden');
    successModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    closeModalBtn.focus();
  }

  function closeModal() {
    successModal.classList.add('hidden');
    successModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');

    if (returnFocusTo instanceof HTMLElement && returnFocusTo.isConnected) {
      returnFocusTo.focus();
    }

    returnFocusTo = null;
  }

  fields.forEach((field) => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        setFieldValidity(field);
      }
    });

    field.addEventListener('change', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        setFieldValidity(field);
      }
    });
  });

  form.addEventListener('reset', () => {
    fields.forEach(clearFieldError);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const validatedFields = fields.filter(
      (field) =>
        field.required ||
        field.name === 'name' ||
        field.name === 'email' ||
        field.name === 'phone' ||
        field.type === 'tel' ||
        field instanceof HTMLTextAreaElement,
    );
    const invalidFields = validatedFields.filter(
      (field) => !setFieldValidity(field),
    );

    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      return;
    }

    form.reset();
    openModal();
  });

  closeModalBtn.addEventListener('click', closeModal);

  successModal.addEventListener('click', (event) => {
    if (event.target === successModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (successModal.classList.contains('hidden')) {
      return;
    }

    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      closeModalBtn.focus();
    }
  });
})();
