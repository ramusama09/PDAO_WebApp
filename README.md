# PDAO_WebApp

**PDAO_WebApp** is an integrated system for generating and managing Person With Disability (PWD) IDs, designed for local government units and public service offices. It allows efficient handling of PWD user data, ID issuance, and transaction logging, with specific interfaces for admins, PWD users, and store owners/cashiers.

---

## 🔐 Security Notice

> ⚠️ **API Keys Disclosure Notice**  
> All API keys, Firebase credentials, and configuration files included in this repository are **deprecated** and no longer active.  
> They are kept in the repo strictly for demonstration and development purposes only.  
> **Do not reuse them in production environments.**

---

## 🌟 Overview

This system serves three types of users:

### 🔧 Admins / PDAO Staff (Web Console)
- Complete and manage PWD user profiles.
- Generate PWD IDs with QR codes.
- View ID validity (active or expired).
- Update sensitive health information.
- View all user transactions.

> 🔗 **Looking for the Mobile App version?** Visit the companion repo here:  
> [https://github.com/ramusama09/PDAO_App](https://github.com/ramusama09/PDAO_App)

---

### 👤 PWD Users & 🛒 Store Owners / Cashiers (Mobile App)
- PWDs can update personal information (excluding health-related data).
- View their PWD ID and status.
- Access full transaction history.
- Store owners/cashiers can scan QR codes to verify identity and status.
- Record and track transactions linked to the PWD ID.

> 🔗 **Looking for the Admin Web Console?** Visit the web app repo here:  
> [https://github.com/ramusama09/PDAO_WebApp](https://github.com/ramusama09/PDAO_WebApp)

---

## 🛠️ Technologies Used

### Web Admin Console
- **Frontend:** HTML5, CSS, Bootstrap, JavaScript
- **Backend:** ASP.NET (C#)
- **Database:** Firebase (Realtime Database / Firestore)

### Mobile App
- **Platform:** Android (Java & Kotlin)
- **Database:** Firebase (Realtime Database / Firestore)

---

## 🔑 Features

- Secure, role-based access system
- ID generation with embedded QR codes
- Real-time syncing with Firebase
- Admin dashboard for monitoring users and transactions
- Controlled health data updates (by admins only)
- QR code scanning for instant verification and logging
- Transaction tracking per user

---

## 🚧 Roadmap

- [x] Web admin portal for PDAO staff
- [x] Mobile app for users and store owners
- [ ] Website access for PWD users (future feature)
- [ ] Notifications for ID expirations
- [x] Reporting and analytics tools for admins
