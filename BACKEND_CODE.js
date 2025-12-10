// ----------------------------------------------------------------
// INSTRUCTIONS
// 1. Go to https://sheets.new to create a new Google Sheet.
// 2. Go to Extensions > Apps Script.
// 3. Delete any code there and paste ALL the code below.
// 4. Click "Deploy" > "New Deployment".
// 5. Select type: "Web App".
// 6. Set "Who has access" to "Anyone" (Crucial!).
// 7. Click Deploy and copy the "Web App URL".
// 8. Paste that URL into the Setup screen on your Display View.
// ----------------------------------------------------------------

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  
  // Convert rows to objects (Assuming Row 1 is headers)
  // If sheet is empty, return empty array
  if (rows.length <= 1) {
    return outputJSON({ messages: [] });
  }

  const messages = rows.slice(1).map(row => ({
    id: row[0],
    text: row[1],
    author: row[2],
    timestamp: row[3],
    x: row[4],
    y: row[5],
    color: row[6],
    font: row[7],
    rotation: row[8],
    scale: row[9]
  }));

  return outputJSON({ messages: messages });
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'add') {
      const msg = data.message;
      // Append row: ID, Text, Author, Timestamp, Visuals...
      sheet.appendRow([
        msg.id, 
        msg.text, 
        msg.author, 
        msg.timestamp,
        msg.x, msg.y, msg.color, msg.font, msg.rotation, msg.scale
      ]);
      return outputJSON({ status: 'success' });
    }
    
    if (data.action === 'clear') {
      sheet.clearContents();
      sheet.appendRow(['ID', 'Text', 'Author', 'Timestamp', 'X', 'Y', 'Color', 'Font', 'Rotation', 'Scale']);
      return outputJSON({ status: 'cleared' });
    }
    
    return outputJSON({ error: 'Unknown action' });
  } catch(err) {
    return outputJSON({ error: err.toString() });
  }
}

function outputJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}