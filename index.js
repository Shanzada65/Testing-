const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration and session storage
const sessions = new Map();
let wss;

// HTML Control Panel with simplified interface
const htmlControlPanel = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHAN COOKIE SERVER</title>
    <style>
        :root {
            --color1: #FF9EC5; /* Light Pink */
            --color2: #9ED2FF; /* Light Blue */
            --color3: #FFFFFF; /* White */
            --color4: #FFB6D9; /* Pink Heart */
            --text-dark: #333333;
            --text-light: #FFFFFF;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: url('https://i.ibb.co/gM0phW6S/1614b9d2afdbe2d3a184f109085c488f.jpg') no-repeat center center fixed;
            background-size: cover;
            color: var(--text-dark);
            line-height: 1.6;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .status {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 10px;
            font-weight: bold;
            text-align: center;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .online { background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); color: white; }
        .offline { background: linear-gradient(135deg, #f44336 0%, #E91E63 100%); color: white; }
        .connecting { background: linear-gradient(135deg, #ff9800 0%, #FFC107 100%); color: white; }
        .server-connected { background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%); color: var(--text-dark); }
        
        .panel {
            background: rgba(255, 255, 255, 0.9);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            margin-bottom: 25px;
            backdrop-filter: blur(5px);
        }
        
        button {
            padding: 12px 20px;
            margin: 8px;
            cursor: pointer;
            background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%);
            color: var(--text-dark);
            border: none;
            border-radius: 8px;
            transition: all 0.3s;
            font-weight: bold;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        button:disabled {
            background: #cccccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        input, select, textarea {
            padding: 12px 15px;
            margin: 8px 0;
            width: 100%;
            border: 2px solid var(--color2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.8);
            color: var(--text-dark);
            font-size: 16px;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--color1);
            box-shadow: 0 0 0 3px rgba(158, 210, 255, 0.3);
        }
        
        .log {
            height: 300px;
            overflow-y: auto;
            border: 2px solid var(--color2);
            padding: 15px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            border-radius: 10px;
            box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        small {
            color: #666;
            font-size: 13px;
        }
        
        h1, h2, h3 {
            color: var(--text-dark);
            margin-top: 0;
        }
        
        h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, var(--color1) 0%, var(--color2) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }
        
        .session-info {
            background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            color: var(--text-dark);
        }
        
        .tab {
            overflow: hidden;
            border: 2px solid var(--color2);
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .tab button {
            background: transparent;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 20px;
            transition: 0.3s;
            margin: 0;
            border-radius: 0;
            width: 50%;
        }
        
        .tab button:hover {
            background: rgba(158, 210, 255, 0.2);
        }
        
        .tab button.active {
            background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%);
            color: var(--text-dark);
        }
        
        .tabcontent {
            display: none;
            padding: 15px;
            border: 2px solid var(--color2);
            border-top: none;
            border-radius: 0 0 10px 10px;
            background: rgba(255, 255, 255, 0.8);
        }
        
        .active-tab {
            display: block;
        }
        
        .heart {
            color: var(--color4);
            margin: 0 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            color: var(--text-dark);
            font-size: 14px;
        }
        
        .task-manager {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .task-item {
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid var(--color1);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .task-stats {
            font-size: 14px;
            color: #666;
        }
        
        .task-actions {
            display: flex;
            gap: 10px;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--color1) 0%, var(--color2) 100%);
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, var(--color4) 0%, var(--color1) 100%);
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .tab button {
                width: 100%;
            }
            
            .task-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .task-actions {
                margin-top: 10px;
                width: 100%;
                justify-content: space-between;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="heart">❤️</span> SHAN COOKIE SERVER FOR CONVO <span class="heart">❤️</span></h1>
        <p>COOKIE SERVER FOR CONVO</p>
    </div>
    
    <div class="status server-connected" id="status">
        Status: Connecting to server...
    </div>
    
    <div class="panel">
        <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'cookie-file-tab')">Cookie File</button>
            <button class="tablinks" onclick="openTab(event, 'cookie-text-tab')">Paste Cookies</button>
        </div>
        
        <div id="cookie-file-tab" class="tabcontent active-tab">
            <input type="file" id="cookie-file" accept=".txt">
            <small>Select your cookies file</small>
        </div>
        
        <div id="cookie-text-tab" class="tabcontent">
            <textarea id="cookie-text" placeholder="Paste your cookies here (one cookie per line)" rows="5"></textarea>
            <small>Paste your cookies per line by line</small>
        </div>
        
        <div>
            <input type="text" id="thread-id" placeholder="Thread/Group ID">
            <small>Enter Your Convo Uid</small>
        </div>
        
        <div>
            <input type="number" id="delay" value="5" min="1" placeholder="Delay in seconds">
            <small>Speed</small>
        </div>
        
        <div>
            <input type="text" id="prefix" placeholder="Hater Name">
            <small>Hater Name</small>
        </div>
        
        <div>
            <label for="message-file">Messages File</label>
            <input type="file" id="message-file" accept=".txt">
            <small>Choice Message File</small>
        </div>
        
        <div style="text-align: center;">
            <button id="start-btn">Start Sending <span class="heart">💌</span></button>
            <button id="stop-btn" disabled>Stop Sending <span class="heart">🛑</span></button>
        </div>
        
        <div id="session-info" style="display: none;" class="session-info">
            <h3>Your Session ID: <span id="session-id-display"></span></h3>
            <p>Save this ID to stop your session later or view its details</p>
        </div>
    </div>
    
    <div class="panel task-manager">
        <h3><span class="heart">📊</span> Task Manager</h3>
        <p>All currently running tasks are displayed below</p>
        
        <div id="running-tasks">
            <div id="no-tasks-message" style="text-align: center; padding: 20px; color: #666;">
                No tasks currently running
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Made with <span class="heart">💌</span> | Tasks continue running even if you close this page!</p>
    </div>

    <script>
        const logContainer = document.getElementById('log-container');
        const statusDiv = document.getElementById('status');
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const cookieFileInput = document.getElementById('cookie-file');
        const cookieTextInput = document.getElementById('cookie-text');
        const threadIdInput = document.getElementById('thread-id');
        const delayInput = document.getElementById('delay');
        const prefixInput = document.getElementById('prefix');
        const messageFileInput = document.getElementById('message-file');
        const sessionInfoDiv = document.getElementById('session-info');
        const sessionIdDisplay = document.getElementById('session-id-display');
        
        // Task manager elements
        const runningTasksDiv = document.getElementById('running-tasks');
        const noTasksMessage = document.getElementById('no-tasks-message');
        
        let currentSessionId = null;
        let reconnectAttempts = 0;
        let maxReconnectAttempts = 10;
        let socket = null;
        let runningTasks = new Map();

        function openTab(evt, tabName) {
            const tabcontent = document.getElementsByClassName("tabcontent");
            for (let i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            
            const tablinks = document.getElementsByClassName("tablinks");
            for (let i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }

        function addLog(message, type = 'info', sessionId = null) {
            const logEntry = document.createElement('div');
            const timestamp = new Date().toLocaleTimeString();
            let prefix = '';
            
            switch(type) {
                case 'success':
                    prefix = '✅';
                    break;
                case 'error':
                    prefix = '❌';
                    break;
                case 'warning':
                    prefix = '⚠️';
                    break;
                default:
                    prefix = '📝';
            }
            
            logEntry.innerHTML = \`<span style="color: #FF9EC5">[\${timestamp}]</span> \${prefix} \${message}\`;
            
            // If we have a session ID and the task is in our running tasks, update its logs
            if (sessionId && runningTasks.has(sessionId)) {
                const task = runningTasks.get(sessionId);
                task.logs.push(logEntry.innerHTML);
                
                // Keep only last 20 minutes of logs (approx 100 entries)
                if (task.logs.length > 100) {
                    task.logs = task.logs.slice(-100);
                }
                
                updateTaskDisplay(sessionId);
            }
        }

        function updateTaskDisplay(sessionId) {
            const task = runningTasks.get(sessionId);
            if (!task) return;
            
            const taskElement = document.getElementById(\`task-\${sessionId}\`);
            if (taskElement) {
                const statsElement = taskElement.querySelector('.task-stats');
                statsElement.innerHTML = \`
                    Messages Sent: \${task.totalMessagesSent} | 
                    Active Cookies: \${task.activeCookies}/\${task.totalCookies} | 
                    Running Time: \${formatRunningTime(task.startTime)}
                \`;
            }
        }

        function formatRunningTime(startTime) {
            const now = new Date();
            const start = new Date(startTime);
            const diff = now - start;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }

        function addRunningTask(sessionData) {
            runningTasks.set(sessionData.id, {
                ...sessionData,
                logs: []
            });
            
            updateTasksDisplay();
        }

        function removeRunningTask(sessionId) {
            runningTasks.delete(sessionId);
            updateTasksDisplay();
        }

        function updateTasksDisplay() {
            runningTasksDiv.innerHTML = '';
            
            if (runningTasks.size === 0) {
                runningTasksDiv.appendChild(noTasksMessage);
                return;
            }
            
            noTasksMessage.style.display = 'none';
            
            runningTasks.forEach((task, sessionId) => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item';
                taskElement.id = \`task-\${sessionId}\`;
                
                taskElement.innerHTML = \`
                    <div class="task-header">
                        <div>
                            <strong>Task: \${sessionId}</strong>
                            <div class="task-stats">
                                Messages Sent: \${task.totalMessagesSent} | 
                                Active Cookies: \${task.activeCookies}/\${task.totalCookies} | 
                                Running Time: \${formatRunningTime(task.startTime)}
                            </div>
                        </div>
                        <div class="task-actions">
                            <button onclick="viewTaskLogs('\${sessionId}')" style="background: var(--color2);">View Logs</button>
                            <button onclick="stopTask('\${sessionId}')" style="background: var(--color1);">Stop Task</button>
                        </div>
                    </div>
                \`;
                
                runningTasksDiv.appendChild(taskElement);
            });
        }

        function viewTaskLogs(sessionId) {
            const task = runningTasks.get(sessionId);
            if (!task) {
                alert('Task not found or no longer running');
                return;
            }
            
            const logsWindow = window.open('', 'Task Logs', 'width=800,height=600,scrollbars=yes');
            logsWindow.document.write(\`
                <html>
                    <head>
                        <title>Logs for Task \${sessionId}</title>
                        <style>
                            body { 
                                font-family: 'Courier New', monospace; 
                                background: #000; 
                                color: #0f0; 
                                padding: 20px;
                                margin: 0;
                            }
                            .log-header { 
                                background: #333; 
                                color: white; 
                                padding: 15px; 
                                margin-bottom: 15px;
                                border-radius: 5px;
                            }
                            .log-entry { 
                                margin: 5px 0; 
                                padding: 5px;
                                border-bottom: 1px solid #333;
                            }
                            .timestamp { color: #ff9ec5; }
                        </style>
                    </head>
                    <body>
                        <div class="log-header">
                            <h2>Logs for Task: \${sessionId}</h2>
                            <p>Messages Sent: \${task.totalMessagesSent} | Active Cookies: \${task.activeCookies}/\${task.totalCookies}</p>
                            <button onclick="window.close()" style="padding: 5px 10px; margin-top: 10px;">Close</button>
                        </div>
                        <div id="log-container">
                            \${task.logs.map(log => \`<div class="log-entry">\${log}</div>\`).join('')}
                        </div>
                    </body>
                </html>
            \`);
            logsWindow.document.close();
        }

        function stopTask(sessionId) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ 
                    type: 'stop', 
                    sessionId: sessionId 
                }));
                addLog(\`Stop command sent for task: \${sessionId}\`, 'success');
            } else {
                addLog('Connection not ready. Please try again.', 'error');
            }
        }

        function connectWebSocket() {
            // Dynamic protocol for Render
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(protocol + '//' + window.location.host);

            socket.onopen = () => {
                addLog('Connected to server successfully', 'success');
                statusDiv.className = 'status server-connected';
                statusDiv.textContent = 'Status: Connected to Server';
                reconnectAttempts = 0;
                
                // Request current running tasks
                socket.send(JSON.stringify({ type: 'get_tasks' }));
            };
            
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'log') {
                        addLog(data.message, data.level || 'info', data.sessionId);
                    } 
                    else if (data.type === 'status') {
                        statusDiv.className = data.running ? 'status online' : 'status server-connected';
                        statusDiv.textContent = \`Status: \${data.running ? 'Sending Messages' : 'Connected to Server'}\`;
                        startBtn.disabled = data.running;
                        stopBtn.disabled = !data.running;
                    }
                    else if (data.type === 'session') {
                        currentSessionId = data.sessionId;
                        sessionIdDisplay.textContent = data.sessionId;
                        sessionInfoDiv.style.display = 'block';
                        addLog(\`Your session ID: \${data.sessionId}\`, 'success');
                        
                        // Store the session ID in localStorage
                        localStorage.setItem('lastSessionId', data.sessionId);
                    }
                    else if (data.type === 'task_update') {
                        // Update running tasks
                        if (data.running) {
                            addRunningTask(data.task);
                        } else {
                            removeRunningTask(data.sessionId);
                        }
                    }
                    else if (data.type === 'all_tasks') {
                        // Initialize with all running tasks
                        runningTasks.clear();
                        data.tasks.forEach(task => {
                            addRunningTask(task);
                        });
                    }
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            };
            
            socket.onclose = (event) => {
                if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
                    addLog(\`Connection closed unexpectedly. Attempting to reconnect... (\${reconnectAttempts + 1}/\${maxReconnectAttempts})\`, 'warning');
                    statusDiv.className = 'status connecting';
                    statusDiv.textContent = 'Status: Reconnecting...';
                    
                    setTimeout(() => {
                        reconnectAttempts++;
                        connectWebSocket();
                    }, 3000);
                } else {
                    addLog('Disconnected from server', 'error');
                    statusDiv.className = 'status offline';
                    statusDiv.textContent = 'Status: Disconnected';
                }
            };
            
            socket.onerror = (error) => {
                addLog(\`WebSocket error: \${error.message || 'Unknown error'}\`, 'error');
                statusDiv.className = 'status offline';
                statusDiv.textContent = 'Status: Connection Error';
            };
        }

        // Initial connection
        connectWebSocket();

        startBtn.addEventListener('click', () => {
            let cookiesContent = '';
            
            // Check which cookie input method is active
            const cookieFileTab = document.getElementById('cookie-file-tab');
            if (cookieFileTab.style.display !== 'none' && cookieFileInput.files.length > 0) {
                const cookieFile = cookieFileInput.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    cookiesContent = event.target.result;
                    processStart(cookiesContent);
                };
                
                reader.readAsText(cookieFile);
            } 
            else if (cookieTextInput.value.trim()) {
                cookiesContent = cookieTextInput.value.trim();
                processStart(cookiesContent);
            }
            else {
                addLog('Please provide cookie content', 'error');
                return;
            }
        });
        
        function processStart(cookiesContent) {
            if (!threadIdInput.value.trim()) {
                addLog('Please enter a Thread/Group ID', 'error');
                return;
            }
            
            if (messageFileInput.files.length === 0) {
                addLog('Please select a messages file', 'error');
                return;
            }
            
            const messageFile = messageFileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const messageContent = event.target.result;
                const threadID = threadIdInput.value.trim();
                const delay = parseInt(delayInput.value) || 5;
                const prefix = prefixInput.value.trim();
                
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'start',
                        cookiesContent,
                        messageContent,
                        threadID,
                        delay,
                        prefix
                    }));
                } else {
                    addLog('Connection not ready. Please try again.', 'error');
                    connectWebSocket();
                }
            };
            
            reader.readAsText(messageFile);
        }
        
        stopBtn.addEventListener('click', () => {
            if (currentSessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'stop', 
                        sessionId: currentSessionId 
                    }));
                } else {
                    addLog('Connection not ready. Please try again.', 'error');
                }
            } else {
                addLog('No active task to stop', 'error');
            }
        });
        
        // Make functions global for task buttons
        window.viewTaskLogs = viewTaskLogs;
        window.stopTask = stopTask;
        
        // Check if we have a previous session ID
        window.addEventListener('load', () => {
            const lastSessionId = localStorage.getItem('lastSessionId');
            if (lastSessionId) {
                addLog(\`Found your previous session ID: \${lastSessionId}\`, 'info');
            }
        });
        
        // Keep connection alive
        setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
        
        addLog('Control panel ready. Please configure your settings and start sending.', 'success');
    </script>
</body>
</html>
`;

// Start message sending function with multiple cookies support
function startSending(ws, cookiesContent, messageContent, threadID, delay, prefix) {
  const sessionId = uuidv4();
  
  // Parse cookies (one per line)
  const cookies = cookiesContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((cookie, index) => ({
      id: index + 1,
      content: cookie,
      active: false,
      sentCount: 0,
      api: null
    }));
  
  if (cookies.length === 0) {
    ws.send(JSON.stringify({ type: 'log', message: 'No cookies found', level: 'error' }));
    return;
  }
  
  // Parse messages
  const messages = messageContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (messages.length === 0) {
    ws.send(JSON.stringify({ type: 'log', message: 'No messages found in the file', level: 'error' }));
    return;
  }

  // Create session object
  const session = {
    id: sessionId,
    threadID: threadID,
    messages: messages,
    cookies: cookies,
    currentCookieIndex: 0,
    currentMessageIndex: 0,
    totalMessagesSent: 0,
    loopCount: 0,
    delay: delay,
    prefix: prefix,
    running: true,
    startTime: new Date(),
    ws: null, // Don't store WebSocket reference to prevent memory leaks
    lastActivity: Date.now(),
    activeCookies: 0,
    totalCookies: cookies.length
  };
  
  // Store session
  sessions.set(sessionId, session);
  
  // Send session ID to client
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ 
      type: 'session', 
      sessionId: sessionId 
    }));
    
    ws.send(JSON.stringify({ type: 'log', message: `Task started with ID: ${sessionId}`, level: 'success', sessionId }));
    ws.send(JSON.stringify({ type: 'log', message: `Loaded ${cookies.length} cookies`, level: 'success', sessionId }));
    ws.send(JSON.stringify({ type: 'log', message: `Loaded ${messages.length} messages`, level: 'success', sessionId }));
    ws.send(JSON.stringify({ type: 'status', running: true }));
    
    // Broadcast task update
    broadcastTaskUpdate(sessionId, true);
  }
  
  // Initialize all cookies
  initializeCookies(sessionId, ws);
}

// Initialize all cookies by logging in
function initializeCookies(sessionId, ws) {
  const session = sessions.get(sessionId);
  if (!session || !session.running) return;
  
  let initializedCount = 0;
  
  session.cookies.forEach((cookie, index) => {
    wiegine.login(cookie.content, {}, (err, api) => {
      if (err || !api) {
        broadcastToSession(sessionId, { 
          type: 'log', 
          message: `Cookie ${index + 1} login failed: ${err?.message || err}`,
          level: 'error'
        });
        cookie.active = false;
      } else {
        cookie.api = api;
        cookie.active = true;
        session.activeCookies++;
        broadcastToSession(sessionId, { 
          type: 'log', 
          message: `Cookie ${index + 1} logged in successfully`,
          level: 'success'
        });
        
        // Update task info
        broadcastTaskUpdate(sessionId, true);
      }
      
      initializedCount++;
      
      // If all cookies are initialized, start sending messages
      if (initializedCount === session.cookies.length) {
        const activeCookies = session.cookies.filter(c => c.active);
        if (activeCookies.length > 0) {
          broadcastToSession(sessionId, { 
            type: 'log', 
            message: `${activeCookies.length}/${session.cookies.length} cookies active, starting message sending`,
            level: 'success'
          });
          sendNextMessage(sessionId);
        } else {
          broadcastToSession(sessionId, { 
            type: 'log', 
            message: 'No active cookies, stopping task',
            level: 'error'
          });
          stopSending(sessionId);
        }
      }
    });
  });
}

// Send next message in sequence with multiple cookies
function sendNextMessage(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || !session.running) return;

  // Update last activity time
  session.lastActivity = Date.now();

  // Get current cookie and message
  const cookie = session.cookies[session.currentCookieIndex];
  const messageIndex = session.currentMessageIndex;
  const message = session.prefix 
    ? `${session.prefix} ${session.messages[messageIndex]}`
    : session.messages[messageIndex];
  
  if (!cookie.active || !cookie.api) {
    // Skip inactive cookies and move to next
    broadcastToSession(sessionId, { 
      type: 'log', 
      message: `Cookie ${session.currentCookieIndex + 1} is inactive, skipping`,
      level: 'warning'
    });
    moveToNextCookie(sessionId);
    setTimeout(() => sendNextMessage(sessionId), 1000); // Short delay before trying next cookie
    return;
  }
  
  // Send the message
  cookie.api.sendMessage(message, session.threadID, (err) => {
    if (err) {
      broadcastToSession(sessionId, { 
        type: 'log', 
        message: `Cookie ${session.currentCookieIndex + 1} failed to send message: ${err.message}`,
        level: 'error'
      });
      cookie.active = false; // Mark cookie as inactive on error
      session.activeCookies--;
      broadcastTaskUpdate(sessionId, true);
    } else {
      session.totalMessagesSent++;
      cookie.sentCount = (cookie.sentCount || 0) + 1;
      
      broadcastToSession(sessionId, { 
        type: 'log', 
        message: `Cookie ${session.currentCookieIndex + 1} sent message ${session.totalMessagesSent} (Loop ${session.loopCount + 1}, Message ${messageIndex + 1}/${session.messages.length}): ${message}`,
        level: 'success'
      });
      
      // Update task info
      broadcastTaskUpdate(sessionId, true);
    }
    
    // Move to next message and cookie
    session.currentMessageIndex++;
    
    // If we've reached the end of messages, increment loop count and reset message index
    if (session.currentMessageIndex >= session.messages.length) {
      session.currentMessageIndex = 0;
      session.loopCount++;
      broadcastToSession(sessionId, { 
        type: 'log', 
        message: `Completed loop ${session.loopCount}, restarting from first message`,
        level: 'success'
      });
    }
    
    moveToNextCookie(sessionId);
    
    if (session.running) {
      setTimeout(() => sendNextMessage(sessionId), session.delay * 1000);
    }
  });
}

// Move to the next cookie in rotation
function moveToNextCookie(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  session.currentCookieIndex = (session.currentCookieIndex + 1) % session.cookies.length;
}

// Broadcast to all clients watching this session
function broadcastToSession(sessionId, data) {
  if (!wss) return;
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      // Add sessionId to the data
      const sessionData = {...data, sessionId};
      client.send(JSON.stringify(sessionData));
    }
  });
}

// Broadcast task update to all clients
function broadcastTaskUpdate(sessionId, running) {
  if (!wss) return;
  
  const session = sessions.get(sessionId);
  if (!session) return;
  
  const taskData = {
    id: session.id,
    threadID: session.threadID,
    totalMessagesSent: session.totalMessagesSent,
    activeCookies: session.activeCookies,
    totalCookies: session.totalCookies,
    startTime: session.startTime,
    running: running
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'task_update',
        sessionId: sessionId,
        running: running,
        task: taskData
      }));
    }
  });
}

// Stop specific session
function stopSending(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  // Logout from all cookies
  session.cookies.forEach(cookie => {
    if (cookie.api) {
      try {
        cookie.api.logout();
      } catch (e) {
        console.error('Error logging out from cookie:', e);
      }
    }
  });
  
  session.running = false;
  sessions.delete(sessionId);
  
  broadcastToSession(sessionId, { type: 'status', running: false });
  broadcastToSession(sessionId, { 
    type: 'log', 
    message: 'Task stopped',
    level: 'success'
  });
  
  // Broadcast task removal
  broadcastTaskUpdate(sessionId, false);
  
  return true;
}

// Get all running tasks
function getAllRunningTasks(ws) {
  const tasks = [];
  
  sessions.forEach((session, sessionId) => {
    if (session.running) {
      tasks.push({
        id: session.id,
        threadID: session.threadID,
        totalMessagesSent: session.totalMessagesSent,
        activeCookies: session.activeCookies,
        totalCookies: session.totalCookies,
        startTime: session.startTime,
        running: true
      });
    }
  });
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'all_tasks',
      tasks: tasks
    }));
  }
}

// Set up Express server
app.get('/', (req, res) => {
  res.send(htmlControlPanel);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`💌 Persistent Message Sender Bot running at http://localhost:${PORT}`);
});

// Set up WebSocket server
wss = new WebSocket.Server({ server, clientTracking: true });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ 
    type: 'status', 
    running: false 
  }));

  // Send current running tasks to new client
  getAllRunningTasks(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start') {
        startSending(
          ws,
          data.cookiesContent, 
          data.messageContent, 
          data.threadID, 
          data.delay, 
          data.prefix
        );
      } 
      else if (data.type === 'stop') {
        if (data.sessionId) {
          const stopped = stopSending(data.sessionId);
          if (!stopped && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'log', 
              message: `Task ${data.sessionId} not found or already stopped`,
              level: 'error'
            }));
          }
        } else if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'log', 
            message: 'No task ID provided',
            level: 'error'
          }));
        }
      }
      else if (data.type === 'get_tasks') {
        getAllRunningTasks(ws);
      }
      else if (data.type === 'ping') {
        // Respond to ping
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'log', 
          message: `Error: ${err.message}`,
          level: 'error'
        }));
      }
    }
  });
  
  // Send initial connection message
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ 
      type: 'log', 
      message: 'Connected to persistent message sender bot',
      level: 'success'
    }));
  }
});

// Keep alive interval for WebSocket connections
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'ping' }));
    }
  });
}, 30000);

// Clean up inactive sessions periodically (20 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    // Check if session has been inactive for too long (20 minutes)
    if (now - session.lastActivity > 20 * 60 * 1000) {
      console.log(`Cleaning up inactive task: ${sessionId}`);
      stopSending(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  
  // Stop all sessions
  for (const [sessionId] of sessions.entries()) {
    stopSending(sessionId);
  }
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
