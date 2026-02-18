A full-stack e-commerce app built with **Spring Boot (Java 17)** + **MySQL / PostgreSQL** backend and a clean **HTML/CSS/JS** frontend with modern **dark theme**.

## ✨ What's New in This Version

### 🔧 Fixed Issues
- ✅ **Dockerfile Java version mismatch** - Updated from Java 21 to Java 17
- ✅ **Frontend-Backend Connection** - Auto-detects environment and connects appropriately
- ✅ **Dark Theme UI** - Professional dark mode with high contrast and better visibility
- ✅ **Button Visibility** - Enhanced button styles with clear hover states
- ✅ **Form Improvements** - Better input field visibility and focus states
- ✅ **Production Ready** - All configuration optimized for deployment

## 📁 Project Structure
ShopWave/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/com/shopwave/
│       │   ├── controller/
│       │   ├── service/
│       │   ├── model/
│       │   ├── repository/
│       │   ├── security/
│       │   └── config/
│       └── resources/application.properties
└── database/schema.sql
## 🚀 Quick Start
```bash
# 1. Database
mysql -u root -p
CREATE DATABASE shopwave;
exit;
mysql -u root -p shopwave < database/schema.sql

# 2. Backend
cd backend
mvn spring-boot:run

# 3. Frontend - open frontend/index.html in browser
Admin login: admin@shopwave.com / admin123