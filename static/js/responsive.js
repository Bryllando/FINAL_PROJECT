sd// QR Scanner Functionality
let html5QrCode = null;
let isScanning = false;

// Initialize QR Scanner
function initQRScanner() {
    if (typeof Html5Qrcode === 'undefined') {
        console.error('Html5Qrcode library not loaded');
        return;
    }

    html5QrCode = new Html5Qrcode("reader");
}

// Start QR Scanning
function startScanning() {
    if (!html5QrCode) {
        initQRScanner();
    }

    if (isScanning) {
        console.log('Already scanning');
        return;
    }

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        updateScanButton();
        console.log("QR Scanner started successfully");
    }).catch(err => {
        console.error("Unable to start scanner:", err);
        alert("Unable to access camera. Please check permissions.");
    });
}

// Stop QR Scanning
function stopScanning() {
    if (!html5QrCode || !isScanning) {
        return;
    }

    html5QrCode.stop().then(() => {
        isScanning = false;
        updateScanButton();
        console.log("QR Scanner stopped");
    }).catch(err => {
        console.error("Error stopping scanner:", err);
    });
}

// Handle successful QR scan
function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR Code detected: ${decodedText}`);

    // Stop scanning
    stopScanning();

    // Fetch student information
    fetchStudentInfo(decodedText);
}

// Handle scan errors (can be ignored for most cases)
function onScanError(errorMessage) {
    // Silently ignore scan errors as they occur frequently during scanning
}

// Fetch student information from API
async function fetchStudentInfo(studentId) {
    try {
        const response = await fetch(`/api/student/${studentId}`);
        const data = await response.json();

        if (data.success) {
            displayStudentInfo(data.student);
        } else {
            showNotification('Student not found', 'error');
        }
    } catch (error) {
        console.error('Error fetching student info:', error);
        showNotification('Error retrieving student information', 'error');
    }
}

// Display student information in a modal
function displayStudentInfo(student) {
    // Create modal HTML
    const modalHTML = `
        <div id="studentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">Student Information</h3>
                    <button onclick="closeStudentModal()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-4">
                    ${student.profile_picture ? `
                        <div class="flex justify-center mb-4">
                            <img src="/static/${student.profile_picture}" alt="Profile" class="w-32 h-32 rounded-full object-cover border-4 border-teal-500">
                        </div>
                    ` : ''}
                    
                    <div class="bg-gray-50 rounded-xl p-4">
                        <p class="text-sm text-gray-600">Student ID</p>
                        <p class="text-lg font-semibold text-teal-600">${student.studentId}</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-xl p-4">
                        <p class="text-sm text-gray-600">Name</p>
                        <p class="text-lg font-semibold">${student.firstName} ${student.lastName}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 rounded-xl p-4">
                            <p class="text-sm text-gray-600">Course</p>
                            <p class="text-lg font-semibold">${student.course}</p>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <p class="text-sm text-gray-600">Level</p>
                            <p class="text-lg font-semibold">${student.level}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex gap-3">
                    <button onclick="closeStudentModal(); startScanning();" 
                            class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors">
                        Scan Another
                    </button>
                    <button onclick="closeStudentModal()" 
                            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('studentModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close student info modal
function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.remove();
    }
}

// Update scan button text
function updateScanButton() {
    const btn = document.getElementById('startBtn');
    if (btn) {
        if (isScanning) {
            btn.textContent = 'Stop Scan';
            btn.classList.remove('bg-teal-500', 'hover:bg-teal-600');
            btn.classList.add('bg-red-500', 'hover:bg-red-600');
            btn.onclick = stopScanning;
        } else {
            btn.textContent = 'Start Scan';
            btn.classList.remove('bg-red-500', 'hover:bg-red-600');
            btn.classList.add('bg-teal-500', 'hover:bg-teal-600');
            btn.onclick = startScanning;
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Flash message auto-dismiss
function initFlashMessages() {
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(msg => {
        setTimeout(() => {
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 300);
        }, 5000);
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Responsive table wrapper
function makeTablesResponsive() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('overflow-x-auto')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'overflow-x-auto';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize QR scanner if on scanner page
    if (document.getElementById('reader')) {
        initQRScanner();

        // Set up start button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', startScanning);
        }
    }

    // Initialize flash messages
    initFlashMessages();

    // Initialize mobile menu
    initMobileMenu();

    // Make tables responsive
    makeTablesResponsive();

    // Close modals on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeStudentModal();
        }
    });
});

// Clean up on page unload
window.addEventListener('beforeunload', function () {
    if (isScanning && html5QrCode) {
        html5QrCode.stop();
    }
});