// Default settings
const DEFAULT_SETTINGS = {
  commentSelector: '.user-icon-set__sub-line a.user-icon-set__sub-line-anchor',
  backlogDomains: ['*.backlog.jp', '*.backlog.com'],
  notificationDuration: 3000,
  notificationPosition: 'top-right'
};

// DOM elements
const commentSelectorInput = document.getElementById('commentSelector');
const backlogDomainsTextarea = document.getElementById('backlogDomains');
const saveButton = document.getElementById('save');
const resetButton = document.getElementById('reset');
const statusElement = document.getElementById('status');

// Load settings when the page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Add event listeners
saveButton.addEventListener('click', saveSettings);
resetButton.addEventListener('click', resetSettings);

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    // Set comment selector
    commentSelectorInput.value = items.commentSelector;
    
    // Set domains
    backlogDomainsTextarea.value = items.backlogDomains.join('\n');
    
    console.log('Settings loaded:', items);
  });
}

// Save settings to storage
function saveSettings() {
  // Get comment selector
  const commentSelector = commentSelectorInput.value.trim() || DEFAULT_SETTINGS.commentSelector;
  
  // Get domains
  const backlogDomains = backlogDomainsTextarea.value
    .split('\n')
    .map(domain => domain.trim())
    .filter(domain => domain !== '');
  
  // If no domains are specified, use the default
  if (backlogDomains.length === 0) {
    backlogDomains.push(DEFAULT_SETTINGS.backlogDomains[0]);
  }
  
  // Create settings object
  const settings = {
    commentSelector,
    backlogDomains,
    notificationDuration: DEFAULT_SETTINGS.notificationDuration,
    notificationPosition: DEFAULT_SETTINGS.notificationPosition
  };
  
  // Save settings
  chrome.storage.sync.set(settings, () => {
    showStatus('設定を保存しました', 'success');
    console.log('Settings saved:', settings);
  });
}

// Reset settings to defaults
function resetSettings() {
  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    loadSettings(); // Reload the form with default values
    showStatus('デフォルト設定に戻しました', 'success');
    console.log('Settings reset to defaults');
  });
}

// Show status message
function showStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';
  
  // Hide status after 5 seconds (increased from 3 seconds for better visibility)
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 5000);
}
