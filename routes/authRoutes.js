const express = require('express');
const router = express.Router();

const {
    registrationGet,
    registrationPost,
    loginGet,
    loginPost,
    logoutGet,
} = require('../controllers/authController');


router.get('/register', registrationGet);
router.post('/register', registrationPost);
router.get('/login', loginGet);
router.post('/login', loginPost);
router.get('/logout', logoutGet);

module.exports = router;