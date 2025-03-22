// Default settings
const DEFAULT_SETTINGS = {
  commentSelector: '.user-icon-set__sub-line a.user-icon-set__sub-line-anchor',
  backlogDomains: ['*.backlog.jp', '*.backlog.com'],
  notificationDuration: 3000
};

// Create context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create the context menu item
    chrome.contextMenus.create({
      id: 'copyBacklogCommentLink',
      title: 'コメントリンクをMarkdownでコピー',
      contexts: ['link'],
      documentUrlPatterns: ['https://*.backlog.jp/view/*', 'https://*.backlog.com/view/*']
    });
  });

  // Initialize settings if not already set
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    chrome.storage.sync.set(items);
    console.log('Settings initialized:', items);
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyBacklogCommentLink') {
    // Get settings
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      // Execute content script to get and process data
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: processCommentLink,
        args: [info.linkUrl, settings.commentSelector]
      })
      .then((results) => {
        const result = results[0].result;
        if (result.error) {
          console.error('Error:', result.error);
        } else {
          console.log('Link copied:', result.markdownLink);
          
          // Show notification
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: showNotification,
            args: [settings.notificationDuration]
          });
        }
      })
      .catch((error) => {
        console.error('Script execution error:', error);
      });
    });
  }
});

// Function to process the comment link (will be injected into the page)
function processCommentLink(linkUrl, commentSelector) {
  try {
    // Get the current URL
    const currentUrl = window.location.href;
    
    // Extract project ID and ticket number from URL
    const urlMatch = currentUrl.match(/https:\/\/([^\/]+)\/view\/([^\/\#]+)/);
    if (!urlMatch) {
      return { error: 'チケットIDが見つかりませんでした。Backlogのチケット画面で実行してください。' };
    }
    
    const domain = urlMatch[1];
    const issueKey = urlMatch[2];
    
    // Extract comment ID from link URL
    // Use the last occurrence of #comment-XXX in case there are multiple
    const commentMatches = [...linkUrl.matchAll(/#comment-(\d+)/g)];
    if (commentMatches.length === 0) {
      return { error: 'コメントリンクが見つかりませんでした。コメントの日時部分を右クリックしてください。' };
    }
    
    const commentId = commentMatches[commentMatches.length - 1][1];
    
    // Find the comment date text
    const linkElements = document.querySelectorAll(commentSelector);
    let commentDate = '';
    
    for (const element of linkElements) {
      if (element.href && element.href.includes(`#comment-${commentId}`)) {
        commentDate = element.textContent.trim();
        break;
      }
    }
    
    if (!commentDate) {
      return { error: 'コメント日時が見つかりませんでした。' };
    }
    
    // Generate markdown link
    const markdownLink = `[[${issueKey}]] [${commentDate}](https://${domain}/view/${issueKey}#comment-${commentId})`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(markdownLink)
      .catch(err => {
        return { error: 'クリップボードへのコピーに失敗しました。' };
      });
    
    return { markdownLink };
  } catch (error) {
    return { error: `予期せぬエラーが発生しました: ${error.message}` };
  }
}

// Function to show notification (will be injected into the page)
function showNotification(duration) {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('backlog-comment-link-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'backlog-comment-link-notification';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#4caf50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.transition = 'opacity 0.5s';
    
    document.body.appendChild(notification);
  }
  
  // Set notification text and show it
  notification.textContent = 'コメントリンクをコピーしました';
  notification.style.opacity = '1';
  
  // Hide notification after specified duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500); // Wait for fade out animation
  }, duration);
}
