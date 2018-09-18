const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.Promise = global.Promise
mongoose.connect(process.env.DATABASE)

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());


// model
const { User } = require('./models/User')
const { Brand } = require('./models/Brand')
const { Wood } = require('./models/Wood')
const { Product } = require('./models/Product')
// middleware
const { auth } = require('./middlewares/auth')
const { admin } = require('./middlewares/admin')

// =======================
//      PRODUCT
// =======================

// by arrival
// articles?sortBy=createdAt&order=desc&limit=4

// by sold
// articles?sortBy=sold&order=desc&limit=100&skip=5
app.get('/api/product/articles', (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id'
    let limit = req.query.limit ? parseInt(req.query.limit) : 100

    Product
        .find()
        .populate('brand')
        .populate('wood')
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, articles) => {
            if (err) return res.status(400).send(err)

            res.send(articles)
        })
})

// {{url}}/api/product/articles_by_id?id=5b96bc1ce1f43113cca3c7f2,5b96bc01e1f43113cca3c7f1&type=array
// get one/many product by Id on query string
app.get('/api/product/articles_by_id', (req, res) => {
    let type = req.query.type;
    let items = req.query.id;

    if (type === "array") {
        let ids = req.query.id.split(',')
        items = []
        items = ids.map(item => {return mongoose.Types.ObjectId(item)})
    }

    Product
        .find({'_id': {$in: items}})
        .populate('brand')
        .populate('wood')
        .exec((err, docs) => { return res.status(200).send(docs)})
})

app.post('/api/product/article', auth, admin, (req, res) => {
    const product = new Product(req.body);

    product.save((err, doc) => {
        if (err) return res.json({success: false, err})

        res.status(200).json({ success: true, article: doc })
    })
})
// =======================
//      WOOD
// =======================
app.post('/api/product/wood', auth, admin, (req, res) => {
    const wood = new Wood(req.body);

    wood.save((err, doc) => {
        if (err) return res.json({success: false, err})

        res.status(200).json({ success: true, wood: doc })
    })
})

app.get('/api/product/woods', (req, res) => {
    Wood.find({}, (err, woods) => {
        if (err) res.status(400).send(err);

        res.status(200).send(woods);
    })
})
// =======================
//      BRAND
// =======================
app.post('/api/product/brand', auth, (req, res) => {
    const brand = new Brand(req.body);

    brand.save((err, doc) => {
        if (err) return res.json({success: false, err});

        res.status(200).json({
            success: true,
            brand: doc
        })
    })
})

app.get('/api/product/brands', (req, res) => {
    Brand.find({}, (err, brands) => {
        if (err) res.status(400).send(err);

        res.status(200).send(brands);
    })
})

// =======================
//      USER
// =======================
app.get('/api/users/auth', auth, (req, res) => {
    res.status(200).json({
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        cart: req.user.cart,
        history: req.user.history
    })
})

app.post('/api/users/register', (req, res) => {
    const user = new User(req.body)

    user.save((err, doc) => {
        if (err) return res.json({success: false, err});
        res.status(200).json({
            success: true
            // userdata: doc
        })
    })
})

app.post('/api/users/login', (req, res) => {
    // check user email
    // compare password
    // issue token
    User.findOne({'email': req.body.email}, (err, user) => {
        if (!user) return res.json({loginSuccess: false, message: 'Auth failed, email not found'});

        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch) return res.json({loginSuccess: false, message: 'Wrong email or password'})
        
            user.generateToken((err, user) => {
                if (err) return res.status(400).send(err);

                res.cookie('w_auth', user.token).status(200).json({loginSuccess: true})
            })
        })
    })
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate(
        {_id: req.user._id},
        {token: ''},
        (err, doc) => {
            if (err) return res.json({success: false, err});

            return res.status(200).send({
                success: true
            })
        }
    )
})

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server running at ${port}`)
});