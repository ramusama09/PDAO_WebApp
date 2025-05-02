// Auth service for handling authentication throughout the application
class AuthService {
    constructor() {
        // Initialize Firebase in case it's not already initialized
        if (!window.firebase) {
            console.error('Firebase is not loaded. Make sure firebase-init.js is included before auth-service.js');
            return;
        }
        
        this.auth = firebase.auth();
        this.database = firebase.database();
        this.currentUser = null;
        
        // Set up auth state change listener
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }
    
    // Handle authentication state changes
    handleAuthStateChange(user) {
        const authStatusElement = document.getElementById('auth-status');
        const authLinksElement = document.getElementById('auth-links');
        
        if (!authStatusElement || !authLinksElement) {
            return; // Elements don't exist on this page
        }
        
        if (user) {
            // User is signed in
            
            authLinksElement.innerHTML = `
             <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-person-circle"></i> <span id="nav-user-name">Account</span>
                    </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item" href="/Home/Profile"><i class="bi bi-person-gear me-2"></i>My Profile</a></li>
                    <li><a class="dropdown-item" asp-area="" href="/Privacy"><i class="bi bi-shield-lock"></i> Privacy</a></li>
                    <li><a class="dropdown-item" href="#" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
             </li>
            `;
            
            // Add event listener for sign out button
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.signOut();
                });
            }
            
            // Update user's last login time in the database
            if (user.uid) {
                this.database.ref(`users/${user.uid}/lastLogin`).set(new Date().toISOString());
            }
        } else {
            // No user is signed in
            authStatusElement.innerHTML = '';
            
            authLinksElement.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link text-dark" href="/Identity/Login">Sign In</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark" href="/Identity/Register">Register</a>
                </li>
            `;
        }
    }
    
    // Sign out the current user
    async signOut() {
        try {
            await this.auth.signOut();
            window.location.href = '/Identity/Login';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
    
    // Get the current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Check if a user is logged in
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    // Redirect to login if not authenticated
    requireAuth(redirectUrl = '/Identity/Login') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Create and export a singleton instance
const authService = new AuthService();

// Add auth UI elements to the layout if they don't exist
document.addEventListener('DOMContentLoaded', () => {
    const navbarNav = document.querySelector('.navbar-nav');
    
    if (navbarNav) {
        // Check if auth elements already exist
        if (!document.getElementById('auth-status') && !document.getElementById('auth-links')) {
            // Add auth status and links
            const authContainer = document.createElement('div');
            authContainer.className = 'd-flex align-items-center ms-auto';
            authContainer.innerHTML = `
                <div id="auth-status" class="me-3"></div>
                <ul id="auth-links" class="navbar-nav"></ul>
            `;
            
            navbarNav.parentNode.appendChild(authContainer);
            
            // Initialize auth state
            authService.handleAuthStateChange(authService.getCurrentUser());
        }
    }
}); 