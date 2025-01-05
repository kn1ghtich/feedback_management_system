const express = require('express');
const Post = require("../models/post");
const createPath = require("../helper/create-path");
const router = express.Router();
const authMiddleware = require('../helper/auth-midl');
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
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


const {
    getPosts,
    getPostById,
    deletePostById,
    editPostGet,
    editPostPut,
    postComment,
    addPostGet,
    addPostPost,
    homeGet,
} = require('../controllers/postController');

router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.delete('/posts/:id', authMiddleware, isAuthorMiddleware, deletePostById);
router.post('/posts/:id/comments', authMiddleware, postComment);
router.get('/edit/:id', authMiddleware, isAuthorMiddleware, editPostGet);
router.put('/edit/:id', authMiddleware, isAuthorMiddleware, upload.single('image'), editPostPut);
router.get('/add-post', authMiddleware, addPostGet);
router.post('/add-post', authMiddleware, upload.single('image'), addPostPost);
router.get('/', homeGet);


module.exports = router;