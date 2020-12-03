const Product = require('../models/product');
const { validationResult } = require('express-validator/check');
const Mongoose = require('mongoose');
const fileHelper = require('../util/file')

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: [],
    validationErrors: [],
    product: {
        title: "",
        imageUrl: '',
        price: '',
        description: ''
      }
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: ['Attached file is not an image.'],
      validationErrors: [],
      product: {
        title: title,
        price: price,
        description: description
      }
    })
  }

  const imageUrl = image.path


  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: errors.array().map(e=>e.msg),
      validationErrors: errors.array(),
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      }
    })
  }

  const product = new Product({
    // _id: new Mongoose.Types.ObjectId("5fa3ca17fbf3802fc89ec23c"),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        errorMessage: [],
        validationErrors: []
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      errorMessage: errors.array().map(e=>e.msg),
      validationErrors: errors.array(),
      product: {
        _id: prodId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc
      }
    })
  }

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect('/')
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path;
      }
      return product.save().
        then(result => {
          console.log('UPDATED PRODUCT!')
          res.redirect('/admin/products')
        });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  let page = parseInt(req.query.page)
  if (!page) {
    page = 1
  }
  let totalItems
  Product.find().countDocuments().then(numProd => {
    totalItems = numProd
    return Product.find()
      // .skip((page - 1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE)
    })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        totalPage: Math.ceil(totalItems / ITEM_PER_PAGE),
        currentPage: page
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findOneAndDelete({_id: prodId, userId: req.session.user._id})
    .then((product) => {
      fileHelper.deleteFile(product.imageUrl)
      console.log('DESTROYED PRODUCT');
      res.status(200).json({
        message: 'Success!'
      })
    })
    .catch(err => {
      // return res.redirect('/500');
      res.status(500).json({
        message: 'Deleting product failed.'
      })
    });
};
