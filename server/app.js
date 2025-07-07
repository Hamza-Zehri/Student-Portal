const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Data file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const COURSES_FILE = path.join(__dirname, 'data', 'courses.json');
const RESULTS_FILE = path.join(__dirname, 'data', 'results.json');

// Helper functions
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Profile API endpoints
app.put('/api/profile/:email', async (req, res) => {
    try {
        const users = await readJsonFile(USERS_FILE);
        const userIndex = users.findIndex(u => u.email === req.params.email);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        users[userIndex] = { ...users[userIndex], ...req.body };
        await writeJsonFile(USERS_FILE, users);
        res.json(users[userIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Course API endpoints
app.post('/api/courses', async (req, res) => {
    try {
        const courses = await readJsonFile(COURSES_FILE);
        const newCourse = { ...req.body, id: Date.now().toString() };
        courses.push(newCourse);
        await writeJsonFile(COURSES_FILE, courses);
        res.status(201).json(newCourse);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const courses = await readJsonFile(COURSES_FILE);
        const courseIndex = courses.findIndex(c => c.id === req.params.id);
        
        if (courseIndex === -1) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        courses[courseIndex] = { ...courses[courseIndex], ...req.body };
        await writeJsonFile(COURSES_FILE, courses);
        res.json(courses[courseIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        const courses = await readJsonFile(COURSES_FILE);
        const filteredCourses = courses.filter(c => c.id !== req.params.id);
        await writeJsonFile(COURSES_FILE, filteredCourses);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Course Registration endpoints
app.post('/api/courses/:id/register', async (req, res) => {
    try {
        const { studentEmail } = req.body;
        const courses = await readJsonFile(COURSES_FILE);
        const courseIndex = courses.findIndex(c => c.id === req.params.id);
        
        if (courseIndex === -1) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        if (!courses[courseIndex].registeredStudents) {
            courses[courseIndex].registeredStudents = [];
        }
        
        if (!courses[courseIndex].registeredStudents.includes(studentEmail)) {
            courses[courseIndex].registeredStudents.push(studentEmail);
            await writeJsonFile(COURSES_FILE, courses);
        }
        
        res.json(courses[courseIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/courses/:id/register', async (req, res) => {
    try {
        const { studentEmail } = req.body;
        const courses = await readJsonFile(COURSES_FILE);
        const courseIndex = courses.findIndex(c => c.id === req.params.id);
        
        if (courseIndex === -1) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        if (courses[courseIndex].registeredStudents) {
            courses[courseIndex].registeredStudents = 
                courses[courseIndex].registeredStudents.filter(email => email !== studentEmail);
            await writeJsonFile(COURSES_FILE, courses);
        }
        
        res.json(courses[courseIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Results API endpoints
app.post('/api/results', async (req, res) => {
    try {
        const results = await readJsonFile(RESULTS_FILE);
        const newResult = { ...req.body, id: Date.now().toString() };
        results.push(newResult);
        await writeJsonFile(RESULTS_FILE, results);
        res.status(201).json(newResult);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/results/student/:email', async (req, res) => {
    try {
        const results = await readJsonFile(RESULTS_FILE);
        const studentResults = results.filter(r => r.studentEmail === req.params.email);
        res.json(studentResults);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});