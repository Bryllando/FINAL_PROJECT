// ============================================
// SIDEBAR MANAGEMENT
// ============================================
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Toggle sidebar and overlay
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    });
}

// Close sidebar when clicking overlay
if (overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    });
}

// Close sidebar on window resize to desktop size
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
});

// Close sidebar on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
});

// ============================================
// PAGE NAVIGATION SYSTEM - FIXED VERSION
// ============================================
const pages = {
    users: document.getElementById('adminContent'),
    studentManagement: document.getElementById('StudentManagementContent'),
    students: document.getElementById('StudentContent'),
    attendance: document.getElementById('attendanceContent')
};

// Get all navigation links
const navLinks = document.querySelectorAll('nav a[data-page]');

// Function to show a specific page
function showPage(pageName) {
    console.log('Showing page:', pageName); // Debug log

    // Hide all pages
    Object.keys(pages).forEach(key => {
        const page = pages[key];
        if (page) {
            page.classList.add('hidden');
            console.log('Hiding:', key); // Debug log
        }
    });

    // Show selected page
    if (pages[pageName]) {
        pages[pageName].classList.remove('hidden');
        console.log('Showing:', pageName); // Debug log
    } else {
        console.error('Page not found:', pageName); // Debug log
    }

    // Update active state on navigation links
    navLinks.forEach(link => {
        if (link.dataset.page === pageName) {
            link.classList.add('bg-[#3182ce]');
        } else {
            link.classList.remove('bg-[#3182ce]');
        }
    });

    // Close sidebar and overlay after navigation
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');

    // Initialize specific page functionality
    setTimeout(() => {
        if (pageName === 'attendance') {
            renderTable();
        }
        if (pageName === 'studentManagement') {
            renderStudentManagementTable();
        }
        if (pageName === 'students') {
            initializeStudentForm();
        }
    }, 100);
}

// Add click event listeners to navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.dataset.page;
        console.log('Navigation clicked:', pageName); // Debug log
        showPage(pageName);
    });
});

