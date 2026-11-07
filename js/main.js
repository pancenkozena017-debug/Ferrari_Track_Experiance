document.addEventListener("DOMContentLoaded", () => {
  new Typed("#typed-text", {
    strings: ["потужність Ferrari", "адреналін треку", "точність телеметрії"],
    typeSpeed: 60,
    backSpeed: 35,
    backDelay: 1400,
    loop: true
  });

  Fancybox.bind("[data-fancybox='ferrari-gallery']", {});

  new Swiper(".pilot-reviews-swiper", {
    loop: true,
    spaceBetween: 24,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
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
