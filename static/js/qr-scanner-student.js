// ============================================
// QR CODE SCANNER FOR STUDENT ATTENDANCE
// FIXED VERSION - Properly marks attendance with time in
// ============================================

// Global variables
let html5QrCode = null;
let isScanning = false;
let scanCooldown = false;
let activeModals = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ QR Scanner initialized');

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', toggleScanner);
        console.log('✅ Start button event attached');
    } else {
        console.warn('⚠️ Start button not found!');
    }
});

// ============================================
// SCANNER CONTROL
// ============================================

async function toggleScanner() {
    if (isScanning) {
        stopScanner();
    } else {
        startScanner();
    }
}

function startScanner() {
    console.log('🎥 Starting QR scanner...');

    const startBtn = document.getElementById('startBtn');
    const placeholderOverlay = document.getElementById('scannerPlaceholder');

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
        console.log('📷 Html5Qrcode instance created');
    }

    const config = {
        fps: 10,
        qrbox: { width: 450, height: 450 }, // Extra large scan area for easier scanning
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        console.log('✅ Scanner started successfully');

        if (placeholderOverlay) {
            placeholderOverlay.classList.add('hidden');
        }

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

function stopScanner() {
    console.log('⏹️ Stopping QR scanner...');

    const startBtn = document.getElementById('startBtn');
    const placeholderOverlay = document.getElementById('scannerPlaceholder');

    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            console.log('✅ Scanner stopped successfully');

            if (placeholderOverlay) {
                placeholderOverlay.classList.remove('hidden');
            }

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

function onScanSuccess(decodedText, decodedResult) {
    if (scanCooldown) {
        console.log('⏳ Scan cooldown active, ignoring...');
        return;
    }

    console.log(`✅ QR Code detected: ${decodedText}`);

    scanCooldown = true;
    setTimeout(() => {
        scanCooldown = false;
        console.log('✅ Scan cooldown reset');
    }, 2000); // Increased cooldown to prevent double scans

    // First mark attendance, then fetch and show student info
    markAttendance(decodedText);
}

function onScanError(errorMessage) {
    if (!errorMessage.includes("NotFoundException")) {
        console.warn("⚠️ QR Scan error:", errorMessage);
    }
}

// ============================================
// STUDENT DATA FETCHING
// ============================================

function fetchStudentInfo(studentId) {
    console.log('📡 Fetching student info for:', studentId);

    // FIXED: Use public endpoint that doesn't require authentication
    fetch(`/api/student_public/${studentId}`)
        .then(response => {
            console.log('📥 Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📦 Student data received:', data);

            if (data.success && data.student) {
                showStudentModal(data.student);
            } else {
                console.error('❌ Student not found:', data.message || 'Unknown error');
                showNotFoundModal(studentId);
            }
        })
        .catch(error => {
            console.error('❌ Error fetching student info:', error);
            showNotFoundModal(studentId);
        });
}

// ============================================
// MODAL DISPLAY
// ============================================

function showStudentModal(student) {
    console.log('🎯 Showing student modal:', student);

    // Normalize image path
    let imagePath = student.image;
    if (imagePath && !imagePath.startsWith('/static/') && !imagePath.startsWith('http')) {
        if (imagePath.startsWith('images/')) {
            imagePath = `/static/${imagePath}`;
        } else {
            imagePath = `/static/images/${imagePath}`;
        }
    }
    console.log('🖼️ Image path:', imagePath);

    const profilePicture = imagePath
        ? `<img src="${imagePath}" class="w-full h-full object-cover" alt="Profile" 
            onerror="this.onerror=null; this.src=''; this.style.display='none'; this.parentElement.innerHTML='<svg class=\\'w-32 h-32 text-gray-400\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'><path fill-rule=\\'evenodd\\' d=\\'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z\\' clip-rule=\\'evenodd\\' /></svg>';">`
        : `<svg class="w-32 h-32 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
           </svg>`;

    const currentDateTime = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const modalHTML = `
        <div class="fixed inset-0 bg-opacity-60 flex items-center justify-center z-9999 p-4 animate-fadeIn">
            <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-slideUp">
                <div class="bg-linear-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-t-3xl flex justify-between items-center">
                    <h3 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <svg class="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Attendance Logged
                    </h3>
                    <button class="close-modal text-white hover:text-gray-200 text-3xl font-bold leading-none transition hover:scale-110">×</button>
                </div>

                <div class="p-8 md:p-10">
                    <div class="flex justify-center mb-8">
                        <div class="w-48 h-48 md:w-56 md:h-56 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-green-500 shadow-2xl">
                            ${profilePicture}
                        </div>
                    </div>

                    <div class="space-y-5">
                        <div class="bg-linear-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                            <p class="text-sm text-gray-500 uppercase font-bold mb-2 tracking-wide">ID Number</p>
                            <p class="text-2xl md:text-3xl font-bold text-blue-600">${student.idno}</p>
                        </div>
                        
                        <div class="bg-linear-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm">
                            <p class="text-sm text-gray-500 uppercase font-bold mb-2 tracking-wide">Full Name</p>
                            <p class="text-2xl md:text-3xl font-bold text-gray-800">${student.Firstname} ${student.Lastname}</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-5">
                            <div class="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm">
                                <p class="text-sm text-gray-500 uppercase font-bold mb-2 tracking-wide">Course</p>
                                <p class="text-lg md:text-xl font-bold text-gray-700">${student.course}</p>
                            </div>
                            
                            <div class="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm">
                                <p class="text-sm text-gray-500 uppercase font-bold mb-2 tracking-wide">Level</p>
                                <p class="text-lg md:text-xl font-bold text-gray-700">${getYearLevelText(student.level)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t-2 border-gray-200">
                        <div class="flex items-center justify-center gap-2 text-gray-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p class="text-base font-medium">${currentDateTime}</p>
                        </div>
                    </div>

                    <div class="mt-6 text-center bg-green-50 rounded-lg py-4">
                        <p class="text-lg text-gray-700">
                            Auto-closing in <span class="countdown-timer font-bold text-green-600 text-xl">3</span> seconds...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    const modal = modalElement.firstElementChild;

    activeModals.push(modal);
    document.body.appendChild(modal);
    console.log('✅ Modal displayed');

    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => removeModal(modal));

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

function showNotFoundModal(studentId) {
    console.log('❌ Showing not found modal for:', studentId);

    const modalHTML = `
        <div class="fixed inset-0  bg-opacity-60 flex items-center justify-center z-9999 p-4 animate-fadeIn">
            <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-slideUp">
                <div class="bg-linear-to-r from-red-500 to-red-600 text-white px-8 py-6 rounded-t-3xl flex justify-between items-center">
                    <h3 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <svg class="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Student Not Found
                    </h3>
                    <button class="close-modal text-white hover:text-gray-200 text-3xl font-bold leading-none transition hover:scale-110">×</button>
                </div>

                <div class="p-8 md:p-10">
                    <div class="flex justify-center mb-8">
                        <div class="w-48 h-48 md:w-56 md:h-56 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-500 shadow-2xl">
                            <svg class="w-32 h-32 md:w-40 md:h-40 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>

                    <div class="bg-linear-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 p-6 md:p-8 rounded-xl shadow-sm">
                        <p class="font-bold text-xl md:text-2xl mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
                            </svg>
                            Scanned ID: ${studentId}
                        </p>
                        <p class="text-base md:text-lg mb-4 font-medium">This student is not registered in the system.</p>
                        
                        <div class="mt-6 bg-white bg-opacity-50 rounded-lg p-5">
                            <p class="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                                </svg>
                                Please check:
                            </p>
                            <ul class="space-y-3 text-base md:text-lg">
                                <li class="flex items-center gap-3">
                                    <span class="shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span>QR code is valid and readable</span>
                                </li>
                                <li class="flex items-center gap-3">
                                    <span class="shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span>Student is registered in the database</span>
                                </li>
                                <li class="flex items-center gap-3">
                                    <span class="shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span>Student ID matches system records</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-8 text-center bg-red-50 rounded-lg py-4">
                        <p class="text-lg text-gray-700">
                            Auto-closing in <span class="countdown-timer font-bold text-red-600 text-xl">3</span> seconds...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    const modal = modalElement.firstElementChild;

    activeModals.push(modal);
    document.body.appendChild(modal);
    console.log('✅ Not found modal displayed');

    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => removeModal(modal));

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

function removeModal(modal) {
    if (!modal) return;

    modal.classList.add('animate-fadeOut');

    setTimeout(() => {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }

        const index = activeModals.indexOf(modal);
        if (index > -1) {
            activeModals.splice(index, 1);
        }

        console.log('✅ Modal removed. Active modals:', activeModals.length);
    }, 300);
}

// ============================================
// ATTENDANCE MARKING - FIXED
// ============================================

function markAttendance(studentId) {
    const currentDate = new Date().toISOString().split('T')[0];
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

    // FIXED: Use the correct endpoint that works without authentication
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
                // Fetch and display student info after successful attendance marking
                fetchStudentInfo(studentId);

                // Update attendance table if we're on the attendance page
                if (typeof updateAttendanceTable === 'function') {
                    updateAttendanceTable();
                }
            } else {
                console.error('❌ Failed to mark attendance:', data.message || 'Unknown error');
                // Still show student info even if attendance fails
                fetchStudentInfo(studentId);
            }
        })
        .catch(error => {
            console.error('❌ Error marking attendance:', error);
            // Still try to show student info
            fetchStudentInfo(studentId);
        });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getYearLevelText(level) {
    const levels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        '1st Year': '1st Year',
        '2nd Year': '2nd Year',
        '3rd Year': '3rd Year',
        '4th Year': '4th Year',
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

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
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

window.qrScanner = {
    startScanner,
    stopScanner,
    fetchStudentInfo,
    markAttendance,
    isScanning: () => isScanning,
    activeModals: () => activeModals.length
};

console.log('✅ QR Scanner module loaded successfully');