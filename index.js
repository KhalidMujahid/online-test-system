require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Models
const User = mongoose.model(
    'User',
    new mongoose.Schema({
        fullName: String,
        email: String,
        phoneNumber: String,
        score: Number,
        answers: Array,
    })
);

const Question = mongoose.model(
    'Question',
    new mongoose.Schema({
        questionText: String,
        options: [String],
        correctAnswer: String,
    })
);

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/start-test', async (req, res) => {
    const { fullName, email, phoneNumber } = req.body;
    if (!fullName || !email || !phoneNumber) {
        return res.render('index', { error: 'All fields are required' });
    }

    const questions = await Question.find();
    res.render('test', { fullName, email, phoneNumber, questions });
});

app.post('/submit-test', async (req, res) => {
    const { fullName, email, phoneNumber, answers } = req.body;

    const questions = await Question.find();
    let score = 0;

    questions.forEach((question, index) => {
        if (question.correctAnswer === answers[index]) {
            score += 1;
        }
    });

    const user = new User({
        fullName,
        email,
        phoneNumber,
        score,
        answers,
    });

    await user.save();
    res.render('result', { score, fullName, email, phoneNumber });
});

// Admin route to render add-question page
app.get('/admin/add-question', (req, res) => {
    res.render('admin');
});

// Admin route to handle question addition
app.post('/add-question', async (req, res) => {
    const { questionText, options, correctAnswer } = req.body;

    // Validate inputs
    if (!questionText || !options || !correctAnswer) {
        return res.status(400).render('admin', {
            error: 'All fields are required!',
        });
    }

    try {
        const newQuestion = new Question({
            questionText,
            options,
            correctAnswer,
        });
        await newQuestion.save();

        res.render('admin', {
            success: 'Question added successfully!',
        });
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).render('admin', {
            error: 'An error occurred while adding the question.',
        });
    }
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});