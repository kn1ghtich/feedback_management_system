const createPath= require('../helper/create-path');
const bcrypt = require("bcrypt");
const User = require("../models/user");

const registrationGet = (req, res) => {
    const title = 'Register';
    res.render(createPath('register'), { title });
}
const registrationPost = async (req, res) => {
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
}
const loginGet = (req, res) => {
    const title = 'Login';
    res.render(createPath('login'), { title });
}
const loginPost = async (req, res) => {
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
}
const logoutGet = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
}
module.exports = {
    registrationGet,
    registrationPost,
    loginGet,
    loginPost,
    logoutGet,
};