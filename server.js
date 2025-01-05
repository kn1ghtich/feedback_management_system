const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const app = express();
require('dotenv').config();
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const createPath= require('./helper/create-path');
const authMiddleware = require('./helper/auth-midl');
const Post = require("./models/post");

app.set('view engine', 'ejs');

const PORT = 3000;
const db =  'mongodb+srv://groupd:groupd@feedbackmanagementsyste.23dx4.mongodb.net/FeedbackManagementSystem?retryWrites=true&w=majority&appName=FeedbackManagementSystem';


mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((res) => console.log('Connected to DB'))
    .catch((error) => console.log(error));



app.listen(PORT, () => {
    console.log(`listening port ${PORT}`);
});
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static('styles'));
app.use('/protected-styles', authMiddleware, express.static('styles'));
app.use(methodOverride('_method'));
//


app.get('/', async (req, res) => {
    const title = 'Home';
    const username = req.session.username;

    try {
        const posts = await Post.find({ author: username }).sort({ createdAt: -1 });

        const postsWithRatings = posts.map(post => {
            const totalRatings = post.comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
            const averageRating = post.comments.length
                ? (totalRatings / post.comments.length).toFixed(1)
                : 'No ratings yet';

            return {
                ...post.toObject(),
                averageRating
            };
        });

        res.render(createPath('index'), { posts: postsWithRatings, title, username });
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Failed to load posts' });
    }
})

app.use(authRoutes);
app.use(postRoutes);
app.use(contactRoutes);

app.use((req, res) => {
    const title = 'Error Page';
    res
        .status(404)
        .render(createPath('error'), { title });
});