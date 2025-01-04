const express = require('express');
const path = require('path');
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

const authMiddleware = (req, res, next) => {
    if (req.session && req.session.username) {
        next();
    } else {
        res.redirect('/login');
    }
};

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.status(401).send('You need to log in to perform this action');
}
const isAuthorMiddleware = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).render(createPath('error'), { title: 'Error', message: 'Post not found' });
        }

        if (post.author === req.session.username) {
            return next();
        }
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

app.use(express.urlencoded({ extended: true }));


app.use(express.static('styles'));
app.use('/protected-styles', authMiddleware, express.static('styles'));
app.use(methodOverride('_method'));

app.get('/register', (req, res) => {
    const title = 'Register';
    res.render(createPath('register'), { title });
});
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Registration failed' });
    }
});
app.get('/login', (req, res) => {
    const title = 'Login';
    res.render(createPath('login'), { title });
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.username = user.username;
                return res.redirect('/');
            }
        }
        res.render(createPath('error'), { title: 'Error', message: 'Invalid username or password' });
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Login failed' });
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});



app.get('/', async (req, res) => {
    const title = 'Home';
    const username = req.session.username;

    try {
        const posts = await Post.find({ author: username }).sort({ createdAt: -1 });

        // Вычисляем средний рейтинг для каждого поста
        const postsWithRatings = posts.map(post => {
            const totalRatings = post.comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
            const averageRating = post.comments.length
                ? (totalRatings / post.comments.length).toFixed(1)
                : 'No ratings yet';

            return {
                ...post.toObject(), // Преобразуем в объект для манипуляции
                averageRating // Добавляем поле с рейтингом
            };
        });

        // Рендерим главную страницу с дополненным списком постов
        res.render(createPath('index'), { posts: postsWithRatings, title, username });
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Failed to load posts' });
    }
});


app.get('/about-us', (req, res) => {
    res.redirect("/contacts")
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


app.get('/posts', async (req, res) => {
    const title = 'Posts';
    const username = req.session.username;

    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        // Для каждого поста вычисляем средний рейтинг
        const postsWithRatings = posts.map(post => {
            const totalRatings = post.comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
            const averageRating = post.comments.length ? (totalRatings / post.comments.length).toFixed(1) : 'No ratings yet';

            return {
                ...post.toObject(), // Преобразуем для корректного использования
                averageRating  // Добавляем средний рейтинг
            };
        });

        // Рендерим с учетом новых данных
        res.render(createPath('posts'), { posts: postsWithRatings, title, username });
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Failed to load posts' });
    }
});

app.get('/posts/:id', async (req, res) => {
    const title = 'Post';

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).render(createPath('error'), { title: 'Error', message: 'Post not found' });
        }

        // Подсчет среднего рейтинга
        const totalRatings = post.comments.reduce((sum, comment) => sum + comment.rating, 0);
        const averageRating = post.comments.length ? (totalRatings / post.comments.length).toFixed(1) : 'No ratings yet';

        res.render(createPath('post'), {
            post,
            title,
            username: req.session.username,
            averageRating
        });
    } catch (error) {
        console.error(error);
        res.status(500).render(createPath('error'), { title: 'Error', message: 'Server error occurred' });
    }
});
app.delete('/posts/:id', authMiddleware, isAuthorMiddleware, (req, res) => {
    Post.findByIdAndDelete(req.params.id)
        .then(() => res.redirect(`/posts/`)) // Respond with 200 on success
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});



app.post('/posts/:id/comments', authMiddleware, async (req, res) => {
    try {
        const { text, rating } = req.body;

        // Проверка поля text
        if (!text) {
            return res.status(400).send('Comment text is required');
        }
        // Проверка поля rating
        if (!rating || rating < 1 || rating > 10) {
            return res.status(400).send('Rating must be a number between 1 and 10');
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Добавление комментария с рейтингом
        post.comments.push({
            text,
            author: req.session.username,
            rating
        });
        await post.save();

        res.redirect(`/posts/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).render(createPath('error'), { title: 'Error', message: 'Failed to add comment' });
    }
});


app.get('/edit/:id', authMiddleware, isAuthorMiddleware, (req, res) => {
    const title = 'Edit Post';

    Post.findById(req.params.id)
        .then((post) => res.render(createPath('edit-post'), { post, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});
app.put('/edit/:id', authMiddleware, isAuthorMiddleware, (req, res) => {
    const { title, text } = req.body;
    const { id } = req.params;

    Post.findByIdAndUpdate(id, { title, text })
        .then(() => res.redirect(`/posts/${id}`))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
});

app.get('/add-post', authMiddleware, (req, res) => {
    const title = 'Add Post';
    res.render(createPath('add-post'), { title });
});
app.post('/add-post', authMiddleware, (req, res) => {
    const { title, text } = req.body;
    const author = req.session.username;

    const post = new Post({ title, author, text }); // Assign the author from the session
    post.save()
        .then(() => res.redirect('/posts'))
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