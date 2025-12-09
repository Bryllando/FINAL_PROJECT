// ============================================
// DASHBOARD TO SCANNER NAVIGATION
// ============================================

// This script handles navigation between dashboard and scanner
// Ensures logged-in users can access scanner functionality

document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the scanner (index) page
    const scannerPage = document.querySelector('#reader');

    if (scannerPage) {
        // We're on the scanner page
        initializeScannerPage();
    }

    // Add navigation helpers for all pages
    setupNavigationHelpers();
});

// Initialize scanner page functionality
function initializeScannerPage() {
    console.log('Scanner page initialized');

    // Check if user is logged in by looking at the header buttons
    const loginButton = document.querySelector('button[onclick*="/login"]');
    const logoutButton = document.querySelector('button[onclick*="/logout"]');

    const isLoggedIn = !loginButton || logoutButton;

    if (isLoggedIn) {
        console.log('User is logged in - scanner accessible');
    } else {
        console.log('User not logged in - scanner accessible as guest');
    }
}

// Setup navigation helpers
function setupNavigationHelpers() {
    // Find all scanner buttons
    const scannerButtons = document.querySelectorAll('button[onclick*="window.location.href=\'/\'"]');

    scannerButtons.forEach(button => {
        // Remove inline onclick and add event listener
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes("window.location.href='/'")) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function (e) {
                e.preventDefault();
                navigateToScanner();
            });
        }
    });
}

// Navigate to scanner page
function navigateToScanner() {
    // Check if user is on dashboard (logged in)
    const isDashboard = window.location.pathname.includes('admin') ||
        window.location.pathname.includes('dashboard') ||
        window.location.pathname.includes('student') ||
        window.location.pathname.includes('attendance');

    if (isDashboard) {
        // User is logged in, navigate to scanner
        console.log('Navigating to scanner from dashboard');
    }

    // Navigate to scanner
    window.location.href = '/';
}

// Check authentication status
function isUserLoggedIn() {
    // Check for logout button (indicates logged in)
    const logoutButton = document.querySelector('button[onclick*="/logout"]');
    return !!logoutButton;
}

// Add return to dashboard link if on scanner and logged in
function addReturnToDashboardLink() {
    const isOnScanner = window.location.pathname === '/';
    const isLoggedIn = isUserLoggedIn();

    if (isOnScanner && isLoggedIn) {
        // Find the header button container
        const buttonContainer = document.querySelector('.flex.flex-col.sm\\:flex-row.gap-2');

        if (buttonContainer && !document.getElementById('returnToDashboard')) {
            // Create return to dashboard button
            const returnBtn = document.createElement('button');
            returnBtn.id = 'returnToDashboard';
            returnBtn.type = 'button';
            returnBtn.onclick = function () { window.location.href = '/admin'; };
            returnBtn.className = 'flex-1 sm:flex-none rounded-lg bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 text-sm sm:text-base lg:text-[20px] gap-1 sm:gap-2 font-medium flex items-center justify-center';
            returnBtn.innerHTML = `
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span class="hidden sm:inline">DASHBOARD</span>
                <span class="sm:hidden">DASH</span>
            `;

            // Insert before login button
            const loginButton = buttonContainer.querySelector('button[onclick*="/login"]');
            if (loginButton) {
                buttonContainer.insertBefore(returnBtn, loginButton);
            }
        }
    }
}

// Call this function after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addReturnToDashboardLink);
} else {
    addReturnToDashboardLink();
}