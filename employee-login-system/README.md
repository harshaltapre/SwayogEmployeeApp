# Employee Login System

This project is an employee login system that allows employees to describe their current work and submit it for admin awareness. The system is built using TypeScript and Express.js.

## Features

- Employee authentication (login/logout)
- Submission of work descriptions by employees
- Admin view for submitted work descriptions
- Middleware for route protection
- Email notifications to admin upon work description submission

## Project Structure

```
employee-login-system
├── src
│   ├── app.ts                     # Entry point of the application
│   ├── controllers
│   │   ├── authController.ts      # Handles authentication logic
│   │   ├── employeeController.ts   # Manages employee actions
│   │   └── adminController.ts      # Admin functionalities
│   ├── routes
│   │   ├── authRoutes.ts          # Authentication routes
│   │   ├── employeeRoutes.ts       # Employee-specific routes
│   │   └── adminRoutes.ts          # Admin-specific routes
│   ├── middleware
│   │   └── auth.ts                # Authentication middleware
│   ├── models
│   │   ├── Employee.ts             # Employee data model
│   │   ├── WorkDescription.ts      # Work description model
│   │   └── Admin.ts                # Admin data model
│   ├── services
│   │   ├── authService.ts          # Authentication service
│   │   ├── emailService.ts         # Email notification service
│   │   └── workDescriptionService.ts # Work description handling service
│   └── types
│       └── index.ts               # TypeScript interfaces
├── package.json                    # npm configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd employee-login-system
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the application:
   ```
   npm start
   ```
2. Access the application at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.