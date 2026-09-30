// Cloudinary Storage Solution - No Firebase Storage needed
// Storage functions will be loaded from cloudinary-storage.js

// Wait for DOM and Firebase to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure Firebase and Cloudinary storage are loaded
    setTimeout(() => {
        initializeWebsite();
    }, 500);
});

function initializeWebsite() {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase not loaded');
        showNotification('Lỗi: Firebase chưa được tải', 'error');
        return;
    }

    // Check if Cloudinary storage solution is loaded
    if (typeof uploadToCloudinary === 'undefined' || typeof getOptimizedUrl === 'undefined') {
        console.error('❌ Cloudinary storage not loaded');
        showNotification('Lỗi: Cloudinary storage chưa được tải', 'error');
        return;
    }

    console.log('✅ Website with Cloudinary initialized successfully');
    
    // Initialize Cloudinary
    if (typeof initCloudinary !== 'undefined') {
        initCloudinary();
    }
    
    loadMembers();
    loadPublications();
    setupContactForm();
    setupSmoothScrolling();
    setupProfileModal();
    setupPublicationModal();
}

// Load members from Firebase với click handler
async function loadMembers() {
    try {
        const snapshot = await db.collection('members').orderBy('name').get();
        const teamContainer = document.querySelector('#team .grid');
        
        if (teamContainer && !snapshot.empty) {
            let html = '';
            snapshot.forEach(doc => {
                const member = doc.data();
                const memberId = doc.id;
                
                // Use Cloudinary optimized avatar or fallback
                let avatarUrl;
                if (member.cloudinaryId) {
                    // Use Cloudinary with optimization
                    avatarUrl = getOptimizedUrl(member.cloudinaryId, 'avatar');
                } else if (member.avatar) {
                    // Use direct URL
                    avatarUrl = member.avatar;
                } else {
                    // Use placeholder
                    avatarUrl = getPlaceholderUrl('avatar', 96);
                }
                
                html += `
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 text-center hover:border-sky-500 transition-colors cursor-pointer member-card" 
                         data-member-id="${memberId}" data-aos="fade-up">
                        <div class="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700">
                            <img src="${avatarUrl}" 
                                 alt="${member.name || 'Thành viên'}" 
                                 class="w-full h-full object-cover"
                                 loading="lazy"
                                 onerror="this.src='${getPlaceholderUrl('avatar', 96)}'">
                        </div>
                        <h4 class="text-lg font-bold text-white mb-2">${member.name || 'Không rõ tên'}</h4>
                        <p class="text-sky-400 mb-2">${member.role || 'Thành viên'}</p>
                        <p class="text-xs text-gray-400 hover:text-sky-300 transition-colors">Click để xem profile →</p>
                    </div>
                `;
            });
            teamContainer.innerHTML = html;
            
            // Add click handlers to member cards
            document.querySelectorAll('.member-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const memberId = e.currentTarget.getAttribute('data-member-id');
                    showMemberProfile(memberId);
                });
            });
            
            // Re-initialize AOS for new elements
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Setup profile modal
function setupProfileModal() {
    const modal = document.getElementById('member-profile-modal');
    const closeBtn = document.getElementById('close-profile-modal');
    
    // Close modal handlers
    closeBtn?.addEventListener('click', hideProfileModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideProfileModal();
        }
    });
    
    // Escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideProfileModal();
        }
    });
    
    // Setup profile tabs
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            switchProfileTab(targetTab);
        });
    });
}

// Show member profile modal
async function showMemberProfile(memberId) {
    const modal = document.getElementById('member-profile-modal');
    const loadingDiv = document.getElementById('profile-loading');
    const contentDiv = document.getElementById('profile-content');
    
    // Show modal and loading state
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    loadingDiv.classList.remove('hidden');
    contentDiv.classList.add('hidden');
    
    try {
        // Load member data
        const memberDoc = await db.collection('members').doc(memberId).get();
        if (!memberDoc.exists) {
            throw new Error('Member not found');
        }
        
        const memberData = memberDoc.data();
        
        // Load member's publications
        const publicationsSnapshot = await db.collection('publications')
            .where('authorIds', 'array-contains', createSlugFromName(memberData.nickname || memberData.name))
            .orderBy('year', 'desc')
            .get();
        
        const publications = publicationsSnapshot.docs.map(doc => doc.data());
        
        // Populate profile data
        populateProfileModal(memberData, publications);
        
        // Show content, hide loading
        loadingDiv.classList.add('hidden');
        contentDiv.classList.remove('hidden');
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Error loading member profile:', error);
        showNotification('Lỗi khi tải thông tin thành viên', 'error');
        hideProfileModal();
    }
}

// Hide profile modal
function hideProfileModal() {
    const modal = document.getElementById('member-profile-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    // Reset to first tab
    switchProfileTab('research');
}

// Populate profile modal with member data
function populateProfileModal(memberData, publications) {
    // Basic info with Cloudinary optimization
    let avatarUrl;
    if (memberData.cloudinaryId) {
        // Use Cloudinary optimized avatar
        avatarUrl = getOptimizedUrl(memberData.cloudinaryId, 'avatarLarge');
    } else if (memberData.avatar) {
        // Use direct URL
        avatarUrl = memberData.avatar;
    } else {
        // Use placeholder
        avatarUrl = getPlaceholderUrl('avatar', 300);
    }
    
    document.getElementById('profile-avatar').src = avatarUrl;
    document.getElementById('profile-avatar').alt = memberData.name || 'Thành viên';
    document.getElementById('profile-name').textContent = memberData.name || 'Không rõ tên';
    document.getElementById('profile-nickname').textContent = memberData.nickname || '';
    document.getElementById('profile-role').textContent = memberData.role || 'Thành viên';
    document.getElementById('profile-bio').textContent = memberData.bio || 'Chưa có thông tin tiểu sử.';
    
    // Links
    const googleScholarLink = document.getElementById('profile-google-scholar');
    const orcidLink = document.getElementById('profile-orcid');
    
    if (memberData.googleScholar) {
        googleScholarLink.href = memberData.googleScholar;
        googleScholarLink.style.display = 'inline-block';
    } else {
        googleScholarLink.style.display = 'none';
    }
    
    if (memberData.orcid) {
        orcidLink.href = memberData.orcid;
        orcidLink.style.display = 'inline-block';
    } else {
        orcidLink.style.display = 'none';
    }
    
    // Research interests
    const researchContainer = document.getElementById('profile-research-interests');
    if (memberData.researchInterests && memberData.researchInterests.length > 0) {
        researchContainer.innerHTML = memberData.researchInterests.map(interest => 
            `<span class="bg-sky-600 text-white px-3 py-1 rounded-full text-sm">${interest}</span>`
        ).join('');
    } else {
        researchContainer.innerHTML = '<p class="text-gray-400">Chưa có thông tin hướng nghiên cứu.</p>';
    }
    
    // Publications
    const publicationsContainer = document.getElementById('profile-publications-list');
    const publicationsCount = document.getElementById('profile-publications-count');
    
    if (publications.length > 0) {
        publicationsCount.textContent = `${publications.length} công bố`;
        publicationsContainer.innerHTML = publications.map(pub => `
            <div class="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs px-2 py-1 rounded ${getPublicationTypeColor(pub.type)} text-white">
                        ${pub.type || 'Paper'}
                    </span>
                    <div class="flex items-center text-sm text-gray-400">
                        <i data-lucide="calendar" class="w-4 h-4 mr-1"></i>
                        ${pub.year || 'N/A'}
                    </div>
                </div>
                <h5 class="text-lg font-semibold text-white mb-2">${pub.title}</h5>
                <p class="text-sky-400 text-sm mb-2">${pub.authors}</p>
                <p class="text-gray-300 text-sm mb-3"><em>${pub.journal}</em></p>
                ${pub.abstract ? `
                    <div class="mb-3">
                        <button class="toggle-abstract text-sky-400 hover:text-sky-300 text-sm">Xem Abstract</button>
                        <div class="abstract-content hidden mt-2">
                            <p class="text-gray-400 text-sm p-3 bg-gray-800 rounded-lg">${pub.abstract}</p>
                        </div>
                    </div>
                ` : ''}
                <div class="flex justify-between items-center">
                    <div class="flex space-x-4 text-sm text-gray-400">
                        ${pub.citations ? `<span><i data-lucide="quote" class="w-4 h-4 inline mr-1"></i>${pub.citations} citations</span>` : ''}
                        ${pub.doi ? `<span>DOI: ${pub.doi}</span>` : ''}
                    </div>
                    ${pub.url ? `
                        <a href="${pub.url}" target="_blank" class="text-sky-400 hover:text-sky-300 text-sm">
                            <i data-lucide="external-link" class="w-4 h-4 inline mr-1"></i>Xem bài báo
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Setup abstract toggles
        setTimeout(() => {
            publicationsContainer.querySelectorAll('.toggle-abstract').forEach(button => {
                button.addEventListener('click', () => {
                    const content = button.nextElementSibling;
                    const isHidden = content.classList.contains('hidden');
                    
                    if (isHidden) {
                        content.classList.remove('hidden');
                        button.textContent = 'Ẩn Abstract';
                    } else {
                        content.classList.add('hidden');
                        button.textContent = 'Xem Abstract';
                    }
                });
            });
        }, 100);
        
    } else {
        publicationsCount.textContent = '0 công bố';
        publicationsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Chưa có công bố khoa học.</p>';
    }
    
    // Education
    const educationContainer = document.getElementById('profile-education');
    if (memberData.education && memberData.education.length > 0) {
        educationContainer.innerHTML = memberData.education.map(edu => `
            <div class="flex items-start">
                <i data-lucide="graduation-cap" class="w-5 h-5 text-sky-400 mr-3 mt-1 flex-shrink-0"></i>
                <p class="text-gray-300">${edu}</p>
            </div>
        `).join('');
    } else {
        educationContainer.innerHTML = '<p class="text-gray-400">Chưa có thông tin học vấn.</p>';
    }
    
    // Achievements
    const achievementsContainer = document.getElementById('profile-achievements');
    if (memberData.achievements && memberData.achievements.length > 0) {
        achievementsContainer.innerHTML = memberData.achievements.map(achievement => `
            <div class="flex items-start">
                <i data-lucide="award" class="w-5 h-5 text-yellow-400 mr-3 mt-1 flex-shrink-0"></i>
                <p class="text-gray-300">${achievement}</p>
            </div>
        `).join('');
    } else {
        achievementsContainer.innerHTML = '<p class="text-gray-400">Chưa có thông tin thành tích.</p>';
    }
}

// Switch profile tabs
function switchProfileTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.profile-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-sky-500', 'text-sky-400');
        btn.classList.add('border-transparent', 'text-gray-300');
    });
    
    // Show target tab content
    const targetTab = document.getElementById(`profile-tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Add active class to clicked tab button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-sky-500', 'text-sky-400');
        activeBtn.classList.remove('border-transparent', 'text-gray-300');
    }
}

// Helper function to get publication type color
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
        case 'Journal Article':
            return 'bg-blue-600';
        case 'Conference Paper':
            return 'bg-green-600';
        case 'Magazine Article':
            return 'bg-orange-600';
        default:
            return 'bg-gray-600';
    }
}

// Helper function to create slug from name
function createSlugFromName(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-')        // Replace spaces with hyphens
        .replace(/-+/g, '-');        // Replace multiple hyphens with single
}

// Load publications from Firebase - Updated with error handling
async function loadPublications() {
    try {
        const snapshot = await db.collection('publications').orderBy('year', 'desc').get();
        const publicationsContainer = document.querySelector('#publications-grid');
        
        if (publicationsContainer && !snapshot.empty) {
            let html = '';
            snapshot.forEach(doc => {
                const pub = { id: doc.id, ...doc.data() };
                
                // Get image URL - prioritize Cloudinary, fallback to direct URL, then placeholder
                let imageUrl;
                if (pub.cloudinaryId) {
                    imageUrl = getOptimizedUrl(pub.cloudinaryId, 'publicationCard');
                } else if (pub.imageUrl) {
                    imageUrl = pub.imageUrl;
                } else {
                    imageUrl = getPlaceholderUrl('publication', 300);
                }
                
                html += `
                    <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden hover:border-sky-500 hover:scale-105 transition-all duration-300 cursor-pointer publication-card" 
                         data-publication='${JSON.stringify(pub).replace(/'/g, '&apos;')}' data-aos="fade-up">
                        <!-- Image Section -->
                        <div class="relative">
                            <img src="${imageUrl}" 
                                 alt="${pub.title || 'Publication'}" 
                                 class="w-full h-40 object-cover"
                                 loading="lazy"
                                 onerror="this.src='${getPlaceholderUrl('publication', 300)}'">
                            <div class="absolute top-2 right-2">
                                <span class="text-xs px-2 py-1 rounded ${getPublicationTypeColor(pub.type)} text-white font-medium">
                                    ${pub.type || 'Paper'}
                                </span>
                            </div>
                            ${pub.impactFactor ? `
                                <div class="absolute bottom-2 left-2">
                                    <span class="text-xs px-2 py-1 bg-yellow-600 text-white rounded">IF: ${pub.impactFactor}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Content Section -->
                        <div class="p-4">
                            <h3 class="text-sm font-bold text-white mb-2 line-clamp-2 leading-tight">
                                ${pub.title || 'Untitled'}
                            </h3>
                            
                            <p class="text-xs text-gray-300 mb-2 line-clamp-1">
                                ${pub.authors || 'Unknown authors'}
                            </p>
                            
                            <div class="flex justify-between items-center text-xs text-gray-400">
                                <span>${pub.year || 'N/A'}</span>
                                ${pub.url ? `<i data-lucide="external-link" class="w-4 h-4 text-sky-400"></i>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            publicationsContainer.innerHTML = html;
            
            // Setup publication card click handlers
            setupPublicationCardClickHandlers();
            
            // Re-initialize AOS and Lucide icons
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            // Handle empty state
            const publicationsContainer = document.querySelector('#publications-grid');
            if (publicationsContainer) {
                publicationsContainer.innerHTML = `
                    <div class="text-center py-8 col-span-full">
                        <p class="text-gray-400">Chưa có công bố khoa học nào.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading publications:', error);
        const publicationsContainer = document.querySelector('#publications-grid');
        if (publicationsContainer) {
            if (error.code === 'permission-denied') {
                publicationsContainer.innerHTML = `
                    <div class="text-center py-8 col-span-full">
                        <p class="text-red-400">❌ Không thể tải danh sách công bố. Đang cập nhật quyền truy cập...</p>
                    </div>
                `;
            } else {
                publicationsContainer.innerHTML = `
                    <div class="text-center py-8 col-span-full">
                        <p class="text-red-400">❌ Lỗi khi tải công bố: ${error.message}</p>
                    </div>
                `;
            }
        }
    }
}

// Setup publication card click handlers
function setupPublicationCardClickHandlers() {
    document.querySelectorAll('.publication-card').forEach(card => {
        card.addEventListener('click', function(e) {
            const publicationData = this.getAttribute('data-publication');
            if (publicationData) {
                try {
                    const pub = JSON.parse(publicationData);
                    showPublicationModal(pub);
                } catch (error) {
                    console.error('Error parsing publication data:', error);
                }
            }
        });
    });
}

// Show publication modal with detailed information
function showPublicationModal(pub) {
    const modal = document.getElementById('publication-modal');
    const modalContent = document.getElementById('modal-content');
    
    if (!modal || !modalContent) return;
    
    // Get image URL
    let imageUrl;
    if (pub.cloudinaryId) {
        imageUrl = getOptimizedUrl(pub.cloudinaryId, 'publicationDetail');
    } else if (pub.imageUrl) {
        imageUrl = pub.imageUrl;
    } else {
        imageUrl = getPlaceholderUrl('publication', 600);
    }
    
    modalContent.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
            <!-- Image -->
            <div class="md:w-1/3">
                <img src="${imageUrl}" 
                     alt="${pub.title || 'Publication'}" 
                     class="w-full h-64 md:h-80 object-cover rounded-lg"
                     onerror="this.src='${getPlaceholderUrl('publication', 600)}'">
            </div>
            
            <!-- Content -->
            <div class="md:w-2/3">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-sm px-3 py-1 rounded ${getPublicationTypeColor(pub.type)} text-white font-medium">
                        ${pub.type || 'Paper'}
                    </span>
                    <div class="text-right">
                        <span class="text-gray-400">${pub.year || 'N/A'}</span>
                        ${pub.impactFactor ? `<br><span class="text-yellow-400 text-sm">Impact Factor: ${pub.impactFactor}</span>` : ''}
                    </div>
                </div>
                
                <h3 class="text-2xl font-bold text-white mb-4">${pub.title || 'Untitled'}</h3>
                
                <div class="space-y-3 text-gray-300">
                    <p><strong class="text-white">Tác giả:</strong> ${pub.authors || 'Unknown authors'}</p>
                    
                    ${pub.journal ? `<p><strong class="text-white">Tạp chí:</strong> <span class="text-sky-400">${pub.journal}</span></p>` : ''}
                    
                    ${pub.doi ? `<p><strong class="text-white">DOI:</strong> <code class="text-green-400 bg-gray-800 px-2 py-1 rounded text-sm">${pub.doi}</code></p>` : ''}
                    
                    ${pub.citations ? `<p><strong class="text-white">Trích dẫn:</strong> <span class="text-yellow-400">${pub.citations}</span></p>` : ''}
                    
                    ${pub.abstract ? `
                        <div>
                            <strong class="text-white">Abstract:</strong>
                            <p class="mt-2 text-gray-300 text-sm leading-relaxed p-4 bg-gray-800 rounded-lg">${pub.abstract}</p>
                        </div>
                    ` : ''}
                </div>
                
                ${pub.url ? `
                    <div class="mt-6">
                        <a href="${pub.url}" target="_blank" 
                           class="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors">
                            <i data-lucide="external-link" class="w-4 h-4 mr-2"></i>
                            Xem bài báo đầy đủ
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Setup abstract toggle functionality
// Setup contact form
function setupContactForm() {
    const contactForm = document.querySelector('#contact form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
        
        // Add real-time validation
        setupFormValidation(contactForm);
    }
}

// Setup form validation
function setupFormValidation(form) {
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const phoneInput = form.querySelector('#phone');
    
    // Name validation
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            validateName(this);
        });
    }
    
    // Email validation  
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmail(this);
        });
    }
    
    // Phone validation
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            validatePhone(this);
        });
    }
}

// Validation functions
function validateName(input) {
    const value = input.value.trim();
    if (value.length < 2) {
        showFieldError(input, 'Tên phải có ít nhất 2 ký tự');
        return false;
    }
    clearFieldError(input);
    return true;
}

function validateEmail(input) {
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        showFieldError(input, 'Email không hợp lệ');
        return false;
    }
    clearFieldError(input);
    return true;
}

function validatePhone(input) {
    const value = input.value.trim();
    if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
        showFieldError(input, 'Số điện thoại không hợp lệ');
        return false;
    }
    clearFieldError(input);
    return true;
}

function showFieldError(input, message) {
    // Remove existing error
    clearFieldError(input);
    
    // Add error styling
    input.classList.add('border-red-500');
    input.classList.remove('border-gray-700');
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-400 text-xs mt-1';
    errorDiv.textContent = message;
    
    // Insert after input
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
}

function clearFieldError(input) {
    // Remove error styling
    input.classList.remove('border-red-500');
    input.classList.add('border-gray-700');
    
    // Remove error message
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Handle contact form submission
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Validate form before submission
    const nameValid = validateName(form.querySelector('#name'));
    const emailValid = validateEmail(form.querySelector('#email'));
    const phoneValid = validatePhone(form.querySelector('#phone'));
    
    if (!nameValid || !emailValid || !phoneValid) {
        showNotification('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
        return;
    }
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>';
    
    try {
        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            school: document.getElementById('school').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            message: document.getElementById('message').value.trim(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            source: 'website_contact_form'
        };
        
        // Save to Firestore
        const docRef = await db.collection('applications').add(formData);
        
        console.log('Application submitted with ID:', docRef.id);
        
        // Show success message
        showNotification('🎉 Thông tin của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24-48h. Hãy kiểm tra email (kể cả thư mục spam) để nhận phản hồi từ chúng tôi.', 'success');
        
        // Reset form and clear any errors
        form.reset();
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('input').forEach(input => {
            input.classList.remove('border-red-500');
            input.classList.add('border-gray-700');
        });
        
    } catch (error) {
        console.error('Error submitting application:', error);
        let errorMessage = 'Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại sau.';
        
        // Handle specific error cases
        if (error.code === 'permission-denied') {
            errorMessage = 'Lỗi quyền truy cập. Vui lòng thử lại sau.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 transform translate-x-full`;
    
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    notification.classList.add(bgColor);
    
    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 mt-1">
                ${type === 'success' ? 
                    '<i data-lucide="check-circle" class="w-5 h-5 text-white"></i>' :
                    type === 'error' ?
                    '<i data-lucide="x-circle" class="w-5 h-5 text-white"></i>' :
                    '<i data-lucide="info" class="w-5 h-5 text-white"></i>'
                }
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-white leading-relaxed">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200 flex-shrink-0 mt-1">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Initialize Lucide icons for notification
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after longer time for success messages
    const autoRemoveTime = type === 'success' ? 8000 : 5000;
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, autoRemoveTime);
}

// Utility function to format date
function formatDate(date) {
    if (!date) return 'Không rõ';
    
    if (typeof date === 'object' && date.toDate) {
        date = date.toDate();
    }
    
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Fallback functions for Cloudinary if not loaded yet
function safeGetOptimizedUrl(publicId, transform) {
    if (typeof getOptimizedUrl !== 'undefined') {
        return getOptimizedUrl(publicId, transform);
    }
    // Fallback: return publicId as-is if it's a URL
    if (publicId && publicId.startsWith('http')) {
        return publicId;
    }
    return null;
}

function safeGetPlaceholderUrl(type, size) {
    if (typeof getPlaceholderUrl !== 'undefined') {
        return getPlaceholderUrl(type, size);
    }
    // Fallback placeholder
    const text = type === 'avatar' ? 'A' : type === 'publication' ? 'PUB' : 'IMG';
    const dimensions = type === 'publication' ? '400x200' : `${size}x${size}`;
    return `https://via.placeholder.com/${dimensions}/374151/FFFFFF?text=${text}`;
}

// Setup publication modal event listeners
function setupPublicationModal() {
    const modal = document.getElementById('publication-modal');
    const closeButton = document.getElementById('close-modal');
    
    if (!modal || !closeButton) return;
    
    // Close modal when clicking close button
    closeButton.addEventListener('click', closePublicationModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePublicationModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closePublicationModal();
        }
    });
}

// Close publication modal
function closePublicationModal() {
    const modal = document.getElementById('publication-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

console.log('✅ Main.js with Cloudinary support loaded');
// Export functions for global access
window.showNotification = showNotification;
window.formatDate = formatDate;
