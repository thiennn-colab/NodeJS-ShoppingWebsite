const path = require('path');
const { body } = require('express-validator/check')

const express = require('express');

const adminController = require('../controllers/admin');
const isAuthMiddleware = require('../middlewares/isAuth')

const router = express.Router();

router.use(isAuthMiddleware)
// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    body('title', 'Title must not be empty or contains special character')
        .notEmpty()
        .isString()
        .trim()
    ,
    body('price').custom((value, { req }) => {
        if (value <= 0) {
            throw new Error('The price must be greater than 0')
        }
        return true
    })
    ,
    body('description', 'Description must not be empty').notEmpty()

], adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product', [
    body('title', 'Title must not be empty or contains special character')
        .notEmpty()
        .isString()
        .trim()
    ,
    body('price').custom((value, { req }) => {
        if (value <= 0) {
            throw new Error('The price must be greater than 0')
        }
        return true
    })
    ,
    body('description', 'Description must not be empty').notEmpty()

], adminController.postEditProduct);

router.delete('/product/:productId', adminController.deleteProduct);

module.exports = router;
