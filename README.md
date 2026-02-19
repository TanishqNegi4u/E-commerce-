# 🛒 E-Commerce Platform

A fully functional full-stack e-commerce web application built with Java Spring Boot and deployed on the cloud. Users can browse products, manage their cart, and complete purchases through a clean and responsive interface.

🔗 **Live Demo:** [e-commerce-1dyu.onrender.com](https://e-commerce-1dyu.onrender.com/)

> ⚠️ Note: Hosted on Render's free tier — the server may take 30–60 seconds to wake up on first load. Please be patient!

---

## ✨ Features

- 🏠 **Home Page** — Browse all available products with images and pricing
- 🔍 **Product Listings** — View detailed product information
- 🛒 **Shopping Cart** — Add, remove, and update product quantities
- 👤 **User Authentication** — Secure login and registration system
- 📦 **Order Management** — Place and track orders
- 📱 **Responsive Design** — Works smoothly on desktop and mobile
- 🗄️ **Database Integration** — Persistent data storage with SQL

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java, Spring Boot |
| Frontend | HTML, CSS, JavaScript |
| Database | SQL (MySQL / H2) |
| Authentication | Spring Security / Session Management |
| Deployment | Render (Cloud) |
| Version Control | Git & GitHub |

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Java 17+
- Maven
- MySQL (or use H2 in-memory for testing)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tanishqnegi/e-commerce.git

# 2. Navigate to project directory
cd e-commerce

# 3. Configure your database in application.properties
# (update DB username, password, and URL)

# 4. Build and run
mvn spring-boot:run
```

Then open your browser at: `http://localhost:8080`

---

## 📁 Project Structure

```
e-commerce/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/ecommerce/
│   │   │       ├── controller/    # REST Controllers
│   │   │       ├── model/         # Entity Classes
│   │   │       ├── repository/    # JPA Repositories
│   │   │       └── service/       # Business Logic
│   │   └── resources/
│   │       ├── templates/         # HTML Templates
│   │       └── application.properties
└── pom.xml
```

---

## 🌐 Deployment

This project is deployed on **Render** cloud platform using a free-tier web service.

- Auto-deploys on every push to the `main` branch
- Connected to a cloud-hosted SQL database

---

## 👨‍💻 Author

**Tanishq Negi**
- 📧 tanishqn8@gmail.com
- 🌍 Saharanpur, Uttar Pradesh
- 💼 MCA Student | Uttaranchal University (2025–2027)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ If you found this project useful, please consider giving it a star!
