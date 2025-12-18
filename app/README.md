# Rent Calculator - MERN Stack Application

A full-stack rent management system built with MongoDB, Express.js, React, and Node.js.

## Features

### Backend (Node.js + Express + MongoDB)
- **Authentication System**: JWT-based authentication with secure password hashing
- **User Management**: Register, login, and user profile management
- **Property Management**: CRUD operations for properties
- **Tenant Management**: CRUD operations for tenants with emergency contacts
- **Rent Entry Management**: Track rent payments, due dates, and payment status
- **Statistics Dashboard**: Real-time statistics for pending, paid, and overdue rent

### Frontend (React)
- **Multi-page Application**: Dashboard, Properties, Tenants, Rent Entries pages
- **Authentication**: Login and Registration pages with protected routes
- **Responsive Design**: Mobile-friendly UI with gradient themes
- **Real-time Updates**: Automatic calculation of total pending rent
- **CRUD Operations**: Create, read, update, and delete functionality for all entities

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend**: React 19, React Router DOM, Axios
- **Database**: MongoDB

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB installed and running locally
- npm package manager

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
# From root directory
npm install
```

### Step 3: Start MongoDB
Make sure MongoDB is running:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or manually
mongod
```

### Step 4: Run the Application

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm start
```

Frontend: http://localhost:3000  
Backend API: http://localhost:5000

## Troubleshooting

### Port 5000 Already in Use
```bash
lsof -ti:5000
kill -9 <PID>
```

### MongoDB Connection Error
```bash
brew services start mongodb-community
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
