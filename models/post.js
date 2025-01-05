const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1, max: 10
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
    image: {
        data: Buffer,
        contentType: String,
    },
    comments: [commentSchema]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

