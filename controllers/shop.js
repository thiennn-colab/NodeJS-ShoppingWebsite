const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path')
const fs = require('fs')
const PDFDocument = require('pdfkit')
const stripe = require('stripe')('sk_test_51HogoMBgsgwnUXANtm0Lu9Sk30vtu09Bqm9wd8GT6ff49gV0rzVvuJiXMNzR1Dyf5gO5cVletcySWFECinkIlbCU00PxhLlZ9T');



ITEM_PER_PAGE = 2

exports.getProducts = (req, res, next) => {
  let page = parseInt(req.query.page)
  if (!page) {
    page = 1
  }
  let totalItems
  Product.find().countDocuments().then(numProd => {
    totalItems = numProd
    return Product.find().skip((page - 1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE)
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
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

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  let page = parseInt(req.query.page)
  if (!page) {
    page = 1
  }
  let totalItems
  Product.find().countDocuments().then(numProd => {
    totalItems = numProd
    return Product.find().skip((page - 1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        totalPage: Math.ceil(totalItems / ITEM_PER_PAGE),
        currentPage: page
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.filter(i => i.productId != null);
      user.cart.items = products
      user.save()
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products
  let total = 0
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items.filter(i => i.productId != null);
      user.cart.items = products
      user.save()
      products.forEach(p => {
        total += p.quantity * p.productId.price
      })

      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: 'usd',
            quantity: p.quantity
          }
        }),
        mode: 'payment',
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      });

    })
    .then(session => {
      
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      // return res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found'))
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'))
      }
      const invoiceName = 'invoice-' + orderId + '.pdf'
      const invoicePath = path.join('data', 'invoices', invoiceName)

      const pdfDoc = new PDFDocument()
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      pdfDoc.pipe(res)
      
      
      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      })
      pdfDoc.text('-------------------------------------')
      let totalPrice = 0
      order.products.forEach(p => {
        totalPrice += p.quantity * p.product.price
        pdfDoc.fontSize(15).text(p.product.title + ' - ' + p.quantity + ' x ' + p.product.price)
      })

      pdfDoc.fontSize(26).text('Total Price: ' + totalPrice)

      pdfDoc.end()

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err)
      //   }
      //   res.setHeader('Content-Type', 'application/pdf')
      //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
      //   res.send(data);
      // })

    })
    .catch(err => {
      next(err)
    });
}