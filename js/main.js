/**
 * SLY BARBERSHOP - JavaScript Principal
 * Funcionalidades interactivas del sitio web
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos los módulos
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initBookingForm();
    initReviewsSlider();
    initGalleryLightbox();
    initBackToTop();
    initScrollAnimations();
    initDatePicker();
});

/**
 * NAVBAR - Scroll effect
 */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const scrollThreshold = 100;

    function updateNavbar() {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', throttle(updateNavbar, 100));
    updateNavbar();
}

/**
 * MENÚ MÓVIL
 */
function initMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu.querySelectorAll('.nav-link');

    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Cerrar menú al hacer click en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target) && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * SCROLL SUAVE
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * FORMULARIO DE RESERVA
 */
function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    const serviceSelect = document.getElementById('bookingService');
    const barberSelect  = document.getElementById('bookingBarber');
    const dateInput     = document.getElementById('bookingDate');
    const timeSelect    = document.getElementById('bookingTime');
    const submitBtn     = document.getElementById('bookingSubmitBtn');
    const feedback      = document.getElementById('bookingFeedback');

    // Fecha mínima = hoy
    dateInput.min = new Date().toISOString().split('T')[0];

    // Cargar servicios y barberos desde la API
    async function loadFormData() {
        try {
            const [resServices, resBarbers] = await Promise.all([
                fetch(`${API_URL}/services/`),
                fetch(`${API_URL}/barbers/`)
            ]);
            const services = await resServices.json();
            const barbers  = await resBarbers.json();

            serviceSelect.innerHTML = '<option value="">Select a service</option>';
            services.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `${s.name} - €${parseFloat(s.price).toFixed(0)} (${s.duration} min)`;
                serviceSelect.appendChild(opt);
            });

            barberSelect.innerHTML = '<option value="">Select a barber</option>';
            barbers.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.name;
                barberSelect.appendChild(opt);
            });
        } catch (err) {
            serviceSelect.innerHTML = '<option value="">Error loading services</option>';
            barberSelect.innerHTML  = '<option value="">Error loading barbers</option>';
        }
    }

    // Slots de 09:00 a 19:00 cada 30 minutos
    const ALL_SLOTS = [];
    (function() {
        let h = 9, m = 0;
        while (h < 19 || (h === 19 && m === 0)) {
            ALL_SLOTS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
            m += 30;
            if (m >= 60) { m = 0; h++; }
        }
    })();

    function populateSlots(availableSet) {
        const prev = timeSelect.value;
        timeSelect.innerHTML = '<option value="">Select time</option>';

        if (availableSet !== null && availableSet.size === 0) {
            timeSelect.innerHTML = '<option value="">No slots available for this day</option>';
            timeSelect.disabled = true;
            return;
        }

        ALL_SLOTS.forEach(s => {
            if (availableSet !== null && !availableSet.has(s)) return; // omitir ocupados
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            timeSelect.appendChild(opt);
        });
        timeSelect.disabled = false;
        if (prev && (availableSet === null || availableSet.has(prev))) timeSelect.value = prev;
    }

    // Mostrar todos los horarios al cargar (sin restricciones aún)
    populateSlots(null);

    // Cargar horarios disponibles (solo muestra los libres)
    async function loadSlots() {
        const barberId = barberSelect.value;
        const date     = dateInput.value;

        if (!barberId || !date) {
            populateSlots(null);
            return;
        }

        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Checking availability...</option>';

        try {
            const res = await fetch(`${API_URL}/appointments/available-slots?barberId=${barberId}&appointmentDate=${date}`);
            const data = await res.json();
            populateSlots(new Set(data.availableSlots || []));
        } catch (err) {
            populateSlots(null);
        }
    }

    barberSelect.addEventListener('change', loadSlots);
    dateInput.addEventListener('change', loadSlots);

    function showFeedback(msg, success) {
        feedback.textContent = msg;
        feedback.style.display = 'block';
        feedback.style.background = success ? '#d4edda' : '#f8d7da';
        feedback.style.color = success ? '#155724' : '#721c24';
        feedback.style.border = `1px solid ${success ? '#c3e6cb' : '#f5c6cb'}`;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name     = document.getElementById('bookingName').value.trim();
        const phone    = document.getElementById('bookingPhone').value.trim();
        const barberId = parseInt(barberSelect.value);
        const serviceId = parseInt(serviceSelect.value);
        const date     = dateInput.value;
        const time     = timeSelect.value;
        const notes    = document.getElementById('bookingNotes').value.trim();

        if (!name || !phone || !barberId || !serviceId || !date || !time) {
            showFeedback('Please fill in all required fields.', false);
            return;
        }

        const appointmentDatetime = `${date}T${time}:00`;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
        feedback.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/appointments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: name,
                    client_phone: phone,
                    barber_id: barberId,
                    service_id: serviceId,
                    appointment_date: appointmentDatetime,
                    notes: notes || null
                })
            });

            const result = await response.json();

            if (response.ok) {
                showFeedback(`Booking confirmed! Your appointment ID is #${result.id}. We will contact you to confirm.`, true);
                form.reset();
                dateInput.min = new Date().toISOString().split('T')[0];
                // Recargar slots para reflejar la nueva reserva
                await loadSlots();
            } else if (response.status === 400) {
                showFeedback('That time slot is already taken. Please choose another time.', false);
                // Recargar slots para mostrar el estado actualizado
                await loadSlots();
            } else {
                showFeedback(result.detail || 'Error creating booking. Please try again.', false);
            }
        } catch (err) {
            showFeedback('Connection error. Please try again or contact us directly.', false);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
    });

    loadFormData();
}

function validateForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('Please enter a valid name');
    }

    if (!data.phone || !/^[\d\s+()-]{9,}$/.test(data.phone)) {
        errors.push('Please enter a valid phone number');
    }

    if (!data.service) {
        errors.push('Please select a service');
    }

    if (!data.date) {
        errors.push('Please select a date');
    }

    if (!data.time) {
        errors.push('Please select a time');
    }

    if (errors.length > 0) {
        alert(errors.join('\n'));
        return false;
    }

    return true;
}

function createWhatsAppMessage(data) {
    const serviceName = document.querySelector(`#bookingService option[value="${data.service}"]`).textContent;
    const barberName = data.barber ? 
        document.querySelector(`#bookingBarber option[value="${data.barber}"]`).textContent : 
        'No preference';

    let message = `Hello! I would like to book an appointment:\n\n`;
    message += `📋 *Service:* ${serviceName}\n`;
    message += `👤 *Name:* ${data.name}\n`;
    message += `📅 *Date:* ${formatDate(data.date)}\n`;
    message += `🕐 *Time:* ${data.time}\n`;
    message += `💈 *Barber:* ${barberName}\n`;
    
    if (data.notes) {
        message += `📝 *Notes:* ${data.notes}\n`;
    }

    return encodeURIComponent(message);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showConfirmationModal(data, whatsappMessage, bookingId) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
        <div class="confirmation-content">
            <div class="confirmation-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Booking Confirmed!</h3>
            <div class="booking-id">Booking #${bookingId}</div>
            <p>Thank you <strong>${data.name}</strong>, your appointment has been confirmed for <strong>${formatDate(data.date)}</strong> at <strong>${data.time}</strong>.</p>
            <p class="confirmation-note">We'll send you a confirmation shortly. Thank you for choosing SLY Salon!</p>
            <div class="confirmation-buttons">
                <a href="https://wa.me/?text=${whatsappMessage}" class="btn btn-primary" target="_blank" rel="noopener">
                    <i class="fab fa-whatsapp"></i> Share via WhatsApp
                </a>
                <button class="btn btn-outline-dark close-modal">Close</button>
            </div>
        </div>
    `;

    // Añadir estilos del modal
    const style = document.createElement('style');
    style.textContent = `
        .confirmation-modal {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
        }
        .confirmation-content {
            background-color: white;
            padding: 2.5rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideUp 0.3s ease;
        }
        .confirmation-icon {
            width: 80px;
            height: 80px;
            background-color: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }
        .confirmation-icon i {
            font-size: 2.5rem;
            color: white;
        }
        .confirmation-content h3 {
            font-size: 1.5rem;
            color: #1a1a1a;
            margin-bottom: 1rem;
        }
        .booking-id {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: var(--color-primary);
            color: white;
            border-radius: 2rem;
            font-weight: 600;
            font-size: 0.875rem;
            margin-bottom: 1rem;
        }
        .confirmation-content p {
            color: #666;
            margin-bottom: 0.5rem;
        }
        .confirmation-note {
            font-size: 0.875rem;
            color: #888 !important;
            margin-bottom: 1.5rem !important;
        }
        .confirmation-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .btn-outline-dark {
            background-color: transparent;
            border: 2px solid #1a1a1a;
            color: #1a1a1a;
        }
        .btn-outline-dark:hover {
            background-color: #1a1a1a;
            color: white;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Cerrar modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * SLIDER DE VALORACIONES
 */
function initReviewsSlider() {
    const slider = document.getElementById('reviewsSlider');
    if (!slider) return;

    const track = slider.querySelector('.reviews-track');
    const cards = track.querySelectorAll('.review-card');
    const prevBtn = document.getElementById('prevReview');
    const nextBtn = document.getElementById('nextReview');

    let currentIndex = 0;
    let cardsPerView = getCardsPerView();

    function getCardsPerView() {
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 1024) return 2;
        return 3;
    }

    function updateSlider() {
        const cardWidth = cards[0].offsetWidth + 24; // card width + gap
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }

    function goToNext() {
        const maxIndex = cards.length - cardsPerView;
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        updateSlider();
    }

    function goToPrev() {
        const maxIndex = cards.length - cardsPerView;
        currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        updateSlider();
    }

    nextBtn.addEventListener('click', goToNext);
    prevBtn.addEventListener('click', goToPrev);

    // Auto-slide cada 5 segundos
    let autoSlide = setInterval(goToNext, 5000);

    // Pausar auto-slide al hover
    slider.addEventListener('mouseenter', () => clearInterval(autoSlide));
    slider.addEventListener('mouseleave', () => {
        autoSlide = setInterval(goToNext, 5000);
    });

    // Actualizar al cambiar tamaño de ventana
    window.addEventListener('resize', debounce(() => {
        cardsPerView = getCardsPerView();
        currentIndex = 0;
        updateSlider();
    }, 250));

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToNext();
            } else {
                goToPrev();
            }
        }
    }
}

/**
 * GALERÍA LIGHTBOX
 */
function initGalleryLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let currentImageIndex = 0;
    const images = [];

    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        images.push({
            src: img.src.replace('w=400', 'w=1200').replace('h=400', 'h=800').replace('h=600', 'h=1000'),
            alt: img.alt
        });

        item.addEventListener('click', () => {
            currentImageIndex = index;
            openLightbox();
        });
    });

    function openLightbox() {
        lightboxImage.src = images[currentImageIndex].src;
        lightboxImage.alt = images[currentImageIndex].alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        lightboxImage.src = images[currentImageIndex].src;
        lightboxImage.alt = images[currentImageIndex].alt;
    }

    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        lightboxImage.src = images[currentImageIndex].src;
        lightboxImage.alt = images[currentImageIndex].alt;
    }

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', showNextImage);
    prevBtn.addEventListener('click', showPrevImage);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
    });
}

/**
 * BOTÓN VOLVER ARRIBA
 */
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    const scrollThreshold = 500;

    function updateBackToTop() {
        if (window.scrollY > scrollThreshold) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', throttle(updateBackToTop, 100));

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * ANIMACIONES EN SCROLL
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.service-card, .team-card, .quality-item, .gallery-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate-fadeInUp');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

/**
 * SELECTOR DE FECHA
 */
function initDatePicker() {
    const dateInput = document.getElementById('bookingDate');
    if (!dateInput) return;

    // Establecer fecha mínima (hoy)
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.setAttribute('min', formattedDate);

    // Set maximum date (3 months from today)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);

    // Disable Sundays
    dateInput.addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        if (selectedDate.getDay() === 0) {
            alert('Sorry, we are closed on Sundays. Please choose another day.');
            this.value = '';
        }
    });
}

/**
 * UTILIDADES
 */
function throttle(func, wait) {
    let timeout = null;
    let lastArgs = null;

    return function(...args) {
        if (!timeout) {
            func.apply(this, args);
            timeout = setTimeout(() => {
                timeout = null;
                if (lastArgs) {
                    func.apply(this, lastArgs);
                    lastArgs = null;
                }
            }, wait);
        } else {
            lastArgs = args;
        }
    };
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * ACTUALIZAR LINKS ACTIVOS EN NAVEGACIÓN
 */
(function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', throttle(updateActiveLink, 100));
})();

/**
 * API URL para el formulario de reservas
 */
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) || 'http://localhost:9000/api/v1';
