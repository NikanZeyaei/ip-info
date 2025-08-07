addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

function parseUserAgent(ua) {
  if (!ua || ua === 'Unknown') return { browser: 'Unknown', os: 'Unknown', platform: 'Unknown' };
  
  let browser = 'Unknown', os = 'Unknown', platform = 'Unknown';
  
  if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';
  
  if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'Chrome OS';
  
  if (/mobile/i.test(ua)) platform = 'Mobile';
  else if (/tablet/i.test(ua)) platform = 'Tablet';
  else platform = 'Desktop';
  
  return { browser, os, platform };
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

async function handleRequest(request) {
  try {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'Unknown';
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const uaInfo = parseUserAgent(userAgent);
    
    const ipApiUrl = `http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query`;
    const ipResponse = await fetch(ipApiUrl);
    const ipData = await ipResponse.json();

    if (ipData.status !== 'success') {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch IP information' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const acceptHeader = request.headers.get('Accept') || '';
    const isCurl = (userAgent && userAgent.toLowerCase().includes('curl')) || acceptHeader.includes('application/json');
    const flagEmoji = getFlagEmoji(ipData.countryCode);

    if (isCurl) {
      const cyan = '\x1b[36m', green = '\x1b[32m', yellow = '\x1b[33m', magenta = '\x1b[35m', red = '\x1b[31m', reset = '\x1b[0m', bold = '\x1b[1m';
      const output = `
${bold}${cyan}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${reset}
${bold}${cyan}┃        IP Information           ┃${reset}
${bold}${cyan}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${reset}

${bold}${green}IP:        ${reset}${clientIp}
${bold}${green}Country:   ${reset}${flagEmoji} ${ipData.country || 'Unknown'}
${bold}${green}Region:    ${reset}${ipData.regionName || 'Unknown'}
${bold}${green}City:      ${reset}${ipData.city || 'Unknown'}
${bold}${green}ISP:       ${reset}${ipData.isp || 'Unknown'}
${bold}${green}Lat:       ${reset}${ipData.lat || 'Unknown'}
${bold}${green}Lon:       ${reset}${ipData.lon || 'Unknown'}
${bold}${green}TZ:        ${reset}${ipData.timezone || 'Unknown'}
${bold}${yellow}Proxy:     ${reset}${ipData.proxy ? `${red}Yes${reset}` : `${green}No${reset}`}
${bold}${yellow}Hosting:   ${reset}${ipData.hosting ? `${red}Yes${reset}` : `${green}No${reset}`}

${bold}${magenta}User Agent:${reset} ${userAgent}
`;
      return new Response(output, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        status: 200,
      });
    }

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
              min-height: 100vh;
              overflow-x: hidden;
              position: relative;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 1.6;
          }

          .container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: auto;
              gap: 20px;
              width: 100%;
              max-width: 1400px;
              margin: 0 auto;
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
              min-height: 400px;
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

          @media (max-width: 768px) {
              .container {
                  grid-template-columns: 1fr;
                  grid-template-rows: auto auto;
                  padding: 15px;
              }
              
              .grid-item {
                  grid-column: 1 !important;
                  grid-row: auto !important;
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
          <div class="container">
              <div class="info-card grid-item">
                  <div class="card-header">
                      <i class="fas fa-code"></i>
                      <h2>IP Information</h2>
                  </div>
                  <div class="card-content">
                      <div class="info-item">
                          <span class="label">IP Address</span>
                          <span class="value string">${clientIp}</span>
                          <button class="copy-btn" title="Copy">
                              <i class="fas fa-copy"></i>
                          </button>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">Country</span>
                          <span class="value string">${flagEmoji} ${ipData.country || 'Unknown'}</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">ISP</span>
                          <span class="value string">${ipData.isp || 'Unknown'}</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">Region</span>
                          <span class="value string">${ipData.regionName || 'Unknown'}</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">City</span>
                          <span class="value string">${ipData.city || 'Unknown'}</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">Coordinates</span>
                          <span class="value string">${ipData.lat || 'Unknown'}, ${ipData.lon || 'Unknown'}</span>
                          <button class="copy-btn" title="Copy">
                              <i class="fas fa-copy"></i>
                          </button>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">Proxy</span>
                          <span class="value boolean ${ipData.proxy ? 'red' : 'green'}">${ipData.proxy ? 'true' : 'false'}</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">Hosting</span>
                          <span class="value boolean ${ipData.hosting ? 'red' : 'green'}">${ipData.hosting ? 'true' : 'false'}</span>
                      </div>
                  </div>
              </div>

              <div class="info-card grid-item">
                  <div class="card-header">
                      <i class="fas fa-terminal"></i>
                      <h2>Device Information</h2>
                  </div>
                  <div class="card-content">
                      <div class="info-item">
                          <span class="label">Operating System</span>
                          <span class="value string">${uaInfo.os}</span>
                      </div>

                      <div class="info-item">
                          <span class="label">Browser</span>
                          <span class="value string">${uaInfo.browser}</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">Platform</span>
                          <span class="value string">${uaInfo.platform}</span>
                      </div>
                    
                      <div class="info-item">
                          <span class="label">User Agent</span>
                          <span class="value string">${userAgent}</span>
                          <button class="copy-btn" title="Copy">
                              <i class="fas fa-copy"></i>
                          </button>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">System Time</span>
                          <span class="value string" id="system-time">Loading...</span>
                      </div>

                      <div class="info-item">
                          <span class="label">System Zone</span>
                          <span class="value string" id="system-zone">Loading...</span>
                      </div>

                      <div class="info-item">
                          <span class="label">IP Time</span>
                          <span class="value string" id="ip-time">Loading...</span>
                      </div>
                      
                      <div class="info-item">
                          <span class="label">IP Zone</span>
                          <span class="value string" id="ip-zone">${ipData.timezone || 'Unknown'}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          <script>
              function copyToClipboard(button) {
                  const infoItem = button.closest('.info-item');
                  const value = infoItem.querySelector('.value');
                  const text = value.textContent;
                  
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
                      const textArea = document.createElement('textarea');
                      textArea.value = text;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                  });
              }

              function updateTimes() {
                  const now = new Date();

                  const ipTimezone = '${ipData.timezone || 'UTC'}';
                  const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                  const systemTime = now.toLocaleString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZoneName: 'short'
                  });

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

                  document.getElementById('system-time').textContent = systemTime;
                  document.getElementById('system-time').className = 'value string';

                  document.getElementById('system-zone').textContent = systemZone;
                  document.getElementById('system-zone').className = 'value string';

                  document.getElementById('ip-time').textContent = ipTime;
                  document.getElementById('ip-zone').textContent = ipZoneDisplay;

                  let isZoneEqual = (systemZone === ipTimezone);
                  let isTimeEqual = false;
                  try {
                      const sysTime = now.toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                      });
                      const ipTimeOnly = now.toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                          timeZone: ipTimezone
                      });
                      isTimeEqual = (sysTime === ipTimeOnly);
                  } catch (e) {}

                  document.getElementById('ip-time').className = 'value string' + (isTimeEqual ? '' : ' red');
                  document.getElementById('ip-zone').className = 'value string' + (isZoneEqual ? '' : ' red');
              }

              document.addEventListener('DOMContentLoaded', function() {
                  const copyButtons = document.querySelectorAll('.copy-btn');
                  copyButtons.forEach(button => {
                      button.addEventListener('click', () => copyToClipboard(button));
                  });
                  
                  const cards = document.querySelectorAll('.info-card');
                  cards.forEach((card, index) => {
                      setTimeout(() => {
                          card.classList.add('fade-in');
                      }, index * 50);
                  });
                  
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