# CNNCT - Backend

## Overview

The backend of CNNCT handles scheduling, user management, and event processing. It ensures seamless communication between the frontend and the database, while also maintaining error logging for better debugging.

## Features

### Event & Scheduling Management
- Manages event creation, updating, and deletion.
- Checks for availability conflicts before scheduling.

### User Management
- Handles authentication and user profiles.
- Stores and retrieves user availability settings.

### Logging System
- Logs errors and stores them in a designated folder for debugging.
- Ensures better tracking of backend issues.

## Tech Stack

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** (Database)

### Additional Tools
- **Winston** (for logging errors)

## Installation

Follow these steps to set up the backend locally:

```sh
# Clone the repository
git clone https://github.com/var-shikhar/cnnct-event-mangement-BE-Cuvette.git
cd cnnct-event-mangement-BE-Cuvette

# Install dependencies
npm install

# Copy environment variables template and configure settings
cp .env.example .env

# Start the backend server
npm run dev
```

## Usage & Code Structure

### Modularized Codebase
- The backend is structured for better maintainability and scalability.
- Routes, controllers, and services are organized into separate modules.

### Logging System
- Uses `Winston` for error logging.
- Logs are stored in a designated folder for debugging and monitoring.

### Authentication & Security
- Uses JWT for secure authentication.
- Implements refresh tokens for maintaining user sessions.
- Passwords are securely hashed using bcrypt with a defined salt.

## Environment Variables

Ensure you configure the `.env` file with the required credentials:

```env
PORT=your_backend_port
FRONTEND_PORT=your_frontend_port
DEV_FRONTEND_PORT=your_dev_frontend_port
RENDER_FRONTEND_PORT=your_render_frontend_port
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
SALT=your_salt_value
NODE_ENV=development_or_production

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
RESET_PASSWORD_SECRET=your_reset_password_secret
```


## Contact

For more details, reach out to:

**Shikhar Varshney**  
📧 Email: [shikharvarshney10@gmail.com](mailto:shikharvarshney10@gmail.com)
