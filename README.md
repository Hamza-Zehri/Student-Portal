# Student Portal - Setup Guide

This guide will help you set up and run the Student Portal project on a new computer.

---

## Prerequisites

1. **Node.js** (v14 or higher)
   - Download and install from: https://nodejs.org/
2. **MongoDB**
   - Download and install from: https://www.mongodb.com/try/download/community
   - Make sure MongoDB is running (see below).
3. **Git** (optional, for cloning the repo)
   - Download and install from: https://git-scm.com/

---

## Project Structure

```
Student-Portal/
  backend/           # Node.js/Express backend (API)
  server/            # Frontend (HTML, CSS, JS)
```

---

## 1. Clone or Copy the Project

- If you have a zip, extract it.
- If using Git:
  ```sh
  git clone <repo-url>
  cd Student-Portal
  ```

---

## 2. Install Backend Dependencies

Open a terminal and run:
```sh
cd backend
npm install
```

---

## 3. Set Up Environment Variables

- Create a `.env` file in the `backend` folder (if not present).
- Example contents:
  ```env
  MONGO_URI=mongodb://localhost:27017/Student-Portal
  JWT_SECRET=your_jwt_secret
  JWT_EXPIRE=7d
  PORT=5001
  ```
- You can change the database name or port if needed.

---

## 4. Start MongoDB

- **Windows:**
  - Open Command Prompt and run:
    ```sh
    "C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
    ```
  - Or use MongoDB Compass (GUI) to start the service.
- **Mac/Linux:**
  ```sh
  mongod
  ```

---

## 5. Start the Backend Server

In a terminal:
```sh
cd backend
npm start
```
- The backend will run on [http://localhost:5001](http://localhost:5001)

---

## 6. Start the Frontend (Static Server)

- Open `server/index.html` in your browser **OR**
- Use a simple static server (recommended for CORS):
  ```sh
  cd server
  npx serve .
  ```
  - Then open the provided local URL (e.g., http://localhost:3000)

---

## 7. Using the App

- Register as an admin or student.
- Log in and use the dashboard features.
- Admin can manage students, courses, and results.
- Students can view and download their transcript.

---

## Troubleshooting

- **MongoDB connection error:**
  - Make sure MongoDB is running and the URI in `.env` is correct.
- **Port in use:**
  - Change the `PORT` in `.env` or stop other apps using that port.
- **CORS issues:**
  - Use a static server for the frontend, not just double-clicking HTML files.
- **Data not saving:**
  - Check backend logs for errors.
  - Make sure you are using the correct API endpoints.

---

## Useful Commands

- Install dependencies: `npm install`
- Start backend: `npm start`
- Start static server: `npx serve .`

---

## Need Help?
If you get stuck, check the error messages in your terminal and browser console, or ask for help! 