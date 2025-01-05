const Contact = require('../models/contact');
const createPath= require('../helper/create-path');

const getContacts = (req, res) => {
    const title = 'Contacts';
    Contact.find()
        .then(contacts => res.render(createPath('contacts'), { contacts, title }))
        .catch((error) => {
            console.log(error);
            res.render(createPath('error'), { title: 'Error' });
        });
}

const redirect = (req, res) => {
    res.redirect("/contacts")
}

module.exports = {
    getContacts,
    redirect,
};