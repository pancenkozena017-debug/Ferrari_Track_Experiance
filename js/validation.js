'use strict';

(() => {
  const form =
    document.getElementById('contactForm') ??
    document.getElementById('booking-form');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (!form || !successModal || !closeModalBtn) {
    return;
  }

  const requiredFields = Array.from(
    form.querySelectorAll('input[required], select[required], textarea[required]'),
  );
  let returnFocusTo = null;

  form.noValidate = true;

  function setFieldValidity(field) {
    const isValid = field.checkValidity();
    field.classList.toggle('border-red-500', !isValid);
    field.setAttribute('aria-invalid', String(!isValid));
    return isValid;
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

  requiredFields.forEach((field) => {
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const invalidFields = requiredFields.filter(
      (field) => !setFieldValidity(field),
    );

    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      return;
    }

    form.reset();
    requiredFields.forEach((field) => {
      field.classList.remove('border-red-500');
      field.removeAttribute('aria-invalid');
    });
    openModal();
  });

  closeModalBtn.addEventListener('click', closeModal);

  successModal.addEventListener('click', (event) => {
    if (event.target === successModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!successModal.classList.contains('hidden') && event.key === 'Escape') {
      closeModal();
    }
  });
})();
