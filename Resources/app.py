from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all origins

# Simulated static file with email to public key mapping
public_keys = {
    "user1@gmail.com": "public_key_1.pem",
    "User2@gmail.com": "public_key_2.pem",
    "User3@gmail.com": "public_key_3.pem"
}

# Path to the directory containing the .pem files
public_key_directory = "./keys"  # Path where you store your .pem files


@app.route('/getPublicKey')
def get_public_key():
    email = request.args.get('email')  # Access the 'email' query parameter
    print(f"Email to find in public key mapping: {email}")
    if email in public_keys:
        filename = public_keys[email]

        # Log the file path to debug
        full_path = os.path.join(public_key_directory, filename)
        print(f"Fetching public key for {email}: {full_path}")

        # Serve the public key file content directly
        try:
            return send_from_directory(public_key_directory, filename)
        except Exception as e:
            print(f"Error sending file: {e}")
            return jsonify({"error": "Public key file not found"}), 404
    else:
        print(f"Email not found in public key mapping: {email}")
        return jsonify({"error": "Public key not found"}), 404

if __name__ == '__main__':
    # Use SSL context to run the app over HTTPS
    context = ('localhost.crt', 'localhost.key')  # Path to the certificate and key
    app.run(host='0.0.0.0', port=5000, ssl_context=context)

