# NestJS Authentication Project

## Description

This project is a robust authentication system built with NestJS, a progressive Node.js framework. It provides a secure and scalable backend for user authentication, including features like sign-up, sign-in, token refresh, and user profile retrieval.

## Features

- User registration (sign-up)
- User authentication (sign-in)
- JWT-based authentication
- Token refresh mechanism
- User profile retrieval
- MongoDB integration
- Swagger API documentation
- Environment-based configuration
- Error handling with custom exception filter
- Unit and integration testing

## Project Structure

The project follows a modular structure, with the main components organized as follows:

- `src/`: Contains the source code of the application
  - `auth/`: Authentication module (controllers, services, strategies, guards)
  - `user/`: User module (controllers, services, schemas)
  - `common/`: Shared components (filters, etc.)
  - `config/`: Configuration module
  - `database/`: Database module
- `test/`: Contains test files

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.development` file in the root directory and add the following variables:
   ```
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
   JWT_EXPIRATION=3600
   JWT_REFRESH_EXPIRATION=604800
   PORT=3000
   LOG_LEVEL=info
   FRONTEND_URL=http://localhost:3000
   ```

## Running the Application

1. Start the development server:
   ```
   npm run start:dev
   ```

2. The application will be available at `http://localhost:3000/api`

## API Documentation

Swagger API documentation is available at `http://localhost:3000/api` when the application is running.

## Testing

1. Run unit tests:
   ```
   npm run test
   ```

2. Run integration tests:
   ```
   npm run test:integration
   ```

3. Run e2e tests:
   ```
   npm run test:e2e
   ```

## Main Components

### Auth Module

The Auth module handles user authentication, including JWT token generation and validation.

### User Module

The User module manages user-related operations and database interactions.

### App Module

The main application module that brings together all other modules.

### HTTP Exception Filter

A global exception filter for handling and formatting HTTP exceptions.

## Configuration

The application uses environment-based configuration. The main configuration file is `.env.development`.

## Database

The project uses MongoDB as the database, with Mongoose as the ODM. The database connection is set up in the database module.

## Authentication Flow

1. User signs up using the `/auth/signup` endpoint.
2. User signs in using the `/auth/signin` endpoint, receiving access and refresh tokens.
3. Protected routes are accessed using the access token in the Authorization header.
4. When the access token expires, use the `/auth/refresh` endpoint with the refresh token to get new tokens.

## Contributing

Please read the CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
