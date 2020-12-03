const express = require('express');
const authCtrl = require('../controllers/auth');
const { check, body } = require('express-validator/check')
const User = require('../models/user')

const router = express.Router();

router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.post('/logout', authCtrl.postLogout);
router.route('/signup').get(authCtrl.getSignUp)
router.route('/signup').post(
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then(user => {
                    if (user) {
                        throw new Error('E-mail exists already, please pick a different one.')
                    }
                    return true
                })
            })
        ,
        body('password', 'Password must be at least 6 characters and contains only text and numbers.')
            .notEmpty()
            .isLength({ min: 6 })
            .isAlphanumeric()
        ,
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match')
            }
            return true
        })
    ],
    authCtrl.postSignUp)
router.route('/reset').get(authCtrl.getReset)
router.route('/reset').post(authCtrl.postReset)
router.route('/reset/:token').get(authCtrl.getNewPassword)
router.route('/new-password').post(authCtrl.postNewPassword)


module.exports = router;