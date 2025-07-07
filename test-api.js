const http = require('http');

// Test the API endpoint
function testAPI() {
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (err) => {
        console.error('Error:', err.message);
    });

    req.end();
}

// Test user registration
function testUserRegistration() {
    const userData = JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        studentId: 'STU001',
        department: 'Computer Science',
        semester: 3
    });

    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/users/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(userData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`\nRegistration Status: ${res.statusCode}`);
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Registration Response:', data);
        });
    });

    req.on('error', (err) => {
        console.error('Registration Error:', err.message);
    });

    req.write(userData);
    req.end();
}

console.log('Testing API...');
testAPI();

setTimeout(() => {
    console.log('\nTesting User Registration...');
    testUserRegistration();
}, 1000); 