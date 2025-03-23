# QBank Application

## Prerequisites
1. Node.js and npm (already installed)
2. MariaDB Server for Windows
3. Git (for version control)

## Database Setup

This application uses MariaDB as its database. Follow these steps to set up:

1. Install MariaDB Server for Windows
   - Download from: https://mariadb.org/download/
   - During installation:
     - Set root password
     - Enable "Modify password for database user 'root'" option
     - Keep default port (3306)

2. Create a new database:
   ```sql
   CREATE DATABASE qbank;
   ```

3. Create a user and grant permissions:
   ```sql
   CREATE USER 'qbank_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON qbank.* TO 'qbank_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. Update the `.env` file with your database credentials:
   ```
   DATABASE_URL="mysql://qbank_user:your_password@localhost:3306/qbank"
   ```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Database Connection Issues
1. Verify MariaDB is running:
   - Open Services (Windows + R, type 'services.msc')
   - Find "MariaDB" service
   - Ensure it's running

2. Test Database Connection:
   - Open MariaDB Command Prompt
   - Try connecting: `mysql -u qbank_user -p`
   - Enter your password when prompted

3. Common Issues:
   - Port 3306 already in use: Change MariaDB port in my.ini
   - Access denied: Double-check user credentials and privileges
   - Service not starting: Check Windows Event Viewer for errors

## Environment Variables

Create a `.env` file in the root directory with:

```env
DATABASE_URL="mysql://user:password@localhost:3306/qbank"
JWT_SECRET="your-secret-key"
```

## Notes

- The application uses Prisma with MariaDB (MySQL provider)
- Ensure MariaDB is running before starting the application
- The server runs on port 3001 by default