# Garuda Urbanlines - Implementation Plan

## Overview
Garuda Urbanlines is a modern, responsive online bus booking application prioritizing a premium user experience and administrative autonomy. Built using the MERN stack (MongoDB, Express, React, Node.js), it empowers the operator to manage their fleet, schedules, layout, and bookings directly without paying commissions to third-party aggregators.

The distinguishing feature of the app will be its design philosophy: **The Gradient of Journey**. The UI will feature continuous, subtle, and multi-color gradient transitions across key components. To maintain structural integrity, the color phase will be synchronized globally—meaning headers, borders, and active elements will share the exact same color tone at any given second, slowly shifting together over time.

## Proposed Changes

### 1. Project Initialization
- Create a root directory for the project.
- Set up a React app using Vite for the frontend (`/client`).
- Set up an Express server for the backend (`/server`).

### 2. Database Schema Design (MongoDB)
- **User Schema:** Identity management (Admin, Customer). Predefined Admin credentials will be seeded into the database.
- **Bus & Seat Layout Schema:** Fleet management, specific sleeper/seater configurations, dimensions, and amenities.
- **Route & Point Schema:** Sequence of boarding and dropping points.
- **Schedule/Trip Schema:** Linking a bus to a route on specific dates/times, defining pricing dynamically.
- **Booking Schema:** Blocked, reserved, and confirmed seats linked to users and schedules.
- **Offer Schema:** Discount logic and promo codes.

### 3. Core Features - Admin
- A predefined Admin account with features to change username/password.
- A comprehensive dashboard to securely define routes, buses, custom sleeper seat charts, and schedules. 
- Capabilities to manage prices, boarding/dropping points, and control promotional offers.

### 4. Core Features - Customer
- **Browsing Flow:** Customers can search for buses, view schedules, and inspect seat layouts without logging in.
- **Auth & Booking Flow:** To proceed to checkout/booking, the user must log in or register.
- **Gradient-Themed UI:** A search form and seat layout utilizing subtle, universally synchronized multi-color gradients.
- **Email Integration:** Send OTPs and Tickets via Email. We will use an API-based email provider (like Resend or SendGrid via their Node SDK) rather than raw SMTP via Nodemailer to ensure compatibility with serverless/https deployment environments.
- **Payment Integration:** Secure payment gateway integration (e.g., Stripe or Razorpay) to be implemented in the final phase.

### 5. Design Philosophy Implementation
We will implement a global CSS/React Context system to drive the primary multi-color gradient palette. Using CSS variables synced via a central timer or synchronized CSS keyframes, we will ensure that the current gradient shade is identical across all components simultaneously, providing a subtle but deeply unified brand experience.

## Verification Plan
### Automated Tests
- Postman/Backend test suites to verify API endpoints (Booking integrity, Auth logic).

### Manual Verification
- Verify the browsing experience works for unauthenticated users, while booking strictly requires authentication.
- Visually test the gradient aesthetics to ensure they are subtle, multi-colored, and perfectly globally synchronized.
- Complete end-to-end manual flows: Schedule creation (Admin), booking a sleeper seat (Customer), receiving the email ticket, and payment integration.
