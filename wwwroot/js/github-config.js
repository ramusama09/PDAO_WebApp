// GitHub Configuration
const githubConfig = {
    username: 'ramusama09',
    repo: 'PDAO_Image_Repo',
    branch: 'main',
    token: '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'  // Replace with your actual token
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = githubConfig;
} else {
    window.githubConfig = githubConfig;
} 