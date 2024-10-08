console.log("Hello World!", browser);

document.getElementById("encryptBtn").addEventListener("click", () => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { action: "encrypt" });
  });
});

document.getElementById("decryptBtn").addEventListener("click", () => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { action: "decrypt" });
  });
});




