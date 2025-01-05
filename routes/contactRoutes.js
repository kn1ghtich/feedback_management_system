const express = require('express');
const router = express.Router();
const {
    getContacts,
    redirect,
        } = require('../controllers/contactController');

router.get('/contacts', getContacts);
router.get('/about-us', redirect)

module.exports = router;