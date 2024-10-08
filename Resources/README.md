# <div align="center"></div>

## Description:

A Safari extension for encrypting Gmail email that utilizes both asymmetric encryption (RSA) and symmetric encryption (AES).

As it turned out, I was able to use the code for the Chrome extension project with minimal modification.

However, there is one additional requirement:  Safari will not access non-secure HTTP.  Therefore, a self-signed local certificate was used.

## Purposes:

This project demonstrates an easy and practical approach to encrypting Gmail emails using RSA public/private keys and AES encryption methods.

1.  The AES key is used to encrypt the email body text.
2.  RSA is used to encrypt an AES key.
3.  The encrypted AES key is sent along with the encrypted email body.
4.  On the receiving end, the encrypted AES key is extracted, decrypted, and used to decrypt the encrypted email body.
5.  The decrypted email text is then displayed in a new window.
6.  All encrypted data in the email is in base64 format. 

## Component Descriptions:

`keys` folder contains public keys for all recipient emails and the private key for current email user.  
`app.py`  is python code for a HTTPS server to provide public keys  
`content.js` is where all the action takes place.  
`keys_generator.py`  is a python code to generate RSA private/public key pairs.  

`self_sign.txt` Commands to generate the self-signed certificate for the local HTTPS server. 

Note:  You need to update the list of recipients and their corresponding public key files in app.py.  
You can also relocate your private_key.pem to another location if desired.

## Procedure:

1.  Install the extension. 

Sending:

1.  Run app.py
2.  Compose Gmail email.
3.  Select 'Encrypt' from the extension button dropdown.

Receiving:

1.  Open the encrypted email.
2.  Select 'Descrypt' from the extension button dropdown.

## Contributors 

ChatGPT - Whatever free version is available at the time:  The coding machine!

## Disclaimer

This project is provided "as is" and without any warranty. Use it at your own risk. 

   





