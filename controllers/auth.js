const User = require('../models/user')
const Bcrypt = require('bcryptjs')
const transporter = require('../util/nodemailer')
const crypto = require('crypto')
const { validationResult } = require('express-validator/check')


exports.getLogin = (req, res, next) => {
    let message = req.flash('error')
    res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errorMessage: message.length > 0 ? message[0] : null
    });
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password.')
                return res.redirect('/login')
            }
            if (Bcrypt.compareSync(password, user.password)){
                req.session.isLoggedIn = true;
                req.session.user = user
                return req.session.save((err) => {
                    res.redirect('/');
                })
            } else {
                req.flash('error', 'Invalid email or password.')
                return res.redirect('/login')
            }
        })
        .catch(err => console.log(err));
    
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    })
};

exports.getSignUp = (req, res, next) => {
    let message = req.flash('error')
    res.render('auth/signup', {
        pageTitle: 'Sign Up',
        path: '/signup',
        errorMessage: message.length > 0 ? message[0] : null,
        product: { email: '', password: '', confirmPassword: '' },
        validationErrors: []
    });
};

exports.postSignUp = (req, res, next) => {
    const { email, password, confirmPassword } = req.body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/signup', {
            pageTitle: 'Sign Up',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password, confirmPassword: confirmPassword },
            validationErrors: errors.array()
        })
    }
    
    Bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword
            })
            return user.save()
        })
        .then(result => {
            const mailOptions = {
                from: 'nguyenngocthien024@gmail.com',
                to: email,
                subject: 'Signup Successfully',
                text: 'You have signed up successfully'
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error)
                }
                else {
                    console.log('Email sent: ' + info.response)
                }
            })
            console.log("created a user!")
            res.redirect('/login')
        })
        .catch(err => {
            res.redirect('/signup')
        })
    
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error')
    res.render('auth/reset', {
    pageTitle: 'Reset Password',
    path: '/reset',
    errorMessage: message.length > 0 ? message[0] : null
    });
}

exports.postReset = (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found')
                    return res.redirect('/reset')
                }
                user.resetToken = token
                user.resetTokenExpiration = Date.now() + 3600000
                return user.save()
            })
            .then(result => {
                res.redirect('/')
                const mailOptions = {
                    from: 'nguyenngocthien024@gmail.com',
                    to: req.body.email,
                    subject: 'Password Reset',
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                    `
                }
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error)
                    }
                    else {
                        console.log('Email sent: ' + info.response)
                    }
                })
            })
            .catch(err => {
                console.log(err)
                return res.redirect('/reset')
            })
    })
}

exports.getNewPassword = (req, res) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: {$gt: Date.now()} }).then(user => {
        if (!user) {
            return res.redirect('/')
        }
        let message = req.flash('error')
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/new-password',
            errorMessage: message.length > 0 ? message[0] : null,
            userId: user._id.toString(),
            passwordToken: token
        });
        
    })
        .catch(err => {
            console.log(err)
    })
    
}

exports.postNewPassword = (req, res) => {
    const { userId, passwordToken, password, confirmPassword } = req.body
    const hashedPassword = Bcrypt.hashSync(password, 12)
    User.findOne({ resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId })
        .then(user => {
            if (!user) {
                res.flash('error', 'User does not exist')
                return res.redirect('/reset')
            }
            user.password = hashedPassword
            user.resetToken = undefined
            user.resetTokenExpiration = undefined
            user.save()
            console.log('Reset Password Successfully')
            return res.redirect('/login')
        }).catch(err => {
            console.log(err)
        });
}