// ===== Global State =====
let data = null;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        const response = await fetch('data.json');
        data = await response.json();

        // Render all sections
        renderHero();
        renderAbout();
        renderSkills();
        renderExperience();
        renderEducation();
        renderPersonal();
        renderContact();
        renderFooter();

        // Initialize interactions
        initNavbar();
        initScrollAnimations();
        initMobileMenu();

    } catch (error) {
        console.error('Error loading data:', error);
    }
});

// ===== Render Functions =====

function renderHero() {
    document.getElementById('heroName').textContent = data.personal.name;
    document.getElementById('heroTitle').textContent = data.personal.title;

    const skills = data.about.expertise.map(exp => exp.title).join(' • ');
    document.getElementById('heroSkills').textContent = skills;
}

function renderAbout() {
    document.getElementById('aboutBio').textContent = data.personal.bio;

    const expertiseGrid = document.getElementById('expertiseGrid');
    data.about.expertise.forEach(expertise => {
        const card = createExpertiseCard(expertise);
        expertiseGrid.appendChild(card);
    });
}

function createExpertiseCard(expertise) {
    const card = document.createElement('div');
    card.className = 'expertise-card';
    card.innerHTML = `
        <span class="expertise-icon">${expertise.icon}</span>
        <h3>${expertise.title}</h3>
        <p>${expertise.description}</p>
    `;
    return card;
}

function renderSkills() {
    document.getElementById('skillsIntro').textContent = data.skills.intro;

    const container = document.getElementById('skillsContainer');
    data.skills.categories.forEach(category => {
        const categoryElement = createSkillCategory(category);
        container.appendChild(categoryElement);
    });

    // Render additional technologies
    const techContainer = document.getElementById('additionalTech');
    data.skills.additionalTechnologies.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        techContainer.appendChild(tag);
    });

    // Animate skill bars on scroll
    observeSkillBars();
}

function createSkillCategory(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = `skill-category ${category.highlight ? 'highlight' : ''}`;

    const header = document.createElement('div');
    header.className = 'skill-category-header';
    header.innerHTML = `
        <span class="skill-category-icon">${category.icon}</span>
        <h3>${category.name}</h3>
    `;
    categoryDiv.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'skills-grid';

    category.skills.forEach(skill => {
        const skillCard = createSkillCard(skill);
        grid.appendChild(skillCard);
    });

    categoryDiv.appendChild(grid);
    return categoryDiv;
}

function createSkillCard(skill) {
    const card = document.createElement('div');
    card.className = `skill-card ${skill.featured ? 'featured' : ''}`;
    card.innerHTML = `
        <div class="skill-header">
            <h4>${skill.name}</h4>
            <span class="skill-badge">${skill.level}</span>
        </div>
        <div class="skill-bar-container">
            <div class="skill-bar" data-width="${skill.proficiency}" style="width: 0%"></div>
        </div>
        <p class="skill-description">${skill.description}</p>
    `;
    return card;
}

function observeSkillBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.skill-bar');
                bars.forEach(bar => {
                    const width = bar.getAttribute('data-width');
                    setTimeout(() => {
                        bar.style.width = width + '%';
                    }, 100);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        observer.observe(skillsSection);
    }
}

function renderExperience() {
    document.getElementById('experienceIntro').textContent = data.experience.intro;

    const timeline = document.getElementById('timeline');
    data.experience.positions.forEach(position => {
        const item = createTimelineItem(position);
        timeline.appendChild(item);
    });
}

function createTimelineItem(position) {
    const item = document.createElement('div');
    item.className = `timeline-item ${position.current ? 'current' : ''}`;

    const card = document.createElement('div');
    card.className = `experience-card ${position.current ? 'current' : ''}`;

    const header = document.createElement('div');
    header.className = 'experience-header';

    const companyLink = position.companyUrl
        ? `<a href="${position.companyUrl}" target="_blank" class="experience-company">${position.company}</a>`
        : `<span class="experience-company">${position.company}</span>`;

    header.innerHTML = `
        <div>
            <h3 class="experience-title">${position.title}</h3>
            ${companyLink}
            <div class="experience-meta">
                <span class="experience-period ${position.current ? 'current' : ''}">${position.period}</span>
                <span>${position.location}</span>
            </div>
        </div>
    `;

    const summary = document.createElement('p');
    summary.className = 'experience-summary';
    summary.textContent = position.summary;

    const achievements = document.createElement('ul');
    achievements.className = 'achievements';
    position.achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.textContent = achievement;
        achievements.appendChild(li);
    });

    card.appendChild(header);
    card.appendChild(summary);
    card.appendChild(achievements);
    item.appendChild(card);

    return item;
}

function renderEducation() {
    document.getElementById('educationIntro').textContent = data.education.intro;

    const grid = document.getElementById('educationGrid');
    data.education.degrees.forEach(degree => {
        const card = createEducationCard(degree);
        grid.appendChild(card);
    });

    // Render continuous learning
    const learningGrid = document.getElementById('learningGrid');
    data.education.continuousLearning.areas.forEach(area => {
        const card = createLearningCard(area);
        learningGrid.appendChild(card);
    });
}

function createEducationCard(degree) {
    const card = document.createElement('div');
    card.className = `education-card ${degree.primary ? 'primary' : ''}`;
    card.innerHTML = `
        <span class="education-icon">${degree.icon}</span>
        <h3 class="education-degree">${degree.degree}</h3>
        <p class="education-institution">${degree.institution}</p>
        <p class="education-period">${degree.period}</p>
        <p class="education-description">${degree.description}</p>
    `;
    return card;
}

function createLearningCard(area) {
    const card = document.createElement('div');
    card.className = 'learning-card';

    const items = area.items.map(item => `<li>${item}</li>`).join('');
    card.innerHTML = `
        <span class="learning-icon">${area.icon}</span>
        <h4>${area.title}</h4>
        <ul>${items}</ul>
    `;
    return card;
}

function renderPersonal() {
    // Render interests
    const interestsGrid = document.getElementById('interestsGrid');
    data.about.interests.forEach(interest => {
        const card = createInterestCard(interest);
        interestsGrid.appendChild(card);
    });

    // Render volunteer section
    const volunteerSection = document.getElementById('volunteerSection');
    const volunteerCard = createVolunteerCard(data.volunteer);
    volunteerSection.appendChild(volunteerCard);
}

function createInterestCard(interest) {
    const card = document.createElement('div');
    card.className = 'interest-card';
    card.innerHTML = `
        <span class="interest-icon">${interest.icon}</span>
        <h3>${interest.title}</h3>
        <p>${interest.description}</p>
    `;
    return card;
}

function createVolunteerCard(volunteer) {
    const card = document.createElement('div');
    card.innerHTML = `
        <div class="volunteer-header">
            <div class="volunteer-title-group">
                <h3>${volunteer.title}</h3>
                <div class="volunteer-organization">${volunteer.organization}</div>
            </div>
            <span class="volunteer-period">${volunteer.period}</span>
        </div>
        <p class="volunteer-description">${volunteer.description}</p>
        <a href="${volunteer.website}" target="_blank" rel="noopener noreferrer" class="volunteer-link">
            Visit Website →
        </a>
    `;
    return card;
}

function renderContact() {
    document.getElementById('contactMessage').textContent = data.about.connectMessage;

    const socialLinks = document.getElementById('socialLinks');
    const socialData = [
        { name: 'Email', url: `mailto:${data.social.email}`, icon: '📧' },
        { name: 'GitHub', url: `https://github.com/${data.social.github}`, icon: '💻' },
        { name: 'LinkedIn', url: `https://linkedin.com/in/${data.social.linkedin}`, icon: '💼' }
    ];

    socialData.forEach(social => {
        const link = document.createElement('a');
        link.href = social.url;
        link.className = 'social-link';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = `${social.icon} ${social.name}`;
        socialLinks.appendChild(link);
    });
}

function renderFooter() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    document.getElementById('footerName').textContent = data.personal.name;

    const footerSocial = document.getElementById('footerSocial');
    const socialLinks = [
        { name: 'GitHub', url: `https://github.com/${data.social.github}`, symbol: '⚡' },
        { name: 'LinkedIn', url: `https://linkedin.com/in/${data.social.linkedin}`, symbol: '💼' },
        { name: 'Email', url: `mailto:${data.social.email}`, symbol: '📧' }
    ];

    socialLinks.forEach(social => {
        const link = document.createElement('a');
        link.href = social.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = social.name;
        link.textContent = social.symbol;
        footerSocial.appendChild(link);
    });
}

// ===== Navigation Functions =====

function initNavbar() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
}

function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }
}

// ===== Scroll Animations =====

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all cards and sections
    const elements = document.querySelectorAll('.expertise-card, .skill-card, .experience-card, .education-card, .learning-card, .interest-card, .volunteer-section');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ===== Utility Functions =====

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Easter Egg - Console Message =====
console.log('%c👋 Hey there!', 'font-size: 20px; font-weight: bold; color: #ea580c;');
console.log('%cInterested in how this site was built?', 'font-size: 14px; color: #94a3b8;');
console.log('%cIt\'s a vanilla JS single-page portfolio powered by JSON data.', 'font-size: 14px; color: #94a3b8;');
console.log('%cCheck out the source: https://github.com/' + (data?.social?.github || 'nero408'), 'font-size: 14px; color: #ea580c;');
