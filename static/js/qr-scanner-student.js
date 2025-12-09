// ============================================
// QR CODE SCANNER FOR STUDENT ATTENDANCE
// FIXED VERSION - Shows modal popup with student info
// Supports multiple consecutive scans
// ============================================

// Global variables
let html5QrCode = null;
let isScanning = false;
let scanCooldown = false; // Prevent rapid double-scanning
let activeModals = []; // Track all active modals

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ QR Scanner initialized');

    const startBtn = document.getElementById('startBtn');

    // Attach click event to start button
    if (startBtn) {
        startBtn.addEventListener('click', toggleScanner);
        console.log('✅ Start button event attached');
    } else {
        console.warn('⚠️ Start button not found!');
    }
});


// ============================================
// SCANNER CONTROL FUNCTIONS
// ============================================

/**
 * Toggle QR scanner on/off
 */
async function toggleScanner() {
    if (isScanning) {
        stopScanner();
    } else {
        startScanner();
    }
}

/**
 * Start the QR code scanner
 * Initializes camera and begins scanning
 */
function startScanner() {
    console.log('🎥 Starting QR scanner...');

    const startBtn = document.getElementById('startBtn');
    const placeholderOverlay = document.getElementById('scannerPlaceholder');

    // Initialize scanner if not already created
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
        console.log('📷 Html5Qrcode instance created');
    }

    // Scanner configuration
    const config = {
        fps: 10, // Frames per second
        qrbox: { width: 250, height: 250 }, // Scanning box size
        aspectRatio: 1.0
    };

    // Start camera with back camera (environment)
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        console.log('✅ Scanner started successfully');

        // Hide placeholder overlay
        if (placeholderOverlay) {
            placeholderOverlay.classList.add('hidden');
        }

        // Update button to "Stop" state
        if (startBtn) {
            startBtn.textContent = 'Stop Scan';
            startBtn.classList.remove('bg-teal-500', 'hover:bg-teal-600');
            startBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        }

    }).catch(err => {
        console.error("❌ Failed to start scanner:", err);
        alert("Failed to start camera. Please ensure camera permissions are granted.");
    });
}

/**
 * Stop the QR code scanner
 * Releases camera and resets UI
 */
function stopScanner() {
    console.log('⏹️ Stopping QR scanner...');

    const startBtn = document.getElementById('startBtn');
    const placeholderOverlay = document.getElementById('scannerPlaceholder');

    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            console.log('✅ Scanner stopped successfully');

            // Show placeholder overlay
            if (placeholderOverlay) {
                placeholderOverlay.classList.remove('hidden');
            }

            // Update button to "Start" state
            if (startBtn) {
                startBtn.textContent = 'Start Scan';
                startBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
                startBtn.classList.add('bg-teal-500', 'hover:bg-teal-600');
            }

        }).catch(err => {
            console.error("❌ Error stopping scanner:", err);
        });
    }
}


// ============================================
// SCAN HANDLERS
// ============================================

/**
 * Handle successful QR code scan
 * @param {string} decodedText - The decoded QR code text (student ID)
 * @param {object} decodedResult - Full scan result object
 */
function onScanSuccess(decodedText, decodedResult) {
    // Prevent multiple scans in quick succession (500ms cooldown)
    if (scanCooldown) {
        console.log('⏳ Scan cooldown active, ignoring...');
        return;
    }

    console.log(`✅ QR Code detected: ${decodedText}`);

    // Activate cooldown for 500ms (allows multiple scans)
    scanCooldown = true;
    setTimeout(() => {
        scanCooldown = false;
        console.log('✅ Scan cooldown reset');
    }, 500);

    // Fetch student information and mark attendance
    // Scanner keeps running to allow multiple scans
    fetchStudentInfo(decodedText);
}

/**
 * Handle scan errors (mostly just "not found" errors)
 * @param {string} errorMessage - Error message from scanner
 */
function onScanError(errorMessage) {
    // Only log non-"NotFoundException" errors
    // NotFoundException is normal when no QR code is in view
    if (!errorMessage.includes("NotFoundException")) {
        console.warn("⚠️ QR Scan error:", errorMessage);
    }
}


// ============================================
// STUDENT DATA FETCHING
// ============================================

/**
 * Fetch student information from server
 * Uses PUBLIC endpoint (no authentication required)
 * @param {string} studentId - Student ID number from QR code
 */
function fetchStudentInfo(studentId) {
    console.log('📡 Fetching student info for:', studentId);

    // Use public endpoint that doesn't require authentication
    fetch(`/api/student_public/${studentId}`)
        .then(response => {
            console.log('📥 Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📦 Student data received:', data);

            if (data.success) {
                // Student found - display info and mark attendance
                showStudentModal(data.student);
                markAttendance(studentId);
            } else {
                // Student not found in database
                console.error('❌ Student not found:', data.message);
                showNotFoundModal(studentId);
            }
        })
        .catch(error => {
            console.error('❌ Error fetching student info:', error);
            showNotFoundModal(studentId);
        });
}


// ============================================
// MODAL DISPLAY FUNCTIONS
// ============================================

/**
 * Show student information modal
 * Displays for 3 seconds then auto-closes
 * Multiple modals can be shown simultaneously
 * @param {object} student - Student data object
 */
function showStudentModal(student) {
    console.log('🎯 Showing student modal:', student);

    // Build profile picture URL
    let imagePath = student.image;
    if (imagePath && !imagePath.startsWith('/static/') && !imagePath.startsWith('http')) {
        if (imagePath.startsWith('images/')) {
            imagePath = `/static/${imagePath}`;
        } else {
            imagePath = `/static/images/${imagePath}`;
        }
    }
    console.log('🖼️ Image path:', imagePath);

    // Create profile picture HTML with fallback
    const profilePicture = imagePath
        ? `<img src="${imagePath}" class="w-full h-full object-cover" alt="Profile" 
            onerror="this.onerror=null; this.src=''; this.style.display='none'; this.parentElement.innerHTML='<svg class=\\'w-20 h-20 text-gray-400\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'><path fill-rule=\\'evenodd\\' d=\\'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z\\' clip-rule=\\'evenodd\\' /></svg>';">`
        : `<svg class="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
           </svg>`;

    // Get current date/time for display
    const currentDateTime = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true // 12-hour format with AM/PM
    });

    // Create modal HTML
    const modalHTML = `
        <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
                <!-- Header -->
                <div class="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                    <h3 class="text-xl font-bold flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Attendance Logged
                    </h3>
                    <button class="close-modal text-white hover:text-gray-200 text-2xl font-bold leading-none transition">
                        ×
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6">
                    <!-- Profile Picture -->
                    <div class="flex justify-center mb-6">
                        <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-green-500 shadow-lg">
                            ${profilePicture}
                        </div>
                    </div>

                    <!-- Student Information -->
                    <div class="space-y-4">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-xs text-gray-500 uppercase font-semibold mb-1">ID Number</p>
                            <p class="text-lg font-bold text-blue-600">${student.idno}</p>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Full Name</p>
                            <p class="text-lg font-semibold text-gray-800">${student.Firstname} ${student.Lastname}</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Course</p>
                                <p class="text-sm font-medium text-gray-700">${student.course}</p>
                            </div>
                            
                            <div class="bg-gray-50 rounded-lg p-4">
                                <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Level</p>
                                <p class="text-sm font-medium text-gray-700">${getYearLevelText(student.level)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Timestamp -->
                    <div class="mt-4 text-center">
                        <p class="text-xs text-gray-500">${currentDateTime}</p>
                    </div>

                    <!-- Auto-close countdown -->
                    <div class="mt-4 text-center">
                        <p class="text-sm text-gray-500">
                            <span class="countdown-timer font-semibold">3</span> seconds remaining...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    const modal = modalElement.firstElementChild;

    // Add to active modals array
    activeModals.push(modal);

    // Append to body
    document.body.appendChild(modal);
    console.log('✅ Modal displayed');

    // Setup close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        removeModal(modal);
    });

    // Auto-close after 3 seconds with countdown
    let countdown = 3;
    const countdownEl = modal.querySelector('.countdown-timer');

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownEl) {
            countdownEl.textContent = countdown;
        }
    }, 1000);

    setTimeout(() => {
        clearInterval(countdownInterval);
        removeModal(modal);
    }, 3000);
}

/**
 * Show "student not found" modal
 * @param {string} studentId - The scanned student ID
 */
function showNotFoundModal(studentId) {
    console.log('❌ Showing not found modal for:', studentId);

    // Create modal HTML
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
                <!-- Header -->
                <div class="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                    <h3 class="text-xl font-bold flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Student Not Found
                    </h3>
                    <button class="close-modal text-white hover:text-gray-200 text-2xl font-bold leading-none transition">
                        ×
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6">
                    <!-- Error Icon -->
                    <div class="flex justify-center mb-6">
                        <div class="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-500">
                            <svg class="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>

                    <!-- Error Message -->
                    <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
                        <p class="font-bold mb-2">Scanned ID: ${studentId}</p>
                        <p class="text-sm mb-2">This student is not registered in the system.</p>
                        <p class="text-sm mt-2 font-semibold">Please check:</p>
                        <ul class="list-disc list-inside text-sm mt-2 space-y-1">
                            <li>QR code is valid</li>
                            <li>Student is registered</li>
                            <li>Correct student ID</li>
                        </ul>
                    </div>

                    <!-- Auto-close countdown -->
                    <div class="mt-4 text-center">
                        <p class="text-sm text-gray-500">
                            <span class="countdown-timer font-semibold">3</span> seconds remaining...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    const modal = modalElement.firstElementChild;

    // Add to active modals array
    activeModals.push(modal);

    // Append to body
    document.body.appendChild(modal);
    console.log('✅ Not found modal displayed');

    // Setup close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        removeModal(modal);
    });

    // Auto-close after 3 seconds with countdown
    let countdown = 3;
    const countdownEl = modal.querySelector('.countdown-timer');

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownEl) {
            countdownEl.textContent = countdown;
        }
    }, 1000);

    setTimeout(() => {
        clearInterval(countdownInterval);
        removeModal(modal);
    }, 3000);
}

/**
 * Remove modal from DOM and active modals array
 * @param {HTMLElement} modal - Modal element to remove
 */
function removeModal(modal) {
    if (!modal) return;

    // Add fade out animation
    modal.classList.add('animate-fadeOut');

    // Remove after animation
    setTimeout(() => {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }

        // Remove from active modals array
        const index = activeModals.indexOf(modal);
        if (index > -1) {
            activeModals.splice(index, 1);
        }

        console.log('✅ Modal removed. Active modals:', activeModals.length);
    }, 300);
}


// ============================================
// ATTENDANCE MARKING
// ============================================

/**
 * Mark attendance for scanned student
 * Sends POST request to server with student ID, date, and time
 * @param {string} studentId - Student ID number
 */
function markAttendance(studentId) {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];

    // Get current time in HH:MM format
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });

    console.log('⏰ Marking attendance:', {
        studentId,
        date: currentDate,
        time: currentTime
    });

    // Send attendance data to server
    fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_idno: studentId,
            date: currentDate,
            time_in: currentTime,
            status: 'PRESENT'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Attendance marked successfully');

                // Update attendance table if on attendance page
                // This function is defined in attendance-student.js
                if (typeof updateAttendanceTable === 'function') {
                    updateAttendanceTable();
                    console.log('📊 Attendance table updated');
                }
            } else {
                console.error('❌ Failed to mark attendance:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error marking attendance:', error);
        });
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert year level number to text
 * @param {number|string} level - Year level (1, 2, 3, 4)
 * @returns {string} - Year level text (e.g., "1st Year")
 */
function getYearLevelText(level) {
    const levels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        1: '1st Year',
        2: '2nd Year',
        3: '3rd Year',
        4: '4th Year'
    };
    return levels[level] || level || 'Unknown';
}


// ============================================
// CSS ANIMATIONS
// ============================================

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    /* Fade in animation */
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    /* Fade out animation */
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    /* Slide up animation */
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
    
    .animate-fadeOut {
        animation: fadeOut 0.3s ease-out;
    }
    
    .animate-slideUp {
        animation: slideUp 0.3s ease-out;
    }
`;
document.head.appendChild(style);

console.log('🎨 CSS animations loaded');


// ============================================
// EXPORT FOR TESTING
// ============================================

// Make functions available globally for debugging
window.qrScanner = {
    startScanner,
    stopScanner,
    fetchStudentInfo,
    markAttendance,
    isScanning: () => isScanning,
    activeModals: () => activeModals.length
};

console.log('✅ QR Scanner module loaded successfully');