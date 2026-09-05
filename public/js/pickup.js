// Pickup Request and Collector Dashboard Logic

const REQUESTS_KEY = 'wastepickup_requests';

// Get all requests from local storage
function getPickupRequests() {
    try {
        const raw = localStorage.getItem(REQUESTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// Save all requests
function savePickupRequests(requests) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

// Add a new pickup request
function addPickupRequest(req) {
    const all = getPickupRequests();
    all.unshift(req);
    savePickupRequests(all);
    renderPickupTracker(); // Update UI if needed
}

// Update the status of a request
function updatePickupStatus(id, status, collectorInfo = {}) {
    const all = getPickupRequests();
    const idx = all.findIndex(r => r.id === id);
    if (idx >= 0) {
        all[idx].status = status;
        Object.assign(all[idx], collectorInfo);
        
        // Award credits on completion
        if (status === 'completed' && !all[idx].creditsAwarded) {
            all[idx].creditsAwarded = 25; // 25 credits to user
            all[idx].collectorCreditsAwarded = 50; // 50 credits to collector
            
            let awardedAmount = 0;
            
            // Add credits to current user if they are the requester
            if (currentUser && (all[idx].userName === currentUser.name || all[idx].phone === currentUser.phone)) {
                appData.credits += 25;
                saveData();
                updateGlobalStats();
                awardedAmount = 25;
            } else if (currentUser && all[idx].collectorName === currentUser.name) {
                // If they are the collector
                awardedAmount = 50;
            }
            
            if (awardedAmount > 0 && typeof window.showCreditAnimation === 'function') {
                window.showCreditAnimation(awardedAmount);
            }
        }
        
        savePickupRequests(all);
        renderPickupTracker();
        renderCollectorDashboard();
    }
}

// Initialize the Pickup UI
document.addEventListener('DOMContentLoaded', () => {
    const pickupForm = document.getElementById('pickup-form');
    if (pickupForm) {
        pickupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert("Please log in to book a pickup.");
                return;
            }
            
            const req = {
                id: 'req-' + Date.now(),
                userName: currentUser.name || 'User',
                phone: document.getElementById('pickup-phone').value,
                address: document.getElementById('pickup-address').value,
                wasteType: document.getElementById('pickup-type').value,
                estimatedKg: document.getElementById('pickup-weight').value,
                preferredTime: document.getElementById('pickup-time').value,
                status: 'pending',
                submittedAt: new Date().toISOString()
            };
            
            addPickupRequest(req);
            
            // Show tracker, hide form
            pickupForm.reset();
            renderPickupTracker();
        });
    }
    
    // We also need to listen for hash changes to render collector dashboard
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.replace('#', '');
        if (view === 'pickup') {
            renderPickupTracker();
        } else if (view === 'collector') {
            renderCollectorDashboard();
        } else if (view === 'admin') {
            renderAdminDashboard();
        }
    });
});

// Render the tracker for the current user's active request
function renderPickupTracker() {
    const trackerContainer = document.getElementById('pickup-tracker-container');
    const formContainer = document.getElementById('pickup-form')?.parentElement;
    
    if (!trackerContainer || !formContainer) return;
    
    if (!currentUser) {
        trackerContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
        return;
    }
    
    // Find latest active request for this user
    const all = getPickupRequests();
    const activeReq = all.find(r => 
        (r.userName === currentUser.name || r.phone === currentUser.phone) && 
        r.status !== 'completed' && r.status !== 'rejected'
    );
    
    if (activeReq) {
        trackerContainer.classList.remove('hidden');
        formContainer.classList.add('hidden');
        
        // Update basic text nodes
        document.getElementById('tracker-req-id').innerText = '#' + activeReq.id.substring(4, 10).toUpperCase();
        document.getElementById('tracker-summary-type').innerText = activeReq.wasteType.toUpperCase();
        document.getElementById('tracker-summary-weight').innerText = activeReq.estimatedKg;
        document.getElementById('tracker-summary-address').innerText = activeReq.address || 'Address not provided';
        
        const statusBadge = document.getElementById('tracker-status-badge');
        const statusText = document.getElementById('tracker-status-text');
        const etaText = document.getElementById('tracker-eta-text');
        const collectorMarker = document.getElementById('tracker-collector-marker');
        const collectorInfo = document.getElementById('tracker-collector-info');
        const pendingState = document.getElementById('tracker-pending-state');
        
        // Reset styles
        statusBadge.className = 'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2';
        
        if (activeReq.status === 'pending') {
            statusBadge.classList.add('bg-yellow-100', 'text-yellow-700', 'border', 'border-yellow-200');
            statusText.innerText = 'PENDING';
            etaText.innerText = 'Searching...';
            
            collectorMarker.classList.add('hidden');
            collectorInfo.classList.add('hidden');
            pendingState.classList.remove('hidden');
            
        } else {
            // It is accepted or arrived
            pendingState.classList.add('hidden');
            collectorInfo.classList.remove('hidden');
            collectorMarker.classList.remove('hidden');
            
            if (activeReq.status === 'accepted') {
                statusBadge.classList.add('bg-blue-100', 'text-blue-700', 'border', 'border-blue-200');
                statusText.innerText = 'ON THE WAY';
                etaText.innerText = '12 mins away';
            } else if (activeReq.status === 'arrived') {
                statusBadge.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-200');
                statusText.innerText = 'ARRIVED';
                etaText.innerText = 'Outside';
            }
            
            // Populate collector info
            document.getElementById('tracker-collector-name').innerText = activeReq.collectorName || 'Collector';
            document.getElementById('tracker-collector-initial').innerText = (activeReq.collectorName || 'C')[0].toUpperCase();
            document.getElementById('tracker-call-btn').href = `tel:${activeReq.collectorPhone || '#'}`;
            
            // Animate map marker if arrived
            if (activeReq.status === 'arrived') {
                // Move collector marker close to home marker
                collectorMarker.style.top = '55%';
                collectorMarker.style.left = '48%';
            } else {
                collectorMarker.style.top = '35%';
                collectorMarker.style.left = '65%';
            }
        }
        
    } else {
        // No active request, show form
        trackerContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
    }
}

// Render the Collector Dashboard
function renderCollectorDashboard() {
    const list = document.getElementById('collector-requests-list');
    const activeTaskPanel = document.getElementById('collector-active-task');
    const earningsDisplay = document.getElementById('collector-credits-display');
    
    if (!list || !activeTaskPanel) return;
    
    if (!currentUser) {
        list.innerHTML = `<p class="text-gray-500">Please log in to view available requests.</p>`;
        return;
    }
    
    const all = getPickupRequests();
    
    // Calculate collector earnings
    const myCompleted = all.filter(r => r.collectorName === currentUser.name && r.status === 'completed');
    const totalEarnings = myCompleted.reduce((sum, r) => sum + (r.collectorCreditsAwarded || 0), 0);
    if (earningsDisplay) earningsDisplay.innerText = totalEarnings;
    
    // Find active task for this collector
    const activeTask = all.find(r => r.collectorName === currentUser.name && r.status !== 'completed' && r.status !== 'rejected');
    
    if (activeTask) {
        activeTaskPanel.innerHTML = `
            <div class="mb-4">
                <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide mb-2">${activeTask.status}</span>
                <h4 class="font-bold text-lg text-gray-900">${activeTask.wasteType.toUpperCase()} - ${activeTask.estimatedKg} kg</h4>
                <p class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-location-dot mr-1 text-red-500"></i> ${activeTask.address}</p>
                <p class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-phone mr-1 text-green-500"></i> ${activeTask.phone}</p>
            </div>
            
            <div class="flex gap-2 mt-4">
                ${activeTask.status === 'accepted' ? 
                    `<button onclick="updatePickupStatus('${activeTask.id}', 'arrived')" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded font-bold transition">Mark Arrived</button>` : ''
                }
                ${activeTask.status === 'arrived' ? 
                    `<button onclick="updatePickupStatus('${activeTask.id}', 'completed')" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition">Complete Pickup</button>` : ''
                }
            </div>
        `;
    } else {
        activeTaskPanel.innerHTML = `<p class="text-gray-500 text-sm text-center">No active task. Accept a pickup request to start.</p>`;
    }
    
    // Render available pending requests
    const pendingRequests = all.filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        list.innerHTML = `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <i class="fa-solid fa-mug-hot text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">No pending requests right now.</p>
            </div>
        `;
    } else {
        list.innerHTML = pendingRequests.map(r => `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h4 class="font-bold text-gray-900">${r.wasteType.toUpperCase()} <span class="text-gray-500 font-normal">(${r.estimatedKg} kg)</span></h4>
                    <p class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-location-dot mr-1 text-red-500"></i> ${r.address}</p>
                    <p class="text-xs text-gray-400 mt-1">Requested by ${r.userName} • Time: ${new Date(r.preferredTime).toLocaleString()}</p>
                </div>
                <button onclick="acceptRequest('${r.id}')" ${activeTask ? 'disabled class="bg-gray-300 text-gray-500 py-2 px-6 rounded-lg font-bold cursor-not-allowed"' : 'class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-bold transition shadow-sm whitespace-nowrap"'}>
                    Accept
                </button>
            </div>
        `).join('');
    }
}

// Global hook for the Accept button
window.acceptRequest = function(id) {
    if (!currentUser) return;
    updatePickupStatus(id, 'accepted', {
        collectorName: currentUser.name,
        collectorPhone: currentUser.phone || '555-0000',
        acceptedAt: new Date().toISOString()
    });
};

// Render Admin Dashboard
window.renderAdminDashboard = function() {
    const table = document.getElementById('admin-requests-table');
    if (!table) return;
    
    const all = getPickupRequests();
    
    // Update top stats
    document.getElementById('admin-active-pickups').innerText = all.filter(r => r.status !== 'completed' && r.status !== 'rejected').length;
    document.getElementById('admin-total-weight').innerText = all.reduce((sum, r) => sum + parseInt(r.estimatedKg || 0), 0);
    
    // Try to get total users from PocketBase or local fallback
    let userCount = 0;
    try {
        const pbUsers = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
        userCount = Object.keys(pbUsers).length || 1; 
    } catch {
        userCount = 1;
    }
    document.getElementById('admin-total-users').innerText = userCount + '+';

    if (all.length === 0) {
        table.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No pickup requests in the system.</td></tr>`;
        return;
    }

    table.innerHTML = all.map(r => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">${r.id.substring(4, 12)}</td>
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">${r.userName}</div>
                <div class="text-xs text-gray-500">${r.phone}</div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-700 uppercase">${r.wasteType}</span>
                <span class="ml-2 text-sm text-gray-600">${r.estimatedKg} kg</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'completed' ? 'bg-green-100 text-green-800' :
                    r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                }">
                    ${r.status}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
                ${r.collectorName || '<span class="text-gray-400 italic">Unassigned</span>'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="deletePickupRequest('${r.id}')" class="text-red-500 hover:text-red-700 p-1" title="Delete Request">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

window.deletePickupRequest = function(id) {
    if (confirm('Are you sure you want to delete this pickup request?')) {
        const all = getPickupRequests().filter(r => r.id !== id);
        savePickupRequests(all);
        renderAdminDashboard();
    }
};

