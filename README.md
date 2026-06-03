# GrabNGo ⚡ Order Local. Pickup Fast.

GrabNGo is a high-fidelity, premium web platform designed to connect consumers directly with neighborhood local merchants for fast, queue-free pickup packages. By enabling self-pickup and local delivery booking pipelines, the system eliminates high delivery platform markups, tipping fees, and delivery delays.

---

## 🚀 Key Features

### 1. Customer Experience (Home Portal)
* **Interactive Merchant Discovery:** Search local stores and filter by categories (Grocery 🛒, Bakery 🍞, Pharmacy 💊, Vegetables 🥦, etc.) based on geocoding coordinate radius.
* **Smart Shopping Cart:** Aggregate items from a specific shop, adjust quantities in real-time, and place orders.
* **Flexible Delivery Modes:** Toggle between **🚶 Self-Pickup** and **🛵 Home Delivery**.
* **Handwritten List Uploads:** Submit custom grocery list text files directly to local stores for manual bagging.
* **Real-time Order Tracking:** Live order updates showing prep timelines and current packaging status.

### 2. Shop Owner Workspace (Merchant Dashboard)
* **Operational Control Panel:** Toggle store open/closed states instantly to stop/start incoming bookings.
* **Real-time Packaging Desk:** Manage placed orders in a queue with interactive checklists for items.
* **Product Catalog Management:** Dynamic CRUD features to add, delete, configure stock quantities, and select product asset images.
* **Live Store Metrics:** Real-time summary statistics tracking Gross Revenue, complete pickups, registered catalog count, and total order volume.

### 3. Administrator Console (Platform Control)
* **Merchant Approvals:** Verify newly onboarded shop applications and grant/revoke platform operations clearance.
* **User Registry Control:** Search, modify role badges, and manage account security states for all users.
* **Category Configuration:** Dynamically expand shop categories across the platform with customized emoji icons.

---

## 🛠️ Technology Stack

* **Frontend:**
  * [React.js](https://react.dev/) + [Vite](https://vite.dev/) (Fast Hot Module Replacement)
  * [Lucide React](https://lucide.dev/) (Modern iconography)
  * Custom Glassmorphism UI (Tailored design system with Outifit + Inter fonts and animated gradient mesh backdrops)
* **Backend:**
  * [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (Modular API router framework)
  * JSON Mock DB Engine (Dynamic file-write mock schema model system)
  * JWT (JSON Web Tokens) for role-based authorization guards

---

## 📂 Repository Directory Structure

```text
GrabNGo/
├── client/                     # React + Vite Frontend application
│   ├── public/                 # Static images, assets, and icons
│   │   ├── admin_hero.png      # Cybernetic Admin banner graphic
│   │   ├── customer_hero.png   # Sunlit fresh market graphic
│   │   ├── login_banner.png    # 3D food locker pick-up graphic
│   │   └── owner_hero.png      # Shopkeeper packing box graphic
│   ├── src/
│   │   ├── context/            # Auth, Location, and Cart state providers
│   │   ├── pages/              # Dashboards, Login, Register, ShopDetail, etc.
│   │   ├── index.css           # Premium CSS Design System & Gradient Animations
│   │   └── App.jsx             # Core router and layout container
│   └── package.json
│
├── server/                     # Node.js Express Backend
│   ├── config/                 # Mock Database controllers and JSON seed data
│   ├── middleware/             # Route JWT auth validation guards
│   ├── routes/                 # Shops, Products, Orders, Admin API endpoints
│   ├── server.js               # Express entry point
│   └── package.json
│
└── README.md                   # System documentation
```

---

## 💻 Startup & Installation Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/koushikmadisetty/grabNgo.git
cd grabNgo
```

### Step 2: Set Up Backend Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `server/` directory and configure environment keys:
   ```env
   PORT=5000
   JWT_SECRET=supersecretjwtkeyforroleauthorization
   ```
4. Start the API server:
   ```bash
   npm run dev
   ```
   *The server runs locally at `http://localhost:5000`.*

### Step 3: Set Up Client Frontend
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development build:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to access the application.*

---

## 🔐 Accounts Autofill Credentials (For Quick Testing)

During development, you can use the **Autofill** buttons on the Login page to instantly test different access levels:
* **Admin Profile:** `saikoushik510@gmail.com` / ``
* **Shop Owner Profile:** `owner@grabngo.com` / `Password123`
* **Customer Profile:** `customer@grabngo.com` / `Password123`
