const bcrypt = require('bcryptjs');

// Test the password hash
const testPassword = 'admin123';
const storedHash = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPDzA672u';

bcrypt.compare(testPassword, storedHash, (err, result) => {
  console.log('Password test result:', result);
  
  // Create new hash for admin123
  bcrypt.hash('admin123', 10, (err, hash) => {
    console.log('New hash for admin123:', hash);
  });
});