// Admin Panel with Cloudinary Image Management
// Complete admin solution for Blockchainist Web

// Auth state management
let currentUser = null;

// Image management state
let selectedAvatarFile = null;
let currentAvatarUrl = null;
let currentCloudinaryId = null;

// Initialize admin functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeAdmin();
    }, 500);
});

function initializeAdmin() {
    // Check dependencies
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase not loaded');
        return;
    }

    if (typeof uploadToCloudinary === 'undefined') {
        console.error('❌ Cloudinary storage not loaded');
        return;
    }

    console.log('✅ Admin panel with Cloudinary initialized');

    // Initialize Cloudinary
    initCloudinary();

    // Setup Firebase auth
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showDashboard();
            loadApplications();
            loadMembers();
            loadPublications();
        } else {
            showLoginForm();
        }
    });

    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.getAttribute('data-tab'));
        });
    });

    // Member management
    const addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => showMemberModal());
    }

    const cancelMemberBtn = document.getElementById('cancel-member-btn');
    if (cancelMemberBtn) {
        cancelMemberBtn.addEventListener('click', hideMemberModal);
    }

    const memberForm = document.getElementById('member-form');
    if (memberForm) {
        memberForm.addEventListener('submit', handleMemberSubmit);
    }

    // Publication management
    const addPublicationBtn = document.getElementById('add-publication-btn');
    if (addPublicationBtn) {
        addPublicationBtn.addEventListener('click', () => showPublicationModal());
    }

    const cancelPublicationBtn = document.getElementById('cancel-publication-btn');
    if (cancelPublicationBtn) {
        cancelPublicationBtn.addEventListener('click', hidePublicationModal);
    }

    const publicationForm = document.getElementById('publication-form');
    if (publicationForm) {
        publicationForm.addEventListener('submit', handlePublicationSubmit);
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        errorDiv.classList.add('hidden');
    } catch (error) {
        errorDiv.textContent = 'Đăng nhập thất bại: ' + error.message;
        errorDiv.classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// UI Functions
function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-sky-500', 'text-sky-400');
        btn.classList.add('border-transparent', 'text-gray-300');
    });

    // Show target tab
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // Activate button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-sky-500', 'text-sky-400');
        activeBtn.classList.remove('border-transparent', 'text-gray-300');
    }
}

// Applications Management
async function loadApplications() {
    const loadingDiv = document.getElementById('applications-loading');
    const listDiv = document.getElementById('applications-list');
    
    try {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        const snapshot = await db.collection('applications').orderBy('timestamp', 'desc').get();
        
        loadingDiv?.classList.add('hidden');
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="text-gray-400 text-center py-8">Chưa có hồ sơ ứng tuyển nào</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString('vi-VN') : 'Không rõ';
            const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString('vi-VN') : '';
            const source = data.source || 'website';
            
            html += `
                <div class="bg-gray-700 p-6 rounded-lg border border-gray-600">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h4 class="text-lg font-semibold text-white">${data.name || 'Không rõ'}</h4>
                            <p class="text-sky-400">${data.email || 'Không rõ'}</p>
                            <span class="text-xs px-2 py-1 rounded-full bg-blue-600 text-white mt-1 inline-block">
                                ${source === 'website_contact_form' ? '🌐 Website Form' : '📧 Other'}
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-sm text-gray-400">${date}</span>
                            ${time ? `<br><span class="text-xs text-gray-500">${time}</span>` : ''}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-sm text-gray-400">Trường:</p>
                            <p class="text-white">${data.school || 'Không rõ'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-400">Điện thoại:</p>
                            <p class="text-white">${data.phone || 'Không rõ'}</p>
                        </div>
                    </div>
                    ${data.message ? `
                        <div class="mb-4">
                            <p class="text-sm text-gray-400">Thư ngỏ:</p>
                            <div class="bg-gray-600 p-3 rounded-lg mt-1">
                                <p class="text-white text-sm">${data.message}</p>
                            </div>
                        </div>
                    ` : ''}
                    <div class="flex justify-between items-center">
                        <div class="flex space-x-2">
                            <button onclick="deleteApplication('${doc.id}')" class="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-400 rounded hover:bg-red-400 hover:text-white transition-colors">
                                <i class="fas fa-trash mr-1"></i>Xóa
                            </button>
                            <button onclick="contactApplicant('${data.email}', '${data.name}')" class="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 border border-blue-400 rounded hover:bg-blue-400 hover:text-white transition-colors">
                                <i class="fas fa-envelope mr-1"></i>Liên hệ
                            </button>
                            ${data.status !== 'contacted' ? `
                                <button onclick="markAsContacted('${doc.id}')" class="text-green-400 hover:text-green-300 text-sm px-3 py-1 border border-green-400 rounded hover:bg-green-400 hover:text-white transition-colors">
                                    <i class="fas fa-check mr-1"></i>Đã liên hệ
                                </button>
                            ` : ''}
                        </div>
                        <span class="text-xs px-2 py-1 rounded ${data.status === 'pending' ? 'bg-yellow-600' : data.status === 'contacted' ? 'bg-green-600' : 'bg-gray-600'} text-white">
                            ${data.status === 'pending' ? '⏳ Chưa xử lý' : data.status === 'contacted' ? '✅ Đã liên hệ' : '📝 ' + (data.status || 'pending')}
                        </span>
                    </div>
                </div>
            `;
        });
        
        listDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading applications:', error);
        loadingDiv?.classList.add('hidden');
        listDiv.innerHTML = '<p class="text-red-400 text-center py-8">❌ Lỗi khi tải dữ liệu</p>';
    }
}

async function deleteApplication(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) return;
    
    try {
        await db.collection('applications').doc(id).delete();
        loadApplications();
        showNotification('Đã xóa hồ sơ thành công', 'success');
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('Lỗi khi xóa hồ sơ', 'error');
    }
}

function contactApplicant(email, name) {
    const subject = encodeURIComponent(`Phản hồi hồ sơ ứng tuyển - ${name}`);
    const body = encodeURIComponent(`Chào ${name},\n\nCảm ơn bạn đã quan tâm đến nhóm nghiên cứu.\n\nTrân trọng.`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

// Mark application as contacted
async function markAsContacted(id) {
    try {
        await db.collection('applications').doc(id).update({
            status: 'contacted',
            contactedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        loadApplications();
        showNotification('Đã đánh dấu là đã liên hệ', 'success');
    } catch (error) {
        console.error('Error updating application status:', error);
        showNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
}

// Members Management
async function loadMembers() {
    const listDiv = document.getElementById('members-list');
    
    try {
        const snapshot = await db.collection('members').orderBy('name').get();
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="text-gray-400 text-center py-8 col-span-3">Chưa có thành viên nào</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const avatarUrl = data.avatar || getPlaceholderUrl('avatar', 80);
            
            html += `
                <div class="bg-gray-700 p-6 rounded-lg border border-gray-600">
                    <div class="text-center">
                        <img src="${avatarUrl}" alt="${data.name}" 
                             class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                             onerror="this.src='${getPlaceholderUrl('avatar', 80)}'">
                        <h4 class="text-lg font-semibold text-white mb-2">${data.name}</h4>
                        <p class="text-sky-400 text-sm mb-2">${data.role}</p>
                        ${data.cloudinaryId ? '<span class="text-xs text-green-400">☁️ Cloudinary</span>' : ''}
                        <div class="flex justify-center space-x-2 mt-4">
                            <button onclick="editMember('${doc.id}')" class="text-sky-400 hover:text-sky-300 text-sm">Sửa</button>
                            <button onclick="deleteMember('${doc.id}')" class="text-red-400 hover:text-red-300 text-sm">Xóa</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        listDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading members:', error);
        listDiv.innerHTML = '<p class="text-red-400 text-center py-8 col-span-3">Lỗi khi tải dữ liệu</p>';
    }
}

// Edit member function
async function editMember(memberId) {
    try {
        const doc = await db.collection('members').doc(memberId).get();
        if (doc.exists) {
            const data = doc.data();
            showMemberModal(true, memberId, data);
        }
    } catch (error) {
        console.error('Error fetching member:', error);
        showNotification('Lỗi khi tải thông tin thành viên', 'error');
    }
}

async function deleteMember(memberId) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;
    
    try {
        await db.collection('members').doc(memberId).delete();
        loadMembers();
        showNotification('Đã xóa thành viên thành công', 'success');
    } catch (error) {
        console.error('Error deleting member:', error);
        showNotification('Lỗi khi xóa thành viên', 'error');
    }
}

function showMemberModal(editMode = false, memberId = null, memberData = {}) {
    const modal = document.getElementById('member-modal');
    const title = document.getElementById('member-modal-title');
    const form = document.getElementById('member-form');
    
    // Reset states
    selectedAvatarFile = null;
    currentAvatarUrl = memberData.avatar || null;
    currentCloudinaryId = memberData.cloudinaryId || null;
    
    // Fill form
    document.getElementById('member-name').value = memberData.name || '';
    document.getElementById('member-nickname').value = memberData.nickname || '';
    document.getElementById('member-role').value = memberData.role || '';
    document.getElementById('member-avatar-url').value = '';
    document.getElementById('member-google-scholar').value = memberData.googleScholar || '';
    document.getElementById('member-orcid').value = memberData.orcid || '';
    document.getElementById('member-bio').value = memberData.bio || '';
    document.getElementById('member-research-interests').value = 
        (memberData.researchInterests || []).join('\n');
    document.getElementById('member-education').value = 
        (memberData.education || []).join('\n');
    document.getElementById('member-achievements').value = 
        (memberData.achievements || []).join('\n');
    
    // Show current avatar
    if (editMode && memberData.avatar) {
        showCurrentAvatar(memberData.avatar, memberData.cloudinaryId);
    } else {
        hideCurrentAvatar();
    }
    
    hideAvatarPreview();
    
    // Set modal state
    title.textContent = editMode ? 'Sửa thành viên' : 'Thêm thành viên';
    form.setAttribute('data-member-id', memberId || '');
    form.setAttribute('data-edit-mode', editMode);
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Setup upload if not already done
    setupAvatarUpload();
}

function hideMemberModal() {
    const modal = document.getElementById('member-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Cloudinary Upload Functions
function setupAvatarUpload() {
    const fileInput = document.getElementById('avatar-file-input');
    const urlInput = document.getElementById('member-avatar-url');
    
    if (!fileInput || fileInput.hasEventListener) return;
    
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            selectedAvatarFile = file;
            showLocalPreview(file);
            
            try {
                await uploadAvatarToCloudinary(file);
                if (urlInput) urlInput.value = '';
            } catch (error) {
                showNotification(`Upload failed: ${error.message}`, 'error');
            }
        }
    });
    
    if (urlInput) {
        urlInput.addEventListener('input', function(e) {
            const url = e.target.value.trim();
            if (url) {
                selectedAvatarFile = null;
                currentCloudinaryId = null;
                fileInput.value = '';
                showUrlPreview(url);
            } else {
                hideAvatarPreview();
            }
        });
    }
    
    // Setup other buttons
    const testBtn = document.getElementById('test-preview-avatar');
    const removeBtn = document.getElementById('remove-avatar-btn');
    
    if (testBtn) {
        testBtn.addEventListener('click', async function() {
            const previewImage = document.getElementById('avatar-preview-image');
            if (previewImage?.src) {
                try {
                    const result = await testImageLoad(previewImage.src);
                    showNotification(`✅ Image loaded in ${result.loadTime}ms`, 'success');
                } catch (error) {
                    showNotification(`❌ Image test failed: ${error.message}`, 'error');
                }
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            selectedAvatarFile = null;
            currentCloudinaryId = null;
            currentAvatarUrl = null;
            fileInput.value = '';
            if (urlInput) urlInput.value = '';
            hideAvatarPreview();
        });
    }
    
    fileInput.hasEventListener = true;
}

async function uploadAvatarToCloudinary(file) {
    const progressInterval = showUploadProgress();
    
    try {
        const customName = generateUniqueFilename(file.name, 'member');
        const result = await uploadToCloudinary(file, 'avatars', customName);
        
        currentAvatarUrl = result.avatarUrl;
        currentCloudinaryId = result.publicId;
        
        showCloudinaryPreview(result);
        
        clearInterval(progressInterval);
        updateProgressBar(100, 'Upload successful!');
        setTimeout(hideUploadProgress, 2000);
        
        showNotification('✅ Avatar uploaded to Cloudinary!', 'success');
        
        return result;
        
    } catch (error) {
        clearInterval(progressInterval);
        hideUploadProgress();
        throw error;
    }
}

function showLocalPreview(file) {
    const previewSection = document.getElementById('avatar-preview');
    const previewImage = document.getElementById('avatar-preview-image');
    const fileInfo = document.getElementById('avatar-file-info');
    
    if (!previewSection || !previewImage || !fileInfo) return;
    
    const objectUrl = URL.createObjectURL(file);
    previewImage.src = objectUrl;
    
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    fileInfo.textContent = `📄 ${file.name} (${sizeInMB} MB, ${file.type})`;
    
    previewSection.classList.remove('hidden');
    previewImage.onload = () => URL.revokeObjectURL(objectUrl);
}

function showCloudinaryPreview(result) {
    const previewImage = document.getElementById('avatar-preview-image');
    const fileInfo = document.getElementById('avatar-file-info');
    const cloudinaryInfo = document.getElementById('avatar-cloudinary-info');
    
    if (previewImage && result.avatarUrl) {
        previewImage.src = result.avatarUrl;
    }
    
    if (fileInfo) {
        const sizeInKB = (result.size / 1024).toFixed(1);
        fileInfo.textContent = `☁️ ${result.format.toUpperCase()} ${result.width}x${result.height} (${sizeInKB} KB)`;
    }
    
    if (cloudinaryInfo) {
        cloudinaryInfo.innerHTML = `<strong>Cloudinary ID:</strong> ${result.publicId}`;
        cloudinaryInfo.classList.remove('hidden');
    }
}

function showUrlPreview(url) {
    const previewSection = document.getElementById('avatar-preview');
    const previewImage = document.getElementById('avatar-preview-image');
    const fileInfo = document.getElementById('avatar-file-info');
    
    if (!previewSection || !previewImage || !fileInfo) return;
    
    previewImage.src = url;
    fileInfo.textContent = `🔗 External URL: ${url.length > 50 ? url.substring(0, 50) + '...' : url}`;
    
    currentAvatarUrl = url;
    previewSection.classList.remove('hidden');
}

function showCurrentAvatar(avatarUrl, cloudinaryId = null) {
    const display = document.getElementById('current-avatar-display');
    const image = document.getElementById('current-avatar-image');
    const urlText = document.getElementById('current-avatar-url');
    
    if (avatarUrl && display && image && urlText) {
        image.src = avatarUrl;
        urlText.textContent = avatarUrl;
        display.classList.remove('hidden');
        
        currentAvatarUrl = avatarUrl;
        currentCloudinaryId = cloudinaryId;
    }
}

function hideCurrentAvatar() {
    const display = document.getElementById('current-avatar-display');
    if (display) {
        display.classList.add('hidden');
    }
}

function hideAvatarPreview() {
    const previewSection = document.getElementById('avatar-preview');
    if (previewSection) {
        previewSection.classList.add('hidden');
    }
}

function showUploadProgress() {
    const progressSection = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status');
    
    if (progressSection) progressSection.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (statusText) statusText.textContent = 'Uploading to Cloudinary...';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        
        if (progressBar) progressBar.style.width = progress + '%';
    }, 200);
    
    return interval;
}

function updateProgressBar(percentage, status) {
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status');
    
    if (progressBar) progressBar.style.width = percentage + '%';
    if (statusText) statusText.textContent = status;
}

function hideUploadProgress() {
    const progressSection = document.getElementById('upload-progress');
    if (progressSection) {
        progressSection.classList.add('hidden');
    }
}

// Handle member form submission
async function handleMemberSubmit(e) {
    e.preventDefault();
    
    const saveButton = e.target.querySelector('button[type="submit"]');
    const saveText = document.getElementById('save-member-text');
    const saveLoading = document.getElementById('save-member-loading');
    
    saveButton.disabled = true;
    saveText.classList.add('hidden');
    saveLoading.classList.remove('hidden');
    
    try {
        let avatarUrl = currentAvatarUrl;
        let cloudinaryId = currentCloudinaryId;
        
        // Handle new file upload
        if (selectedAvatarFile && !currentCloudinaryId) {
            const result = await uploadAvatarToCloudinary(selectedAvatarFile);
            avatarUrl = result.avatarUrl;
            cloudinaryId = result.publicId;
        } 
        // Use external URL
        else if (document.getElementById('member-avatar-url')?.value?.trim()) {
            avatarUrl = document.getElementById('member-avatar-url').value.trim();
            cloudinaryId = null;
        }
        
        const memberData = {
            name: document.getElementById('member-name').value,
            nickname: document.getElementById('member-nickname').value,
            role: document.getElementById('member-role').value,
            avatar: avatarUrl,
            cloudinaryId: cloudinaryId,
            googleScholar: document.getElementById('member-google-scholar').value,
            orcid: document.getElementById('member-orcid').value,
            bio: document.getElementById('member-bio').value,
            researchInterests: document.getElementById('member-research-interests').value
                .split('\n').filter(item => item.trim()).map(item => item.trim()),
            education: document.getElementById('member-education').value
                .split('\n').filter(item => item.trim()).map(item => item.trim()),
            achievements: document.getElementById('member-achievements').value
                .split('\n').filter(item => item.trim()).map(item => item.trim()),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const form = e.target;
        const memberId = form.getAttribute('data-member-id');
        const editMode = form.getAttribute('data-edit-mode') === 'true';
        
        if (editMode && memberId) {
            await db.collection('members').doc(memberId).update(memberData);
        } else {
            memberData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('members').add(memberData);
        }
        
        hideMemberModal();
        loadMembers();
        showNotification('✅ Member saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving member:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    } finally {
        saveButton.disabled = false;
        saveText.classList.remove('hidden');
        saveLoading.classList.add('hidden');
        hideUploadProgress();
    }
}

// Publications Management
async function loadPublications() {
    const listDiv = document.getElementById('publications-list');
    
    try {
        const snapshot = await db.collection('publications').orderBy('year', 'desc').get();
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p class="text-gray-400 text-center py-8">Chưa có công bố khoa học nào</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const imageUrl = data.imageUrl || data.cloudinaryId ? 
                (data.cloudinaryId ? getOptimizedUrl(data.cloudinaryId, 'publicationThumbnail') : data.imageUrl) :
                'https://via.placeholder.com/400x200/374151/FFFFFF?text=No+Image';
            
            html += `
                <div class="bg-gray-700 p-6 rounded-lg border border-gray-600">
                    <div class="flex gap-4">
                        <img src="${imageUrl}" alt="${data.title}" 
                             class="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                             onerror="this.src='https://via.placeholder.com/400x200/374151/FFFFFF?text=No+Image'">
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs px-2 py-1 rounded ${getPublicationTypeColor(data.type)} text-white">
                                    ${data.type || 'Paper'}
                                </span>
                                <span class="text-sm text-gray-400">${data.year || 'N/A'}</span>
                            </div>
                            <h4 class="text-lg font-semibold text-white mb-2">${data.title}</h4>
                            <p class="text-sky-400 text-sm mb-2">${data.authors}</p>
                            <p class="text-gray-300 text-sm mb-3"><em>${data.journal}</em></p>
                            <div class="flex justify-between items-center">
                                <div class="flex space-x-4 text-sm text-gray-400">
                                    ${data.citations ? `<span>${data.citations} citations</span>` : ''}
                                    ${data.impactFactor ? `<span>IF: ${data.impactFactor}</span>` : ''}
                                </div>
                                <div class="flex space-x-2">
                                    <button onclick="editPublication('${doc.id}')" class="text-sky-400 hover:text-sky-300 text-sm px-3 py-1 border border-sky-400 rounded hover:bg-sky-400 hover:text-white transition-colors">Sửa</button>
                                    <button onclick="deletePublication('${doc.id}')" class="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-400 rounded hover:bg-red-400 hover:text-white transition-colors">Xóa</button>
                                    ${data.url ? `<a href="${data.url}" target="_blank" class="text-green-400 hover:text-green-300 text-sm px-3 py-1 border border-green-400 rounded hover:bg-green-400 hover:text-white transition-colors">Xem</a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        listDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading publications:', error);
        listDiv.innerHTML = '<p class="text-red-400 text-center py-8">Lỗi khi tải dữ liệu</p>';
    }
}

// Edit publication function
async function editPublication(publicationId) {
    try {
        const doc = await db.collection('publications').doc(publicationId).get();
        if (doc.exists) {
            const data = doc.data();
            showPublicationModal(true, publicationId, data);
        }
    } catch (error) {
        console.error('Error fetching publication:', error);
        showNotification('Lỗi khi tải thông tin công bố', 'error');
    }
}

async function deletePublication(publicationId) {
    if (!confirm('Bạn có chắc chắn muốn xóa công bố này?')) return;
    
    try {
        await db.collection('publications').doc(publicationId).delete();
        loadPublications();
        showNotification('Đã xóa công bố thành công', 'success');
    } catch (error) {
        console.error('Error deleting publication:', error);
        showNotification('Lỗi khi xóa công bố', 'error');
    }
}

// Publication modal functions
function showPublicationModal(editMode = false, publicationId = null, publicationData = {}) {
    const modal = document.getElementById('publication-modal');
    const title = document.getElementById('publication-modal-title');
    const form = document.getElementById('publication-form');
    
    // Reset states
    selectedPublicationImageFile = null;
    currentPublicationImageUrl = publicationData.imageUrl || null;
    currentPublicationImageCloudinaryId = publicationData.cloudinaryId || null;
    
    // Fill form
    document.getElementById('publication-title').value = publicationData.title || '';
    document.getElementById('publication-authors').value = publicationData.authors || '';
    document.getElementById('publication-journal').value = publicationData.journal || '';
    document.getElementById('publication-type').value = publicationData.type || '';
    document.getElementById('publication-year').value = publicationData.year || new Date().getFullYear();
    document.getElementById('publication-url').value = publicationData.url || '';
    document.getElementById('publication-image-url').value = '';
    document.getElementById('publication-abstract').value = publicationData.abstract || '';
    document.getElementById('publication-doi').value = publicationData.doi || '';
    document.getElementById('publication-citations').value = publicationData.citations || '';
    document.getElementById('publication-impact-factor').value = publicationData.impactFactor || '';
    
    // Show current image
    if (editMode && (publicationData.imageUrl || publicationData.cloudinaryId)) {
        showCurrentPublicationImage(publicationData.imageUrl || (publicationData.cloudinaryId ? getOptimizedUrl(publicationData.cloudinaryId, 'publicationPreview') : null), publicationData.cloudinaryId);
    } else {
        hideCurrentPublicationImage();
    }
    
    hidePublicationImagePreview();
    
    // Set modal state
    title.textContent = editMode ? 'Sửa công bố khoa học' : 'Thêm công bố khoa học';
    form.setAttribute('data-publication-id', publicationId || '');
    form.setAttribute('data-edit-mode', editMode);
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Setup image upload
    setupPublicationImageUpload();
}

function hidePublicationModal() {
    const modal = document.getElementById('publication-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Publication image upload variables
let selectedPublicationImageFile = null;
let currentPublicationImageUrl = null;
let currentPublicationImageCloudinaryId = null;

// Setup publication image upload
function setupPublicationImageUpload() {
    const fileInput = document.getElementById('publication-image-input');
    const urlInput = document.getElementById('publication-image-url');
    
    if (!fileInput || fileInput.hasPublicationEventListener) return;
    
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            selectedPublicationImageFile = file;
            showLocalPublicationImagePreview(file);
            
            try {
                await uploadPublicationImageToCloudinary(file);
                if (urlInput) urlInput.value = '';
            } catch (error) {
                showNotification(`Upload failed: ${error.message}`, 'error');
            }
        }
    });
    
    if (urlInput) {
        urlInput.addEventListener('input', function(e) {
            const url = e.target.value.trim();
            if (url) {
                selectedPublicationImageFile = null;
                currentPublicationImageCloudinaryId = null;
                fileInput.value = '';
                showPublicationImageUrlPreview(url);
            } else {
                hidePublicationImagePreview();
            }
        });
    }
    
    const removeBtn = document.getElementById('remove-publication-image-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            selectedPublicationImageFile = null;
            currentPublicationImageCloudinaryId = null;
            currentPublicationImageUrl = null;
            fileInput.value = '';
            if (urlInput) urlInput.value = '';
            hidePublicationImagePreview();
        });
    }
    
    fileInput.hasPublicationEventListener = true;
}

// Publication image upload functions
async function uploadPublicationImageToCloudinary(file) {
    const progressInterval = showPublicationUploadProgress();
    
    try {
        const customName = generateUniqueFilename(file.name, 'publication');
        const result = await uploadToCloudinary(file, 'publications', customName);
        
        currentPublicationImageUrl = result.avatarUrl; // Using same field name from cloudinary response
        currentPublicationImageCloudinaryId = result.publicId;
        
        showCloudinaryPublicationImagePreview(result);
        
        clearInterval(progressInterval);
        updatePublicationProgressBar(100, 'Upload successful!');
        setTimeout(hidePublicationUploadProgress, 2000);
        
        showNotification('✅ Image uploaded to Cloudinary!', 'success');
        
        return result;
        
    } catch (error) {
        clearInterval(progressInterval);
        hidePublicationUploadProgress();
        throw error;
    }
}

function showLocalPublicationImagePreview(file) {
    const previewSection = document.getElementById('publication-image-preview');
    const previewImage = document.getElementById('publication-image-preview-img');
    const fileInfo = document.getElementById('publication-image-info');
    
    if (!previewSection || !previewImage || !fileInfo) return;
    
    const objectUrl = URL.createObjectURL(file);
    previewImage.src = objectUrl;
    
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    fileInfo.textContent = `📄 ${file.name} (${sizeInMB} MB, ${file.type})`;
    
    previewSection.classList.remove('hidden');
    previewImage.onload = () => URL.revokeObjectURL(objectUrl);
}

function showCloudinaryPublicationImagePreview(result) {
    const previewImage = document.getElementById('publication-image-preview-img');
    const fileInfo = document.getElementById('publication-image-info');
    const cloudinaryInfo = document.getElementById('publication-image-cloudinary-info');
    
    if (previewImage && result.avatarUrl) {
        previewImage.src = result.avatarUrl;
    }
    
    if (fileInfo) {
        const sizeInKB = (result.size / 1024).toFixed(1);
        fileInfo.textContent = `☁️ ${result.format.toUpperCase()} ${result.width}x${result.height} (${sizeInKB} KB)`;
    }
    
    if (cloudinaryInfo) {
        cloudinaryInfo.innerHTML = `<strong>Cloudinary ID:</strong> ${result.publicId}`;
        cloudinaryInfo.classList.remove('hidden');
    }
}

function showPublicationImageUrlPreview(url) {
    const previewSection = document.getElementById('publication-image-preview');
    const previewImage = document.getElementById('publication-image-preview-img');
    const fileInfo = document.getElementById('publication-image-info');
    
    if (!previewSection || !previewImage || !fileInfo) return;
    
    previewImage.src = url;
    fileInfo.textContent = `🔗 External URL: ${url.length > 50 ? url.substring(0, 50) + '...' : url}`;
    
    currentPublicationImageUrl = url;
    previewSection.classList.remove('hidden');
}

function showCurrentPublicationImage(imageUrl, cloudinaryId = null) {
    const display = document.getElementById('current-publication-image-display');
    const image = document.getElementById('current-publication-image');
    const urlText = document.getElementById('current-publication-image-url');
    
    if (imageUrl && display && image && urlText) {
        image.src = imageUrl;
        urlText.textContent = imageUrl;
        display.classList.remove('hidden');
        
        currentPublicationImageUrl = imageUrl;
        currentPublicationImageCloudinaryId = cloudinaryId;
    }
}

function hideCurrentPublicationImage() {
    const display = document.getElementById('current-publication-image-display');
    if (display) {
        display.classList.add('hidden');
    }
}

function hidePublicationImagePreview() {
    const previewSection = document.getElementById('publication-image-preview');
    if (previewSection) {
        previewSection.classList.add('hidden');
    }
}

function showPublicationUploadProgress() {
    const progressSection = document.getElementById('publication-upload-progress');
    const progressBar = document.getElementById('publication-upload-progress-bar');
    const statusText = document.getElementById('publication-upload-status');
    
    if (progressSection) progressSection.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (statusText) statusText.textContent = 'Uploading to Cloudinary...';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        
        if (progressBar) progressBar.style.width = progress + '%';
    }, 200);
    
    return interval;
}

function updatePublicationProgressBar(percentage, status) {
    const progressBar = document.getElementById('publication-upload-progress-bar');
    const statusText = document.getElementById('publication-upload-status');
    
    if (progressBar) progressBar.style.width = percentage + '%';
    if (statusText) statusText.textContent = status;
}

function hidePublicationUploadProgress() {
    const progressSection = document.getElementById('publication-upload-progress');
    if (progressSection) {
        progressSection.classList.add('hidden');
    }
}

// Handle publication form submission
async function handlePublicationSubmit(e) {
    e.preventDefault();
    
    const saveButton = e.target.querySelector('button[type="submit"]');
    const saveText = document.getElementById('save-publication-text');
    const saveLoading = document.getElementById('save-publication-loading');
    
    saveButton.disabled = true;
    saveText.classList.add('hidden');
    saveLoading.classList.remove('hidden');
    
    try {
        let imageUrl = currentPublicationImageUrl;
        let cloudinaryId = currentPublicationImageCloudinaryId;
        
        // Handle new file upload
        if (selectedPublicationImageFile && !currentPublicationImageCloudinaryId) {
            const result = await uploadPublicationImageToCloudinary(selectedPublicationImageFile);
            imageUrl = result.avatarUrl;
            cloudinaryId = result.publicId;
        } 
        // Use external URL
        else if (document.getElementById('publication-image-url')?.value?.trim()) {
            imageUrl = document.getElementById('publication-image-url').value.trim();
            cloudinaryId = null;
        }
        
        const publicationData = {
            title: document.getElementById('publication-title').value.trim(),
            authors: document.getElementById('publication-authors').value.trim(),
            journal: document.getElementById('publication-journal').value.trim(),
            type: document.getElementById('publication-type').value,
            year: parseInt(document.getElementById('publication-year').value) || new Date().getFullYear(),
            url: document.getElementById('publication-url').value.trim(),
            imageUrl: imageUrl,
            cloudinaryId: cloudinaryId,
            abstract: document.getElementById('publication-abstract').value.trim(),
            doi: document.getElementById('publication-doi').value.trim(),
            citations: parseInt(document.getElementById('publication-citations').value) || null,
            impactFactor: document.getElementById('publication-impact-factor').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const form = e.target;
        const publicationId = form.getAttribute('data-publication-id');
        const editMode = form.getAttribute('data-edit-mode') === 'true';
        
        if (editMode && publicationId) {
            await db.collection('publications').doc(publicationId).update(publicationData);
        } else {
            publicationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('publications').add(publicationData);
        }
        
        hidePublicationModal();
        loadPublications();
        showNotification('✅ Publication saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving publication:', error);
        showNotification(`❌ Error: ${error.message}`, 'error');
    } finally {
        saveButton.disabled = false;
        saveText.classList.remove('hidden');
        saveLoading.classList.add('hidden');
        hidePublicationUploadProgress();
    }
}

// Helper function to get publication type color (already exists in main.js, duplicate here for admin)
function getPublicationTypeColor(type) {
    switch (type) {
        case 'Q1':
            return 'bg-red-600';
        case 'Q2':
            return 'bg-orange-600';
        case 'Q3':
            return 'bg-yellow-600';
        case 'Q4':
            return 'bg-green-600';
        case 'Conference A':
            return 'bg-blue-600';
        case 'Conference B':
            return 'bg-indigo-600';
        case 'Conference C':
            return 'bg-purple-600';
        case 'Book Chapter':
            return 'bg-pink-600';
        case 'Patent':
            return 'bg-teal-600';
        default:
            return 'bg-gray-600';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md`;
    notification.className += type === 'success' ? ' bg-green-600' : 
                             type === 'error' ? ' bg-red-600' : ' bg-blue-600';
    notification.innerHTML = `<p class="text-white">${message}</p>`;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

console.log('🚀 Admin Panel with Cloudinary Ready');