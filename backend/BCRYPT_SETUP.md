# Bcrypt Password Implementation

This document explains the bcrypt password hashing implementation in the Student Portal backend.

## What's Changed

1. **User Model (`models/User.js`)**:
   - Added bcryptjs import
   - Implemented pre-save middleware to hash passwords automatically
   - Added `comparePassword` method for secure password comparison
   - Reduced minimum password length from 8 to 6 characters

2. **User Routes (`routes/users.js`)**:
   - Updated login route to use bcrypt password comparison
   - Updated profile update routes to use bcrypt hashing
   - Added Result model import for user deletion

3. **Migration Script (`migrate-passwords.js`)**:
   - Script to migrate existing plain text passwords to bcrypt hashes
   - Safely handles already hashed passwords

## How It Works

### Password Hashing
- When a user is created or password is updated, the pre-save middleware automatically hashes the password
- Uses bcrypt with a salt rounds of 10 (good balance of security and performance)
- Passwords are never stored in plain text

### Password Comparison
- The `comparePassword` method securely compares the provided password with the stored hash
- Uses bcrypt's built-in comparison function
- Returns true/false based on whether passwords match

### Security Benefits
- Passwords are hashed with salt to prevent rainbow table attacks
- Even if database is compromised, passwords cannot be easily reversed
- Each password has a unique salt for additional security

## Migration Instructions

If you have existing users with plain text passwords, run the migration script:

```bash
cd backend
npm run migrate-passwords
```

This will:
- Find all users with plain text passwords
- Hash them using bcrypt
- Skip users that already have hashed passwords
- Display progress and results

## Testing

After migration, test the following:
1. User login with existing credentials
2. Creating new users
3. Updating user passwords
4. Admin user management

## Important Notes

- **Backup your database** before running the migration
- The migration script is safe to run multiple times
- New users will automatically have hashed passwords
- Existing users can continue to login with their original passwords after migration

## Environment Variables

Make sure your `.env` file has the required variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
``` 