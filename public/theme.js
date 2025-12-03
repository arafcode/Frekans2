// =============================================
// Theme Management - Always Light Theme
// =============================================

(function() {
    // Wait for DOM to be ready
    if (document.body) {
        document.body.classList.remove('dark-theme');
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.remove('dark-theme');
        });
    }
})();

