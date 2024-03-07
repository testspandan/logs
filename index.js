const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/clear-logs') {
    // Clear logs when receiving a POST request to '/clear-logs'
    fs.writeFile('request_logs.txt', '', (err) => {
      if (err) {
        console.error(err);
        res.writeHead(500);
        return res.end('Error clearing logs');
      }
      res.writeHead(200);
      return res.end('Logs cleared successfully');
    });
  } else {
    // Log incoming request if it's not for favicon.ico
    if (req.method !== 'GET' || req.url !== '/favicon.ico') {
      let logEntry = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;

      // Read request headers
      for (const [key, value] of Object.entries(req.headers)) {
        logEntry += `${key}: ${value}\n`;
      }

      // Read request body
      let requestBody = '';
      req.on('data', chunk => {
        requestBody += chunk.toString();
      });

      req.on('end', () => {
        // Append log entry to a file
        const logData = `${logEntry}\n${requestBody}\n--------\n`;
        fs.appendFile('request_logs.txt', logData, (err) => {
          if (err) console.error(err);
        });
      });
    }

    // Serve logs on domain root
    fs.readFile('request_logs.txt', 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading logs');
      }

      const logEntries = data.split('--------\n'); // Split logs by separator

      // Build HTML response with log entries
      let htmlResponse = '<html><head><title>Request Logs</title></head><body>';

      // Add clear button
      htmlResponse += '<form action="/clear-logs" method="post"><input type="submit" value="Clear Logs"></form>';

      // Add log content for each entry
      logEntries.forEach((entry, index) => {
        const entryId = `log-${index}`;
        // Add summary with a button to show details
        htmlResponse += `<div id="${entryId}">` +
                        `<div class="summary">${entry.split('\n')[0]}</div>` +
                        `<div class="details" style="display:none">${entry.replace(/\n/g, '<br>')}</div>` +
                        `<button onclick="toggleDetails('${entryId}')">Show Details</button></div><br>`;
      });

      // Add JavaScript for toggling details
      htmlResponse += `<script>function toggleDetails(id) {` +
                      `var details = document.getElementById(id).getElementsByClassName('details')[0];` +
                      `details.style.display = details.style.display === 'none' ? 'block' : 'none';` +
                      `}</script>`;

      htmlResponse += '</body></html>';

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(htmlResponse);
    });
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
