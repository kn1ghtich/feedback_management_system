const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    author: {
        type: String, // You can also link this to a User model's ObjectID
        required: true,
    },
}, { timestamps: true });


const postSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    comments: [commentSchema] // Embedded comments
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
