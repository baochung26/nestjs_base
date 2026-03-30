/**
 * HTML template cho trang Unauthorized của Bull Board
 * Pure function - không phụ thuộc Nest/Express
 */
export function renderBullBoardUnauthorizedHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unauthorized - Bull Board</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 420px;
    }
    h1 { color: #e74c3c; margin-bottom: 10px; font-size: 1.5rem; }
    p { color: #666; margin-bottom: 20px; line-height: 1.5; }
    .info {
      margin-top: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 13px;
      text-align: left;
      line-height: 1.6;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 Unauthorized</h1>
    <p>${escapeHtml(message)}</p>
    <div class="info">
      <strong>Bull Board requires secret key</strong><br><br>
      Provide the key via:<br>
      • Query string: <code>?key=YOUR_SECRET_KEY</code><br>
      • Header: <code>X-Bull-Board-Key: YOUR_SECRET_KEY</code>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
