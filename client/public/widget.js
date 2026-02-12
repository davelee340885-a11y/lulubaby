/**
 * AI Agent Widget Embed Script
 * 
 * Usage:
 * <script>
 *   (function(w,d,s,o,f,js,fjs){
 *     w['AIAgentWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
 *     js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
 *     js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
 *   }(window,document,'script','aiagent','https://lulubaby.xyz/widget.js'));
 *   
 *   aiagent('init', { agentId: 1 });
 * </script>
 */
(function() {
  'use strict';

  var BASE_URL = 'https://lulubaby.xyz';
  var WIDGET_VERSION = '1.0.0';

  // Process queued commands
  var queue = window.aiagent && window.aiagent.q ? window.aiagent.q : [];
  
  // Widget state
  var config = null;
  var agentId = null;
  var isOpen = false;
  var isLoaded = false;
  var container = null;
  var bubble = null;
  var chatFrame = null;
  var bubbleTextEl = null;

  // Main command handler
  window.aiagent = function() {
    var args = Array.prototype.slice.call(arguments);
    var command = args[0];
    var params = args[1];

    switch (command) {
      case 'init':
        init(params);
        break;
      case 'open':
        openWidget();
        break;
      case 'close':
        closeWidget();
        break;
      case 'toggle':
        toggleWidget();
        break;
      case 'destroy':
        destroy();
        break;
    }
  };

  function init(params) {
    if (!params || !params.agentId) {
      console.error('[AIAgent Widget] agentId is required');
      return;
    }

    agentId = params.agentId;

    // Fetch config from server
    fetchConfig(agentId, function(serverConfig) {
      config = serverConfig;
      
      if (!config || !config.widgetEnabled) {
        return; // Widget is disabled
      }

      createWidget();
      isLoaded = true;

      // Auto open if configured
      if (config.autoOpen) {
        setTimeout(function() {
          if (!isOpen) openWidget();
        }, (config.autoOpenDelay || 5) * 1000);
      }
    });
  }

  function fetchConfig(id, callback) {
    // Use tRPC-compatible URL
    var url = BASE_URL + '/api/trpc/widget.getPublicConfig?input=' + encodeURIComponent(JSON.stringify({ json: { personaId: id } }));
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var response = JSON.parse(xhr.responseText);
            var data = response.result && response.result.data ? response.result.data.json : null;
            callback(data);
          } catch (e) {
            console.error('[AIAgent Widget] Failed to parse config:', e);
            // Use defaults
            callback({
              widgetEnabled: true,
              position: 'bottom-right',
              size: 'medium',
              bubbleSize: 60,
              showBubbleText: true,
              bubbleText: '需要幫助嗎？',
              autoOpen: false,
              autoOpenDelay: 5,
              primaryColor: '#3B82F6',
              agentName: 'AI助手',
              welcomeMessage: '您好！有什麼可以幫您？'
            });
          }
        } else {
          console.error('[AIAgent Widget] Failed to fetch config, status:', xhr.status);
          callback(null);
        }
      }
    };
    xhr.send();
  }

  function createWidget() {
    // Create container
    container = document.createElement('div');
    container.id = 'ai-agent-widget-container';
    container.style.cssText = 'position:fixed;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
    
    // Position
    var pos = config.position || 'bottom-right';
    if (pos.indexOf('bottom') >= 0) container.style.bottom = '20px';
    else container.style.top = '20px';
    if (pos.indexOf('right') >= 0) container.style.right = '20px';
    else container.style.left = '20px';

    // Create bubble text
    if (config.showBubbleText && config.bubbleText) {
      bubbleTextEl = document.createElement('div');
      bubbleTextEl.style.cssText = 'position:absolute;bottom:' + ((config.bubbleSize || 60) + 8) + 'px;' +
        (pos.indexOf('right') >= 0 ? 'right:0;' : 'left:0;') +
        'background:#fff;color:#333;padding:8px 14px;border-radius:20px;font-size:13px;' +
        'box-shadow:0 2px 12px rgba(0,0,0,0.12);white-space:nowrap;cursor:pointer;' +
        'animation:aiagent-fade-in 0.3s ease;';
      bubbleTextEl.textContent = config.bubbleText;
      bubbleTextEl.onclick = function() { toggleWidget(); };
      container.appendChild(bubbleTextEl);
    }

    // Create bubble button
    var bSize = config.bubbleSize || 60;
    bubble = document.createElement('button');
    bubble.id = 'ai-agent-widget-bubble';
    bubble.style.cssText = 'width:' + bSize + 'px;height:' + bSize + 'px;border-radius:50%;border:none;cursor:pointer;' +
      'background:' + (config.primaryColor || '#3B82F6') + ';color:#fff;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:transform 0.2s,box-shadow 0.2s;outline:none;';
    bubble.innerHTML = '<svg width="' + (bSize * 0.4) + '" height="' + (bSize * 0.4) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
    bubble.onmouseenter = function() { bubble.style.transform = 'scale(1.08)'; bubble.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'; };
    bubble.onmouseleave = function() { bubble.style.transform = 'scale(1)'; bubble.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; };
    bubble.onclick = function() { toggleWidget(); };
    container.appendChild(bubble);

    // Add animations
    var style = document.createElement('style');
    style.textContent = '@keyframes aiagent-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes aiagent-slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    document.body.appendChild(container);
  }

  function createChatFrame() {
    if (chatFrame) return;

    var sizes = { small: [350, 500], medium: [400, 600], large: [450, 700] };
    var s = sizes[config.size] || sizes.medium;
    var pos = config.position || 'bottom-right';

    var wrapper = document.createElement('div');
    wrapper.id = 'ai-agent-widget-chat';
    wrapper.style.cssText = 'position:absolute;' +
      'bottom:' + ((config.bubbleSize || 60) + 12) + 'px;' +
      (pos.indexOf('right') >= 0 ? 'right:0;' : 'left:0;') +
      'width:' + s[0] + 'px;height:' + s[1] + 'px;' +
      'border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.16);' +
      'animation:aiagent-slide-up 0.3s ease;background:#fff;';

    chatFrame = document.createElement('iframe');
    chatFrame.src = BASE_URL + '/widget-client?agentId=' + agentId;
    chatFrame.style.cssText = 'width:100%;height:100%;border:none;border-radius:16px;';
    chatFrame.allow = 'microphone';
    
    wrapper.appendChild(chatFrame);
    container.insertBefore(wrapper, bubble);
  }

  function openWidget() {
    if (isOpen) return;
    isOpen = true;

    createChatFrame();
    var chat = document.getElementById('ai-agent-widget-chat');
    if (chat) chat.style.display = 'block';

    // Hide bubble text
    if (bubbleTextEl) bubbleTextEl.style.display = 'none';

    // Change bubble icon to X
    var bSize = config.bubbleSize || 60;
    bubble.innerHTML = '<svg width="' + (bSize * 0.35) + '" height="' + (bSize * 0.35) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  }

  function closeWidget() {
    if (!isOpen) return;
    isOpen = false;

    var chat = document.getElementById('ai-agent-widget-chat');
    if (chat) chat.style.display = 'none';

    // Show bubble text
    if (bubbleTextEl) bubbleTextEl.style.display = 'block';

    // Change bubble icon back to chat
    var bSize = config.bubbleSize || 60;
    bubble.innerHTML = '<svg width="' + (bSize * 0.4) + '" height="' + (bSize * 0.4) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
  }

  function toggleWidget() {
    if (isOpen) closeWidget();
    else openWidget();
  }

  function destroy() {
    if (container) {
      container.parentNode.removeChild(container);
      container = null;
      bubble = null;
      chatFrame = null;
      bubbleTextEl = null;
      isOpen = false;
      isLoaded = false;
    }
  }

  // Process queued commands
  for (var i = 0; i < queue.length; i++) {
    window.aiagent.apply(null, queue[i]);
  }
})();
