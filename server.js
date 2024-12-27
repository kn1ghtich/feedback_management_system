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

// Middleware to check if user is logged in
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.username) {
        // User is authenticated
        next();
    } else {
        // User is not authenticated, redirect to login
        res.redirect('/login');
    }
};

// Middleware to check if the logged-in user is the author of the post
const isAuthorMiddleware = async (req, res, next) => {
    try {
        const { id } = req.params; // Post ID from the route
        const post = await Post.findById(id); // Find the post by ID

        if (!post) {
            // Post not found, return error
            return res.status(404).render(createPath('error'), { title: 'Error', message: 'Post not found' });
        }

        // Check if the logged-in user's username matches the post's author
        if (post.author === req.session.username) {
            return next(); // Continue if authorized
        }

        // If not authorized, return an error or redirect
        return res.status(403).render(createPath('error'), { title: 'Error', message: 'Forbidden: You are not the author of this post' });
    } catch (error) {
        console.error(error);
        res.status(500).render(createPath('error'), { title: 'Error', message: 'An error occurred' });
    }
};

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: false }));

// app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use(express.static('styles'));
app.use('/protected-styles', authMiddleware, express.static('styles'));
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.redirect('/login'); // Redirect to login page
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
        const user = await User.findOne({ username });
        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
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


app.get('/', authMiddleware, (req, res) => {
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
    Contact.find()
        .then(contacts => res.render(createPath('contacts'), { contacts, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/posts/:id', authMiddleware, (req, res) => {
    const title = 'Post';
    Post.findById(req.params.id)
        .then(post => res.render(createPath('post'), { post, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

// DELETE route to delete a post
app.delete('/posts/:id', authMiddleware, isAuthorMiddleware, (req, res) => {
    Post.findByIdAndDelete(req.params.id)
        .then(() => res.sendStatus(200)) // Respond with 200 on success
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

// GET route to render the Edit Post form
app.get('/edit/:id', authMiddleware, isAuthorMiddleware, (req, res) => {
    const title = 'Edit Post';

    Post.findById(req.params.id)
        .then((post) => res.render(createPath('edit-post'), { post, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});


// PUT route to update a post
app.put('/edit/:id', authMiddleware, isAuthorMiddleware, (req, res) => {
    const { title, text } = req.body; // Only update title and text
    const { id } = req.params;

    Post.findByIdAndUpdate(id, { title, text })
        .then(() => res.redirect(`/posts/${id}`)) // Redirect to the updated post
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/posts', authMiddleware, (req, res) => {
    const title = 'Posts';
    const username = req.session.username; // Get the username of the logged-in user

    Post.find()
        .sort({ createdAt: -1 }) // Sort posts (latest first)
        .then(posts => {
            res.render(createPath('posts'), { posts, title, username }); // Pass username to EJS view
        })
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});
app.get('/add-post', (req, res) => {
    const title = 'Add Post';
    res.render(createPath('add-post'), { title });
});

app.post('/add-post', authMiddleware, (req, res) => {
    const { title, text } = req.body; // Only take title and text from the form
    const author = req.session.username; // Get the currently logged-in user's username

    const post = new Post({ title, author, text }); // Assign the author from the session
    post.save()
        .then(() => res.redirect('/posts')) // Redirect to the posts page after saving
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