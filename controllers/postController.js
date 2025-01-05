const Post = require("../models/post");
const createPath = require("../helper/create-path");

const getPosts = async  (req, res) => {
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
}
const getPostById = async (req, res) => {
    const title = 'Post';

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).render(createPath('error'), { title: 'Error', message: 'Post not found' });
        }

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
}
const deletePostById = (req, res) => {
    Post.findByIdAndDelete(req.params.id)
        .then(() => res.redirect(`/posts/`))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
}
const postComment = async (req, res) => {
    try {
        const { text, rating } = req.body;

        if (!text) {
            return res.status(400).send('Comment text is required');
        }
        if (!rating || rating < 1 || rating > 10) {
            return res.status(400).send('Rating must be a number between 1 and 10');
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

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
}
const editPostGet = (req, res) => {
    const title = 'Edit Post';

    Post.findById(req.params.id)
        .then((post) => res.render(createPath('edit-post'), { post, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
}
const editPostPut = async (req, res) => {
    const { title, text } = req.body;

    try {
        const postData = {
            title,
            text,
        };

        if (req.file) {
            postData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }

        await Post.findByIdAndUpdate(req.params.id, postData);
        res.redirect(`/posts/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Failed to update post' });
    }
}
const addPostGet  = (req, res) => {
    const title = 'Add Post';
    res.render(createPath('add-post'), { title });
}
const addPostPost = async (req, res) => {
    const { title, text } = req.body;
    const author = req.session.username;

    const post = new Post({
        title,
        text,
        author,
    });

    if (req.file) {
        post.image.data = req.file.buffer;
        post.image.contentType = req.file.mimetype;
    }

    try {
        await post.save();
        res.redirect('/posts');
    } catch (error) {
        console.error(error);
        res.render(createPath('error'), { title: 'Error', message: 'Failed to create post' });
    }
}

const homeGet = async (req, res) => {
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
}
module.exports = {
    getPosts,
    getPostById,
    deletePostById,
    editPostGet,
    editPostPut,
    postComment,
    addPostGet,
    addPostPost,
    homeGet,
}
