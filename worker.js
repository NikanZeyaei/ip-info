// Main fetch event listener
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * Parse user agent string to extract browser, OS, platform, and version information
 * @param {string} ua - User agent string
 * @returns {Object} Parsed user agent information
 */
function parseUserAgent(ua) {
    if (!ua || ua === 'Unknown') {
        return { browser: 'Unknown', os: 'Unknown', platform: 'Unknown', version: 'Unknown' };
    }
    
    let browser = 'Unknown', os = 'Unknown', platform = 'Unknown', version = 'Unknown';
    
    // Browser detection with version
    if (/firefox/i.test(ua)) {
        browser = 'Firefox';
        const match = ua.match(/firefox\/([0-9.]+)/i);
        if (match) version = match[1];
    } else if (/edg/i.test(ua)) {
        browser = 'Edge';
        const match = ua.match(/edg\/([0-9.]+)/i);
        if (match) version = match[1];
    } else if (/chrome/i.test(ua)) {
        browser = 'Chrome';
        const match = ua.match(/chrome\/([0-9.]+)/i);
        if (match) version = match[1];
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
        browser = 'Safari';
        const match = ua.match(/version\/([0-9.]+)/i);
        if (match) version = match[1];
    } else if (/opera|opr/i.test(ua)) {
        browser = 'Opera';
        const match = ua.match(/(?:opera|opr)\/([0-9.]+)/i);
        if (match) version = match[1];
    } else if (/msie|trident/i.test(ua)) {
        browser = 'Internet Explorer';
        const match = ua.match(/(?:msie |rv:)([0-9.]+)/i);
        if (match) version = match[1];
    }
    
    // Operating system detection
    if (/windows nt/i.test(ua)) os = 'Windows';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/cros/i.test(ua)) os = 'Chrome OS';
    
    // Platform detection
    if (/mobile/i.test(ua)) platform = 'Mobile';
    else if (/tablet/i.test(ua)) platform = 'Tablet';
    else platform = 'Desktop';
    
    return { browser, os, platform, version };
}

/**
 * Convert country code to flag emoji
 * @param {string} countryCode - Two-letter country code
 * @returns {string} Flag emoji or empty string
 */
function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

/**
 * Handle incoming requests and return IP information
 * @param {Request} request - The incoming request
 * @returns {Response} Response with IP information
 */
async function handleRequest(request) {
    try {
        // Extract client information
        const clientIp = request.headers.get('CF-Connecting-IP') || 'Unknown';
        const userAgent = request.headers.get('User-Agent') || 'Unknown';
        const uaInfo = parseUserAgent(userAgent);
        
        // Fetch IP information from API
        const ipApiUrl = `https://api.ipapi.is/?q=${clientIp}`;
        const ipResponse = await fetch(ipApiUrl);
        const ipData = await ipResponse.json();

        // Check if IP data is valid
        if (!ipData.ip) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch IP information' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Determine response format based on user agent and accept header
        const acceptHeader = request.headers.get('Accept') || '';
        const isCurl = (userAgent && userAgent.toLowerCase().includes('curl')) || acceptHeader.includes('application/json');
        const flagEmoji = getFlagEmoji(ipData.location?.country_code);
        const { pathname } = new URL(request.url);

        if (isCurl) {
            if (pathname === '/json') {
                const jsonData = {
                    ip: clientIp,
                    country: ipData.location?.country || 'Unknown',
                    country_code: ipData.location?.country_code || 'Unknown',
                    flag: flagEmoji,
                    region: ipData.location?.state || 'Unknown',
                    city: ipData.location?.city || 'Unknown',
                    isp: ipData.company?.name || 'Unknown',
                    latitude: ipData.location?.latitude || 'Unknown',
                    longitude: ipData.location?.longitude || 'Unknown',
                    timezone: ipData.location?.timezone || 'Unknown',
                    is_proxy: ipData.is_proxy,
                    is_vpn: ipData.is_vpn,
                    is_tor: ipData.is_tor,
                    is_datacenter: ipData.is_datacenter,
                    is_abuser: ipData.is_abuser,
                    user_agent: userAgent,
                    ua_info: uaInfo
                };
                return new Response(jsonData, {
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    status: 200,
                });
            }
            // Return terminal-formatted output for curl requests
            // ANSI color codes for terminal output
            const cyan = '\x1b[36m', green = '\x1b[32m', yellow = '\x1b[33m', 
                  magenta = '\x1b[35m', red = '\x1b[31m', reset = '\x1b[0m', bold = '\x1b[1m';
            
            const output = `
${bold}${cyan}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${reset}
${bold}${cyan}┃        IP Information           ┃${reset}
${bold}${cyan}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${reset}

${bold}${green}IP:        ${reset}${clientIp}
${bold}${green}Country:   ${reset}${flagEmoji} ${ipData.location?.country || 'Unknown'}
${bold}${green}Region:    ${reset}${ipData.location?.state || 'Unknown'}
${bold}${green}City:      ${reset}${ipData.location?.city || 'Unknown'}
${bold}${green}ISP:       ${reset}${ipData.company?.name || 'Unknown'}
${bold}${green}Lat:       ${reset}${ipData.location?.latitude || 'Unknown'}
${bold}${green}Lon:       ${reset}${ipData.location?.longitude || 'Unknown'}
${bold}${green}TZ:        ${reset}${ipData.location?.timezone || 'Unknown'}
${bold}${yellow}Proxy:     ${reset}${ipData.is_proxy ? `${red}Yes${reset}` : `${green}No${reset}`}
${bold}${yellow}VPN:       ${reset}${ipData.is_vpn ? `${red}Yes${reset}` : `${green}No${reset}`}
${bold}${yellow}Tor:       ${reset}${ipData.is_tor ? `${red}Yes${reset}` : `${green}No${reset}`}
${bold}${yellow}Datacenter:${reset}${ipData.is_datacenter ? `${red}Yes${reset}` : `${green}No${reset}`}
${bold}${yellow}Abuser:    ${reset}${ipData.is_abuser ? `${red}Yes${reset}` : `${green}No${reset}`}

${bold}${magenta}User Agent:${reset} ${userAgent}
`;
            return new Response(output, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                status: 200,
            });
        }

        // Return HTML interface for web browsers
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IP Information</title>
    
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', monospace;
            background: #282c34;
            color: #abb2bf;
            overflow-x: hidden;
            position: relative;
            padding-top: 20px;
            line-height: 1.6;
        }

        .container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 20px;
            width: 100%;
            max-width: 1400px;
        }

        .page-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
        }

        .card-grid {
            display: contents;
        }

        .grid-item {
            grid-column: 1;
        }

        .grid-item:nth-child(2) {
            grid-column: 2;
        }

        .info-card {
            background: #21252b;
            border-radius: 8px;
            border: 1px solid #3e4451;
            overflow: hidden;
            transition: border-color 0.2s ease;
            position: relative;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            height: fit-content;
        }

        .info-card:hover {
            border-color: #528bff;
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 20px 24px;
            border-bottom: 1px solid #3e4451;
            background: #2c313c;
            position: relative;
        }

        .card-header i {
            font-size: 1.2em;
            color: #61afef;
            width: 20px;
            text-align: center;
        }

        .card-header h2 {
            font-size: 1.1em;
            font-weight: 600;
            color: #e06c75;
            font-family: inherit;
        }

        .card-content {
            padding: 20px;
            flex: 1;
        }

        .info-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 12px 16px;
            background: #282c34;
            border-radius: 4px;
            border: 1px solid #3e4451;
            transition: background-color 0.15s ease;
            position: relative;
        }

        .info-item:last-child {
            margin-bottom: 0;
        }

        .info-item:hover {
            background: #2c313c;
        }

        .label {
            font-weight: 500;
            color: #e5c07b;
            font-size: 0.9em;
            min-width: 120px;
            font-family: inherit;
        }

        .label::after {
            content: ':';
            color: #abb2bf;
            margin-left: 2px;
        }

        .value {
            font-weight: 500;
            color: #98c379;
            flex: 1;
            text-align: right;
            margin-right: 12px;
            font-size: 0.9em;
            font-family: inherit;
        }

        .copy-btn {
            background: #3e4451;
            border: 1px solid #528bff;
            color: #61afef;
            border-radius: 4px;
            padding: 6px 8px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 0.8em;
            min-width: 32px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
        }

        .copy-btn:hover {
            background: #528bff;
            color: #ffffff;
        }

        .fade-in {
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { 
                opacity: 0; 
                transform: translateY(10px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        /* Syntax highlighting colors */
        .string { color: #98c379; }
        .number { color: #d19a66; }
        .boolean { color: #56b6c2; }
        .keyword { color: #c678dd; }
        .comment { color: #5c6370; font-style: italic; }
        .variable { color: #e06c75; }
        .function { color: #61afef; }

        .boolean.green {
            color: #98c379 !important;
            font-weight: bold;
        }
        .boolean.red {
            color: #e06c75 !important;
            font-weight: bold;
        }
        .string.red {
            color: #e06c75 !important;
        }
        .string.green {
            color: #98c379 !important;
        }

        .badge {
            background: #e06c75;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            font-weight: 600;
            margin-left: 8px;
        }

        .badge.warning {
            background: #d19a66;
        }

        @media (max-width: 768px) {
            .container {
                grid-template-columns: 1fr;
                grid-template-rows: auto auto auto;
                padding: 15px;
            }
            
            .info-card {
                grid-column: 1 !important;
                grid-row: auto !important;
                margin-top: 0 !important;
            }
            
            .info-item {
                flex-direction: column;
                gap: 8px;
                text-align: center;
            }
            
            .value {
                text-align: center;
                margin-right: 0;
            }
            
            .label {
                min-width: auto;
            }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: #21252b;
        }

        ::-webkit-scrollbar-thumb {
            background: #528bff;
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #61afef;
        }
    </style>
</head>
<body>
    <div class="page-wrapper">
        <div class="container">
            <!-- IP Information Card -->
            <div class="info-card" style="grid-column: 1; grid-row: 1 / 3;">
                <div class="card-header">
                    <i class="fas fa-code"></i>
                    <h2>IP Information</h2>
                </div>
                <div class="card-content">
                    <div class="info-item">
                        <span class="label">IP Address</span>
                        <span class="value string" data-ip="${clientIp}">${clientIp}</span>
                        <button class="copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Country</span>
                        <span class="value string">${flagEmoji} ${ipData.location?.country || 'Unknown'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">ISP</span>
                        <span class="value string">${ipData.company?.name || 'Unknown'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Region</span>
                        <span class="value string">${ipData.location?.state || 'Unknown'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">City</span>
                        <span class="value string">${ipData.location?.city || 'Unknown'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Coordinates</span>
                        <span class="value string">${ipData.location?.latitude || 'Unknown'}, ${ipData.location?.longitude || 'Unknown'}</span>
                        <button class="copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>

                    <div class="info-item">
                        <span class="label">VPN</span>
                        <span class="value boolean ${ipData.is_vpn ? 'red' : 'green'}">${ipData.is_vpn ? 'true' : 'false'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Proxy</span>
                        <span class="value boolean ${ipData.is_proxy ? 'red' : 'green'}">${ipData.is_proxy ? 'true' : 'false'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Abuser</span>
                        <span class="value boolean ${ipData.is_abuser ? 'red' : 'green'}">${ipData.is_abuser ? 'true' : 'false'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Datacenter</span>
                        <span class="value boolean ${ipData.is_datacenter ? 'red' : 'green'}">${ipData.is_datacenter ? 'true' : 'false'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">Tor</span>
                        <span class="value boolean ${ipData.is_tor ? 'red' : 'green'}">${ipData.is_tor ? 'true' : 'false'}</span>
                    </div>
                </div>
            </div>
            <!-- Device Information Card -->
            <div class="info-card" style="grid-column: 2; grid-row: 1;">
                <div class="card-header">
                    <i class="fas fa-terminal"></i>
                    <h2>Device Information</h2>
                    <span id="security-badges"></span>
                </div>
                <div class="card-content">
                    <div class="info-item">
                        <span class="label">OS / Platform</span>
                        <span class="value string">${uaInfo.os} / ${uaInfo.platform}</span>
                    </div>

                    <div class="info-item">
                        <span class="label">Browser</span>
                        <span class="value string">${uaInfo.browser}${uaInfo.version !== 'Unknown' ? ' ' + uaInfo.version : ''}</span>
                    </div>

                    <div class="info-item">
                        <span class="label">Languages</span>
                        <span class="value string" id="browser-languages">Loading...</span>
                    </div>
                
                    <div class="info-item">
                        <span class="label">User Agent</span>
                        <span class="value string">${userAgent}</span>
                        <button class="copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">WebRTC IP</span>
                        <span class="value string" id="webrtc-ip" data-ip="">Checking...</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="label">System Time Zone</span>
                        <span class="value string" id="system-time-zone">Loading...</span>
                    </div>

                    <div class="info-item">
                        <span class="label">IP Time Zone</span>
                        <span class="value string" id="ip-time-zone">Loading...</span>
                    </div>
                </div>
            </div>

            <!-- Terminal Usage Card -->
            <div class="info-card" style="grid-column: 2; grid-row: 2; margin-top: 10px">
                <div class="card-header">
                    <i class="fas fa-terminal"></i>
                    <h2>Terminal Usage</h2>
                </div>
                <div class="card-content">
                    <div style="background: #1e2127; border: 1px solid #3e4451; border-radius: 6px; padding: 16px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;">
                        <div style="color: #98c379; font-size: 0.9em; margin-bottom: 8px;">$ curl domain.com</div>
                        <div style="color: #61afef; font-size: 0.85em; font-style: italic;">Get your IP information via terminal</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <footer style="width:100%;text-align:center;margin:5px auto;color:#abb2bf;font-size:0.95em;padding-top:10px">
            <a href="https://github.com/ixabolfazl" target="_blank" style="color:#61afef;text-decoration:none;font-weight:600;">developed by ix-Abolfazl</a>
            <span style="margin:0 10px; color:#3e4451;">|</span>
            <a href="https://github.com/ixabolfazl/ip-info" target="_blank" style="color:#e5c07b;text-decoration:none;font-weight:600;">Source Code</a>
        </footer>
    </div>
    <script>
        // Global variables for WebRTC detection
        let webrtcDetected = false;
        let webrtcIP = '';
        const publicIP = '${clientIp}';
        
        /**
         * Detect WebRTC IP using STUN servers
         * @returns {Promise<Array>} Array of detected IP addresses
         */
        function detectWebRTCIP() {
            return new Promise((resolve) => {
                try {
                    const rtc = new RTCPeerConnection({
                        iceServers: [
                            {urls: 'stun:stun.l.google.com:19302'},
                            {urls: 'stun:stun1.l.google.com:19302'}
                        ]
                    });
                    let ips = [];
                    let candidateCount = 0;
                    
                    rtc.createDataChannel('');
                    
                    rtc.onicecandidate = function(e) {
                        candidateCount++;
                        
                        if (e.candidate) {
                            const candidate = e.candidate.candidate;
                            const ipMatch = candidate.match(/([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})/);
                            
                            if (ipMatch) {
                                const ip = ipMatch[1];
                                // Filter out private IPs
                                if (!ip.startsWith('192.168.') && 
                                    !ip.startsWith('10.') && 
                                    !ip.startsWith('172.') &&
                                    !ip.startsWith('127.') &&
                                    !ip.startsWith('169.254.') &&
                                    ip !== '0.0.0.0' &&
                                    !ips.includes(ip)) {
                                    ips.push(ip);
                                }
                            }
                        }
                        
                        // If no more candidates expected
                        if (!e.candidate || candidateCount > 10) {
                            rtc.close();
                            resolve(ips);
                        }
                    };
                    
                    rtc.createOffer()
                        .then(offer => rtc.setLocalDescription(offer))
                        .catch(() => resolve([]));
                    
                    // Timeout after 5 seconds
                    setTimeout(() => {
                        rtc.close();
                        resolve(ips);
                    }, 5000);
                    
                } catch (error) {
                    resolve([]);
                }
            });
        }

        /**
         * Copy text to clipboard with visual feedback
         * @param {HTMLElement} button - The copy button element
         */
        function copyToClipboard(button) {
            const infoItem = button.closest('.info-item');
            const value = infoItem.querySelector('.value');
            let text = value.textContent;
            
            // If data-ip exists, use it for copying (for IP fields)
            if (value.hasAttribute('data-ip') && value.getAttribute('data-ip')) {
                text = value.getAttribute('data-ip');
            }
            
            navigator.clipboard.writeText(text).then(() => {
                const originalIcon = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.style.background = '#98c379';
                button.style.borderColor = '#98c379';
                button.style.color = '#282c34';
                
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                    button.style.background = '#3e4451';
                    button.style.borderColor = '#528bff';
                    button.style.color = '#61afef';
                }, 1000);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });
        }

        /**
         * Update system and IP timezone information
         */
        function updateTimes() {
            const now = new Date();
            const ipTimezone = '${ipData.location?.timezone || 'UTC'}';
            const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // System Time/Zone
            const systemTime = now.toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
            document.getElementById('system-time-zone').textContent = systemTime + ' (' + systemZone + ')';
            document.getElementById('system-time-zone').className = 'value string';

            // IP Time/Zone
            let ipTime, ipZoneDisplay = ipTimezone;
            try {
                ipTime = now.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: ipTimezone,
                    timeZoneName: 'short'
                });
            } catch (e) {
                ipTime = 'Invalid timezone';
                ipZoneDisplay = 'Invalid timezone';
            }

            let isZoneEqual = (systemZone === ipTimezone);
            
            // Update IP time/zone display with mismatch indicator
            if (isZoneEqual) {
                document.getElementById('ip-time-zone').textContent = ipTime + ' (' + ipZoneDisplay + ')';
                document.getElementById('ip-time-zone').className = 'value string green';
            } else {
                document.getElementById('ip-time-zone').textContent = ipTime + ' (' + ipZoneDisplay + ') ❌';
                document.getElementById('ip-time-zone').className = 'value string red';
            }
            
            updateSecurityBadges();
        }

        /**
         * Update security warning badges
         */
        function updateSecurityBadges() {
            const badges = [];
            const ipTimezone = '${ipData.location?.timezone || 'UTC'}';
            const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // Check timezone mismatch
            if (systemZone !== ipTimezone) {
                badges.push('<span class="badge warning">Timezone Mismatch</span>');
            }
            
            // Check WebRTC IP leak
            if (webrtcDetected && webrtcIP && webrtcIP !== publicIP) {
                badges.push('<span class="badge">WebRTC IP Leak</span>');
            }
            
            document.getElementById('security-badges').innerHTML = badges.join('');
        }

        /**
         * Initialize page functionality when DOM is loaded
         */
        document.addEventListener('DOMContentLoaded', function() {
            // Add click handlers to copy buttons
            const copyButtons = document.querySelectorAll('.copy-btn');
            copyButtons.forEach(button => {
                button.addEventListener('click', () => copyToClipboard(button));
            });
            
            // Add fade-in animation to cards
            const cards = document.querySelectorAll('.info-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 50);
            });
            
            // Detect WebRTC IP
            detectWebRTCIP().then(ips => {
                const webrtcElement = document.getElementById('webrtc-ip');
                
                if (ips.length === 0) {
                    // WebRTC disabled or no public IPs found
                    webrtcElement.textContent = 'Disabled';
                    webrtcElement.className = 'value string';
                    webrtcElement.setAttribute('data-ip', '');
                } else {
                    webrtcDetected = true;
                    webrtcIP = ips[0]; // Use first detected IP
                    
                    // Get the country code for WebRTC IP
                    fetch('https://api.ipapi.is/?q=' + webrtcIP)
                        .then(response => response.json())
                        .then(webrtcData => {
                            const webrtcFlag = webrtcData.location?.country_code ? 
                                String.fromCodePoint(...webrtcData.location.country_code.toUpperCase().split('').map(char => 127397 + char.charCodeAt())) : '';
                            webrtcElement.setAttribute('data-ip', webrtcIP);
                            
                            if (webrtcIP === publicIP) {
                                // Same IP - no leak
                                webrtcElement.textContent = webrtcFlag + ' ' + webrtcIP + ' (No Leak)';
                                webrtcElement.className = 'value string green';
                            } else {
                                // Different IP - leak detected
                                webrtcElement.textContent = webrtcFlag + ' ' + webrtcIP + ' (IP Leaked) ❌';
                                webrtcElement.className = 'value string red';
                            }
                            updateSecurityBadges();
                        })
                        .catch(() => {
                            webrtcElement.setAttribute('data-ip', webrtcIP);
                            
                            // Fallback without flag if API fails
                            if (webrtcIP === publicIP) {
                                webrtcElement.textContent = webrtcIP + ' (No Leak)';
                                webrtcElement.className = 'value string green';
                            } else {
                                webrtcElement.textContent = webrtcIP + ' (IP Leaked) ❌';
                                webrtcElement.className = 'value string red';
                            }
                            updateSecurityBadges();
                        });
                }
            }).catch(() => {
                const webrtcElement = document.getElementById('webrtc-ip');
                webrtcElement.textContent = 'Detection Failed';
                webrtcElement.className = 'value string';
                webrtcElement.setAttribute('data-ip', '');
            });
            
            // Get browser languages
            const languages = navigator.languages || [navigator.language] || ['Unknown'];
            document.getElementById('browser-languages').textContent = languages.slice(0, 3).join(', ');
            document.getElementById('browser-languages').className = 'value string';
            
            // Initialize time updates
            updateTimes();
            setInterval(updateTimes, 1000);
        });
    </script>
</body>
</html>
`;

        return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
            status: 200,
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
