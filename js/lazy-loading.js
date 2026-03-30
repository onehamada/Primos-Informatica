// === LAZY LOADING NATIVO E ESTAVEL ===

const lazyLoadingConfig = {
  root: null,
  rootMargin: '120px 0px',
  threshold: 0.01
};

let imageObserver;

function markImageAsLoaded(img) {
  if (!img) {
    return;
  }

  img.classList.remove('loading');
  img.classList.add('loaded');
}

function markImageAsError(img) {
  if (!img) {
    return;
  }

  img.classList.remove('loading');
  img.classList.add('error');
}

function loadImage(img) {
  if (!img || img.classList.contains('loaded') || img.classList.contains('loading')) {
    return;
  }

  const nextSrc = img.dataset && img.dataset.src ? img.dataset.src : img.getAttribute('src');
  if (!nextSrc) {
    return;
  }

  img.classList.add('loading');

  img.onload = function() {
    markImageAsLoaded(img);
  };

  img.onerror = function() {
    if (img.src && img.src.includes('.webp')) {
      img.src = img.src.replace(/\.webp(\?.*)?$/i, '.jpg$1');
      return;
    }

    img.src = 'images/products/thumbnail/placeholder.webp';
    markImageAsError(img);
  };

  if (img.dataset && img.dataset.src) {
    img.src = nextSrc;
    img.removeAttribute('data-src');
  }

  // Cache hit: garante que a imagem não fique invisivel se o onload vier antes do handler.
  if (img.complete && img.naturalWidth > 0) {
    markImageAsLoaded(img);
  }
}

function initLegacyLazyLoading() {
  function checkImages() {
    const images = document.querySelectorAll('img[data-src]:not(.loaded):not(.loading)');

    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const isNearViewport = rect.top <= window.innerHeight + 120 && rect.bottom >= -120;

      if (isNearViewport) {
        loadImage(img);
      }
    });
  }

  let ticking = false;
  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        checkImages();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  setTimeout(checkImages, 80);
}

function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        }

        loadImage(entry.target);
        observer.unobserve(entry.target);
      });
    }, lazyLoadingConfig);
  } else {
    initLegacyLazyLoading();
  }
}

function observeImages(container = document) {
  const lazyDataImages = container.querySelectorAll('img[data-src]:not(.loaded):not(.loading)');
  const nativeLazyImages = container.querySelectorAll('img[loading="lazy"]:not([data-src]):not(.loaded)');

  nativeLazyImages.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      markImageAsLoaded(img);
      return;
    }

    img.addEventListener('load', () => markImageAsLoaded(img), { once: true });
  });

  lazyDataImages.forEach(img => {
    if (imageObserver) {
      imageObserver.observe(img);
      return;
    }

    const rect = img.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 120) {
      loadImage(img);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLazyLoading();

  setTimeout(() => {
    observeImages();
  }, 80);
});

window.lazyLoading = {
  init: initLazyLoading,
  observe: observeImages,
  loadImage
};
