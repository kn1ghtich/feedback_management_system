const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const app = express();
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const createPath= require('./helper/create-path');
const authMiddleware = require('./helper/auth-midl');

app.set('view engine', 'ejs');

const PORT = 3000;
const db = 'mongodb+srv://groupd:groupd@feedbackmanagementsyste.23dx4.mongodb.net/FeedbackManagementSystem?retryWrites=true&w=majority&appName=FeedbackManagementSystem';


mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((res) => console.log('Connected to DB'))
    .catch((error) => console.log(error));



app.listen(PORT, (error) => {
    error ? console.log(error) : console.log(`listening port ${PORT}`);
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

app.use(authRoutes);
app.use(postRoutes);
app.use(contactRoutes);

app.use((req, res) => {
    const title = 'Error Page';
    res
        .status(404)
        .render(createPath('error'), { title });
});