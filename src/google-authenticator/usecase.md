Here’s a **professional README.md** file for your **Express.js + SQLite + Speakeasy** app. It covers installation, setup, API usage, and use cases.  

---

### **📌 README.md**

```md
# 🔐 Google Authenticator 2FA with Express.js & SQLite

This is a **Two-Factor Authentication (2FA)** system using **Google Authenticator** with **Speakeasy**, **SQLite**, and **Express.js**. It allows users to register, scan a QR code, and verify OTPs for secure authentication.

---

## 🚀 Features
✅ **User Registration** – Generates a secret and stores it in SQLite  
✅ **QR Code Generation** – Users can scan the QR code with Google Authenticator  
✅ **OTP Verification** – Users enter the OTP to validate their authentication  
✅ **SQLite Database** – Persistent storage for user secrets  
✅ **Express.js API** – RESTful API with JSON responses  

---

## 📦 Installation

1️⃣ **Clone the repository**
```sh
git clone https://github.com/yourusername/express-2fa.git
cd express-2fa
```

2️⃣ **Install dependencies**

```sh
npm install
```

3️⃣ **Run the server**

```sh
node server.js
```

Your server will start on **<http://localhost:5005>**

---

## 📌 API Endpoints

### 🆕 1. **Register a User & Get QR Code**

**Endpoint:** `POST /register`  
Registers a user, generates a secret, and returns a QR code for **Google Authenticator**.

```sh
curl -X POST http://localhost:5005/register -H "Content-Type: application/json" -d '{"username": "john"}'
```

✅ **Response:**

```json
{
  "message": "User registered",
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

📌 **Scan the QR code** using **Google Authenticator**.

---

### 🔑 2. **Verify OTP**

**Endpoint:** `POST /verify`  
Verifies the OTP entered by the user.

```sh
curl -X POST http://localhost:5005/verify -H "Content-Type: application/json" -d '{"username": "john", "token": "123456"}'
```

✅ **Response:**

```json
{
  "verified": true
}
```

📌 The token is valid for **30 seconds**.

---

### 🧑‍💻 3. **Get User’s Secret (For Debugging)**

**Endpoint:** `GET /user/:username`  
Retrieves the secret for a registered user.

```sh
curl -X GET http://localhost:5005/user/john
```

✅ **Response:**

```json
{
  "username": "john",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

---

## 📌 Use Cases

### ✅ 1. **Enhancing Login Security**

- Require users to enter an OTP during login for extra security.

### ✅ 2. **Securing Admin Panels**

- Protect admin dashboards with Google Authenticator-based OTP verification.

### ✅ 3. **Multi-Device Authentication**

- Users can authenticate across multiple devices using their secret.

---

## 📌 Requirements

- **Node.js** `>=14`
- **SQLite** (Included in the setup)
- **Google Authenticator** (iOS/Android)
