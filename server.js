const express = require('express');
const path = require('path');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const methodOverride = require('method-override');
const Post = require('./models/post');
const Contact = require('./models/contact');

const app = express();

app.set('view engine', 'ejs');

const PORT = 3000;
const db = 'mongodb+srv://groupd:groupd@feedbackmanagementsyste.23dx4.mongodb.net/FeedbackManagementSystem?retryWrites=true&w=majority&appName=FeedbackManagementSystem';


mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((res) => console.log('Connected to DB'))
    .catch((error) => console.log(error));

const createPath = (page) => path.resolve(__dirname, 'ejs-views', `${page}.ejs`);

app.listen(PORT, (error) => {
    error ? console.log(error) : console.log(`listening port ${PORT}`);
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: false }));

// app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use(express.static('styles'));

app.use(methodOverride('_method'));
////////////////////////////////////////////
// Show the registration form
app.get('/register', (req, res) => {
    const title = 'Register';
    res.render(createPath('register'), { title });
});

// Handle registration form submission
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in the database
        const user = new User({ username, password: hashedPassword });
        await user.save();

        res.redirect('/login'); // Redirect to login page after successful registration
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Registration failed' });
    }
});


// Show the login form
app.get('/login', (req, res) => {
    const title = 'Login';
    res.render(createPath('login'), { title });
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });

        if (user) {
            // Compare the entered password with the stored hash
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // Store username in the session
                req.session.username = user.username;
                return res.redirect('/'); // Redirect to home page after login
            }
        }

        res.render(createPath('error'), { title: 'Error', message: 'Invalid username or password' });
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Login failed' });
    }
});
/////////////////////////
// app.get('/', (req, res) => {
//     const title = 'Home';
//     res.render(createPath('index'), { title });
// });


app.get('/', (req, res) => {
    const title = 'Home';
    const username = req.session.username; // Get logged-in username
    res.render(createPath('index'), { title, username });
});


app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/contacts', (req, res) => {
    const title = 'Contacts';
    Contact
        .find()
        .then(contacts => res.render(createPath('contacts'), { contacts, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/posts/:id', (req, res) => {
    const title = 'Post';
    Post
        .findById(req.params.id)
        .then(post => res.render(createPath('post'), { post, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.delete('/posts/:id', (req, res) => {
    Post
        .findByIdAndDelete(req.params.id)
        .then((result) => {
            res.sendStatus(200);
        })
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/edit/:id', (req, res) => {
    const title = 'Edit Post';
    Post
        .findById(req.params.id)
        .then(post => res.render(createPath('edit-post'), { post, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.put('/edit/:id', (req, res) => {
    const { title, author, text } = req.body;
    const { id } = req.params;
    Post
        .findByIdAndUpdate(id, { title, author, text })
        .then((result) => res.redirect(`/posts/${id}`))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/posts', (req, res) => {
    const title = 'Posts';
    Post
        .find()
        .sort({ createdAt: -1 })
        .then(posts => res.render(createPath('posts'), { posts, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/add-post', (req, res) => {
    const title = 'Add Post';
    res.render(createPath('add-post'), { title });
});

app.post('/add-post', (req, res) => {
    const { title, author, text } = req.body;
    const post = new Post({ title, author, text });
    post
        .save()
        .then((result) => res.redirect('/posts'))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.use((req, res) => {
    const title = 'Error Page';
    res
        .status(404)
        .render(createPath('error'), { title });
});