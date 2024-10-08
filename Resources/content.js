console.log("content.js activated");

browser.runtime.onMessage.addListener((message) => {
    console.log("Content Received message :", message);
  if (message.action === "encrypt") {
      console.log("Encrypt button clicked from content.js");
      // Find all span elements with an email attribute
      const emailSpans = document.querySelectorAll('span[email]');

      if (emailSpans.length > 0) {
          // Get the last span element in the NodeList
          const lastEmailSpan = emailSpans[emailSpans.length - 1];
          const recipientEmail = lastEmailSpan.getAttribute('email');

          console.log("Found recipient email:", recipientEmail);

          fetch(`https://localhost:5000/getPublicKey?email=${encodeURIComponent(recipientEmail)}`)
              .then(response => response.text())
              .then(publicKey => {
                  console.log("Fetched Public Key:", publicKey);
                  const composeBody = document.querySelector('div[aria-label="Message Body"]');
                  const text = composeBody.innerText;
                  encryptText(text, publicKey);  // Encrypt the message body with the fetched public key
              })
              .catch(error => console.error("Error fetching public key:", error));
      } else {
          console.error("No recipient email found.");
      }
  } else if (message.action === "decrypt") {
      console.log("Decrypt button clicked from content 1.js");
      const privateKeyUrl_browser_getURL = browser.runtime.getURL("keys/private_key.pem");
      console.log("privateKeyUrl_browser_getURL  : ", privateKeyUrl_browser_getURL);

      // Get the URL of the private_key.pem file using WebExtensions API
      const privateKeyUrl = browser.runtime.getURL("private_key.pem");

      fetch(privateKeyUrl)
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.text();
          })
          .then(privateKey => {
              console.log("decryptEmail Private Key:", privateKey);
              const emailBody = document.querySelector('div.a3s.aiL div[dir="ltr"]')?.innerText || "No body found";
              console.log('decryptEmail emailBody: ', emailBody);
              decryptText(emailBody, privateKey);
          })
          .catch(error => console.error("Error decrypting the email with the private key:", error));
      
  }
}, false);



// Encrypt button action
async function encryptText(text, publicKey) {
    console.log("encryptText text: ", text);
    console.log("encryptText publicKey: ", publicKey);

    // 1. Generate AES key
    const aesKey = await generateAESKey();
    console.log("encryptText aesKey: ", aesKey);

    // 2. Encrypt AES key with RSA
    const encryptedAESKey = await encryptAESKey(aesKey, publicKey);
    console.log("encryptText encryptedAESKey: ", encryptedAESKey);

    // 3. Encrypt the message with AES
    const { iv, encryptedMessage } = await encryptMessageWithAES(aesKey, text);

    // 4. Convert both to base64
    const encryptedAESKeyBase64 = arrayBufferToBase64(encryptedAESKey);
    const ivBase64 = arrayBufferToBase64(iv);
    const encryptedMessageBase64 = arrayBufferToBase64(encryptedMessage);

    // 5. Combine the encrypted AES key, IV, and message
    const combined = `${encryptedAESKeyBase64}:${ivBase64}:${encryptedMessageBase64}`;
    // combinedEncodedData = combined;
    console.log("Combined encrypted encoded text:", combined);
    document.querySelector('div[aria-label="Message Body"]').innerText = combined;
}

// Generate AES key
async function generateAESKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt the AES key with RSA
async function encryptAESKey(aesKey, publicKeyPem) {
    console.log("encryptedAESKey aeskey: ", aesKey);
    console.log("encryptedAESKey publicKeyPem: ", publicKeyPem);
    const publicKey = await importPublicKey(publicKeyPem); // Import the PEM public key
    console.log("encryptedAESKey publicKey: ", publicKey);

    const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);
    return await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        exportedKey
    );
}

// Encrypt the message with AES
async function encryptMessageWithAES(aesKey, message) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));  // IV for AES-GCM
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        aesKey,
        encodedMessage
    );

    return {
        iv: iv,
        encryptedMessage: encrypted
    };
}

// Base64 encoding
function arrayBufferToBase64(buffer) {
    const byteArray = new Uint8Array(buffer);
    const byteString = String.fromCharCode.apply(null, byteArray);
    return btoa(byteString);
}

// Base64 decoding
function base64ToArrayBuffer(base64) {
    const byteString = atob(base64);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }
    return byteArray.buffer;
}

// Helper function to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
    const base64 = pem
        .replace(/-----BEGIN [\w ]+-----/, "")
        .replace(/-----END [\w ]+-----/, "")
        .replace(/\s/g, '');
    console.log("pemToArrayBuffer base64: ", base64);
    return base64ToArrayBuffer(base64);
}


// Import the RSA public key
async function importPublicKey(pem) {
    const keyData = pemToArrayBuffer(pem);
    
    return window.crypto.subtle.importKey(
        "spki", // Format for public keys
        keyData,
        {
            name: "RSA-OAEP",
            hash: { name: "SHA-256" }
        },
        true,
        ["encrypt"]
    );
}

// Decrypt button action
async function decryptText(emailBody, priateKeyPem) {
    console.log("decryptText emailBody: ", emailBody);
    console.log("decryptText privateKeyPem: ", priateKeyPem);
    const combinedText = emailBody;
    const [encryptedAESKeyBase64, ivBase64, encryptedMessageBase64] = combinedText.split(":");
    console.log("decryptText encryptedAESKeyBase64: ", encryptedAESKeyBase64);
    console.log("decryptText ivBase64: ", ivBase64);
    console.log("decryptText encryptedMessageBase64: ", encryptedMessageBase64);

    // 1. Convert from base64 to ArrayBuffer
    const encryptedAESKey = base64ToArrayBuffer(encryptedAESKeyBase64);
    const iv = base64ToArrayBuffer(ivBase64);
    const encryptedMessage = base64ToArrayBuffer(encryptedMessageBase64);

    console.log("decryptText encryptedMessage: ", encryptedMessage);
    // 2. Decrypt AES key with RSA
    const aesKey = await decryptAESKey(encryptedAESKey, priateKeyPem);
    console.log("decryptText aesKey: ", aesKey);

    // 3. Decrypt the message with AES
    const decryptedMessage = await decryptMessageWithAES(aesKey, iv, encryptedMessage);
    console.log("Decrypted message:", decryptedMessage);
    // Display the result in a popup window
    displayText(decryptedMessage);
}

// Function to escape HTML special characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}


function displayText(text) {
    // Open the popup window
    const popup = window.open("", "Decrypted Email", "width=600,height=400");

    // Check if the popup was successfully created
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        alert("Popup blocked! Please allow popups for this site.");
        return;
    }

    // Ensure the document is open for writing
    popup.document.open();

    // Write HTML content to the popup
    popup.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Decrypted Email</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    line-height: 1.6;
                }
                pre {
                    background-color: #f4f4f4;
                    border: 1px solid #ddd;
                    padding: 10px;
                    white-space: pre-wrap; /* Allows for text wrapping */
                    word-wrap: break-word; /* Ensures long lines break correctly */
                }
            </style>
        </head>
        <body>
            <h1>Decrypted Email</h1>
            <pre>${escapeHtml(text)}</pre>
        </body>
        </html>
    `);

    // Close the document to finish writing
    popup.document.close();
}

// Decrypt the AES key with RSA
async function decryptAESKey(encryptedAESKey, privateKeyPem) {

    console.log("decryptAESKey privateKeyPem:", privateKeyPem);
    const privateKey = await importPrivateKey(privateKeyPem); // Import the PEM private key
    console.log("decryptAESKey privateKey:", privateKey);

    const decryptedKey = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        privateKey,
        encryptedAESKey
    );
    return window.crypto.subtle.importKey(
        "raw",
        decryptedKey,
        { name: "AES-GCM" },
        true,
        ["decrypt"]
    );
}

// Decrypt the message with AES
async function decryptMessageWithAES(aesKey, iv, encryptedMessage) {
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        aesKey,
        encryptedMessage
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// Import the RSA private key
async function importPrivateKey(pem) {
    console.log("importPrivateKey pem:", pem);
    const keyData = pemToArrayBuffer(pem);
    console.log("importPrivateKey keyData:", keyData);
    
    return window.crypto.subtle.importKey(
        "pkcs8", // Format for private keys
        keyData,
        {
            name: "RSA-OAEP",
            hash: { name: "SHA-256" }
        },
        true,
        ["decrypt"]  // For descryption
    );
}



