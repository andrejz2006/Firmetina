const resetPageStart = () => {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
};

window.history.scrollRestoration = "manual";
resetPageStart();

window.addEventListener("load", () => {
  resetPageStart();
});

document.addEventListener("DOMContentLoaded", () => {
  resetPageStart();

  const progressBar = document.querySelector(".scroll-progress-bar");
  if (progressBar) {
    let progressUpdateScheduled = false;

    const updateScrollProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
      progressUpdateScheduled = false;
    };

    const scheduleProgressUpdate = () => {
      if (!progressUpdateScheduled) {
        progressUpdateScheduled = true;
        window.requestAnimationFrame(updateScrollProgress);
      }
    };

    window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
    window.addEventListener("resize", scheduleProgressUpdate);
    updateScrollProgress();
  }

  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");
  const themeToggle = document.querySelector(".theme-toggle");
  const topbar = document.querySelector(".topbar");

  if (navToggle && themeToggle && topbar) {
    const mobileViewport = window.matchMedia("(max-width: 640px)");
    let mobileStickyThreshold = 0;

    const setControlsDocked = (shouldDock) => {
      const controls = [navToggle, themeToggle];
      controls.forEach((control) => {
        control.getAnimations().forEach((animation) => animation.cancel());
      });
      const startingBounds = controls.map((control) => control.getBoundingClientRect());
      topbar.classList.toggle("mobile-controls-fixed", shouldDock);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        controls.forEach((control) => {
          control.style.removeProperty("translate");
          control.style.removeProperty("scale");
        });
        return;
      }

      controls.forEach((control, index) => {
        const targetBounds = control.getBoundingClientRect();
        const startBounds = startingBounds[index];
        const scale = startBounds.width / targetBounds.width;
        control.animate(
          [
            {
              transform: `translate(${startBounds.left - targetBounds.left}px, ${startBounds.top - targetBounds.top}px) scale(${scale})`,
              opacity: shouldDock ? 0.82 : 1
            },
            { transform: "translate(0, 0) scale(1)", opacity: 1 }
          ],
          {
            duration: 600,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)"
          }
        );
      });
    };

    const updateMobileControls = () => {
      if (!mobileViewport.matches) {
        if (topbar.classList.contains("mobile-controls-fixed")) {
          setControlsDocked(false);
        }
        return;
      }

      if (!topbar.classList.contains("mobile-controls-fixed")) {
        const navBounds = navToggle.getBoundingClientRect();
        const themeBounds = themeToggle.getBoundingClientRect();
        mobileStickyThreshold = Math.max(0, navBounds.top + window.scrollY - 6);
        topbar.style.setProperty("--mobile-nav-right", `${window.innerWidth - navBounds.right}px`);
        topbar.style.setProperty("--mobile-theme-right", `${window.innerWidth - themeBounds.right}px`);
      }

      const shouldDock = window.scrollY >= mobileStickyThreshold && mobileStickyThreshold > 0;
      if (shouldDock !== topbar.classList.contains("mobile-controls-fixed")) {
        setControlsDocked(shouldDock);
      }
    };

    updateMobileControls();
    window.addEventListener("scroll", updateMobileControls, { passive: true });
    window.addEventListener("resize", updateMobileControls);
    mobileViewport.addEventListener("change", updateMobileControls);
  }

  if (themeToggle) {
    const themes = ["lime", "violet"];
    let activeTheme = 0;

    themeToggle.addEventListener("click", () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      activeTheme = (activeTheme + 1) % themes.length;

      if (!reduceMotion) {
        const buttonBounds = themeToggle.getBoundingClientRect();
        const root = document.documentElement;
        root.style.setProperty("--theme-origin-x", `${buttonBounds.left + buttonBounds.width / 2}px`);
        root.style.setProperty("--theme-origin-y", `${buttonBounds.top + buttonBounds.height / 2}px`);
        root.classList.remove("theme-changing");
        void root.offsetWidth;
        root.classList.add("theme-changing");
      }

      document.documentElement.dataset.theme = themes[activeTheme];
      themeToggle.setAttribute(
        "aria-label",
        `Change color theme (current: ${themes[activeTheme]})`
      );

      if (!reduceMotion) {
        themeToggle.classList.remove("is-animating");
        void themeToggle.offsetWidth;
        themeToggle.classList.add("is-animating");
      }
    });

    document.documentElement.addEventListener("animationend", (event) => {
      if (event.target === document.documentElement && event.animationName === "theme-color-wash") {
        document.documentElement.classList.remove("theme-changing");
      }
    });

    themeToggle.addEventListener("animationend", (event) => {
      if (event.target === themeToggle.querySelector("span")) {
        themeToggle.classList.remove("is-animating");
      }
    });
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      topbar?.classList.toggle("mobile-menu-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        topbar?.classList.remove("mobile-menu-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealTargets = [
    ".topbar",
    ".hero-copy",
    ".hero-visual",
    ".services-header",
    ".service-card",
    ".projects-header",
    ".project-toolbar",
    ".project-card",
    ".about-copy",
    ".about-visual",
    ".testimonial-box",
    ".contact-copy",
    ".contact-form",
    ".page-footer"
  ];

  revealTargets.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.add("reveal-on-scroll");
    });
  });

  const revealElements = document.querySelectorAll(".reveal-on-scroll");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -6% 0px"
      }
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  const testimonialCopy = document.querySelector(".testimonial-copy");
  const testimonialButtons = document.querySelectorAll("[data-testimonial-direction]");

  if (testimonialCopy && testimonialButtons.length) {
    const testimonialQuote = testimonialCopy.querySelector("p");
    const testimonialAuthor = testimonialCopy.querySelector("span");
    const testimonials = [
      {
        quote: "„Одлична услуга, брза изработка и професионален пристап. Препорачувам!“",
        author: "— Марко Петровски"
      },
      {
        quote: "„Презадоволен сум.“",
        author: "— Анонимен клиент"
      },
      {
        quote: "Дечките ми го лепеа излогот на дуќанот пофални зборови имам само.“",
        author: "— Петар Јовановски"
      },
      {
        quote: "„Експедитивна и професионална услуга.“",
        author: "— Теодора Стојановска"
      }
    ];
    let activeTestimonial = 0;
    let changeTimeout;

    testimonialButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const direction = Number(button.dataset.testimonialDirection);
        activeTestimonial = (activeTestimonial + direction + testimonials.length) % testimonials.length;

        window.clearTimeout(changeTimeout);
        testimonialCopy.classList.add("is-changing");
        changeTimeout = window.setTimeout(() => {
          const testimonial = testimonials[activeTestimonial];
          if (testimonialQuote && testimonialAuthor) {
            testimonialQuote.textContent = testimonial.quote;
            testimonialAuthor.textContent = testimonial.author;
          }
          testimonialCopy.classList.remove("is-changing");
        }, prefersReducedMotion ? 0 : 200);
      });
    });
  }

  const filterButtons = document.querySelectorAll(".filter-pill");
  const projectCards = document.querySelectorAll(".project-card");

  const normalizeCategory = (value = "") => value.toLowerCase().replace(/[^a-z]/g, "");

  const getCardCategory = (card) => {
    if (card.dataset.category) {
      return normalizeCategory(card.dataset.category);
    }

    for (const className of card.classList) {
      if (className === "project-card") continue;
      const cleaned = className.replace(/^project-card--?/, "");
      if (cleaned) {
        return normalizeCategory(cleaned);
      }
    }

    return "all";
  };

  const matchesCategory = (cardCategory, filterValue) => {
    const normalizedCard = normalizeCategory(cardCategory);
    const normalizedFilter = normalizeCategory(filterValue);

    if (normalizedFilter === "all") return true;

    return (
      normalizedCard === normalizedFilter ||
      normalizedCard === `${normalizedFilter}s` ||
      normalizedFilter === `${normalizedCard}s`
    );
  };

  const applyProjectFilter = (selectedFilter) => {
    projectCards.forEach((card) => {
      const cardCategory = getCardCategory(card);
      const shouldShow = matchesCategory(cardCategory, selectedFilter);
      card.classList.toggle("is-hidden", !shouldShow);
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((pill) => pill.classList.toggle("active", pill === button));
      applyProjectFilter(button.dataset.filter || "all");
    });
  });

  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    const requiredFields = Array.from(contactForm.querySelectorAll("[required]"));
    const feedback = contactForm.querySelector(".form-feedback");
    const phoneField = contactForm.querySelector('input[name="phone"]');
    const emailField = contactForm.querySelector('input[name="email"]');
    const successMessage = contactForm.querySelector(".contact-success");
    const contactFlight = contactForm.querySelector(".contact-flight");
    const successText = successMessage?.textContent.trim() ?? "";
    let successTimeout;
    let hasSubmitted = false;

    phoneField?.addEventListener("input", () => {
      const cursorPosition = phoneField.selectionStart ?? phoneField.value.length;
      let sanitized = "";
      let nextCursorPosition = 0;

      Array.from(phoneField.value).forEach((character, index) => {
        const isDigit = character >= "0" && character <= "9";
        const isLeadingPlus = character === "+" && sanitized.length === 0;

        if (isDigit || isLeadingPlus) {
          sanitized += character;
          if (index < cursorPosition) nextCursorPosition = sanitized.length;
        }
      });

      if (phoneField.value !== sanitized) {
        phoneField.value = sanitized;
        phoneField.setSelectionRange(nextCursorPosition, nextCursorPosition);
      }
    });

    const getMissingFields = () =>
      requiredFields.filter((field) => !field.value.trim());

    const updateValidationMessage = () => {
      const missingFields = getMissingFields();
      const phoneDigits = phoneField?.value.replace(/\D/g, "") ?? "";
      const invalidPhone =
        phoneDigits.length > 0 && (phoneDigits.length < 7 || phoneDigits.length > 15);
      const invalidEmail = Boolean(
        emailField?.value.trim() && !emailField.validity.valid
      );

      requiredFields.forEach((field) => {
        const isMissing = missingFields.includes(field);
        const isInvalidPhone = field === phoneField && invalidPhone;
        const isInvalidEmail = field === emailField && invalidEmail;
        field.setAttribute(
          "aria-invalid",
          String(hasSubmitted && (isMissing || isInvalidPhone || isInvalidEmail))
        );
      });

      if (feedback && hasSubmitted) {
        const messages = [];
        if (missingFields.length) {
          messages.push(`Ве молиме пополнете: ${missingFields.map((field) => field.dataset.fieldLabel).join(", ")}.`);
        }
        if (invalidPhone) {
          messages.push("Невалиден телефонски број. Проверете дали бројот е точно внесен.");
        }
        if (invalidEmail) {
          messages.push("Внесете валидна е-пошта.");
        }
        feedback.hidden = messages.length === 0;
        feedback.textContent = messages.join(" ");
      }

      return {
        missingFields,
        invalidPhone: Boolean(invalidPhone),
        invalidEmail
      };
    };

    contactForm.addEventListener("submit", (event) => {
      hasSubmitted = true;
      const { missingFields, invalidPhone, invalidEmail } = updateValidationMessage();

      if (missingFields.length || invalidPhone || invalidEmail) {
        event.preventDefault();
        if (missingFields.length) {
          missingFields[0].focus();
        } else if (invalidEmail) {
          emailField?.focus();
        } else {
          phoneField?.focus();
        }
      } else {
        event.preventDefault();
        if (contactForm.classList.contains("is-sending")) return;
        window.clearTimeout(successTimeout);
        contactForm.classList.remove("is-sent");
        if (successMessage) {
          successMessage.style.removeProperty("font-size");
          successMessage.replaceChildren(
            ...Array.from(successText, (character) => {
              const letter = document.createElement("span");
              letter.className = "contact-success-letter";
              letter.setAttribute("aria-hidden", "true");
              letter.textContent = character;
              return letter;
            })
          );
          const letters = Array.from(successMessage.querySelectorAll(".contact-success-letter"));
          const messageStyle = window.getComputedStyle(successMessage);
          const horizontalPadding =
            Number.parseFloat(messageStyle.paddingLeft) + Number.parseFloat(messageStyle.paddingRight);
          const availableWidth = successMessage.clientWidth - horizontalPadding;
          const textWidth = letters.reduce(
            (width, letter) => width + letter.getBoundingClientRect().width,
            0
          );
          if (textWidth > availableWidth) {
            const currentFontSize = Number.parseFloat(messageStyle.fontSize);
            successMessage.style.fontSize = `${currentFontSize * (availableWidth / textWidth) * 0.98}px`;
          }

          const formBounds = contactForm.getBoundingClientRect();
          const planeWidth = contactFlight?.getBoundingClientRect().width ?? 0;
          const letterBounds = letters.map((letter) => letter.getBoundingClientRect());
          const lastLetterCenter =
            Math.max(...letterBounds.map((bounds) => bounds.right)) - formBounds.left;
          const planeStartCenter = planeWidth / 2;
          const flightDistance = Math.max(0, lastLetterCenter - planeStartCenter);
          contactFlight?.style.setProperty("--flight-distance", `${flightDistance}px`);

          letters.forEach((letter, index) => {
            const bounds = letterBounds[index];
            const center = (bounds.left + bounds.right) / 2 - formBounds.left;
            const progress =
              flightDistance > 0
                ? Math.max(0, Math.min(1, (center - planeStartCenter) / flightDistance))
                : 0;
            letter.style.setProperty("--typing-delay", `${400 + progress * 2750}ms`);
          });
          successMessage.setAttribute("aria-label", successText);
          successMessage.classList.add("is-typing");
          successMessage.setAttribute("aria-live", "off");
        }
        contactForm.classList.remove("is-sending");
        void contactForm.offsetWidth;
        contactForm.classList.add("is-sending");
      }
    });

    contactForm.addEventListener("animationend", (event) => {
      if (
        event.target === contactForm &&
        event.animationName === "form-flight-wash"
      ) {
        contactForm.classList.remove("is-sending");
        contactForm.classList.add("is-sent");
        successMessage?.setAttribute("aria-live", "polite");
        window.clearTimeout(successTimeout);
        successTimeout = window.setTimeout(() => {
          contactForm.reset();
          contactForm.classList.remove("is-sent", "is-sending");
          hasSubmitted = false;
          requiredFields.forEach((field) => field.setAttribute("aria-invalid", "false"));
          if (feedback) {
            feedback.hidden = true;
            feedback.textContent = "";
          }
          successMessage?.classList.remove("is-typing");
          if (successMessage) {
            successMessage.replaceChildren(document.createTextNode(successText));
            successMessage.removeAttribute("aria-label");
            successMessage.setAttribute("aria-live", "polite");
          }
        }, 5000);
      }
    });

    requiredFields.forEach((field) => {
      field.addEventListener("input", updateValidationMessage);
      field.addEventListener("change", updateValidationMessage);
    });
  }

  const scrollTopButton = document.querySelector(".scroll-to-top");
  if (scrollTopButton) {
    scrollTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
