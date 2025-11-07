const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('./login');

/* GET home page. */
router.get('/', (req, res, next)=> {
  try{
    res.render('index.ejs', { title: 'Home', user: req.user });
  }catch(err){
    next(err);
  }
});

router.get('/chi-siamo',(req, res, next) =>{
  try{
    res.render('chi_siamo.ejs', { title: 'Chi Siamo' ,user: req.user});
  }catch(err){
    next(err);
  }
});

router.get('/servizi',(req,res,next)=>{
  try{
    res.render('servizi.ejs',{title: 'Servizi',user: req.user });
  }catch(err){
    next(err);
  }
});

router.get('/documenti',(req,res,next)=>{
  try{
    res.render('documenti.ejs',{title: 'Documenti', user: req.user });
  }catch(err){
    next(err);
  }
});

router.get('/contatti',(req,res,next)=>{
  try{
    res.render('contatti.ejs',{title: 'Contatti', user: req.user });
  }catch(err){
    next(err);
  }
});

router.get('/area-venditore',(req,res,next)=>{
  try{
    // Require authentication
    if (!req.user) {
      return res.redirect('/login');
    }
    // view file is named `area-venditore.ejs` in src/views
    res.render('area-venditore', { title: 'Area Venditore', user: req.user });
  }catch(err){
    next(err);
  }
});

router.get('/login',(req,res,next)=>{
  try{
    // If already logged in, redirect to area-venditore
    if (req.user) {
      return res.redirect('/area-venditore');
    }
    res.render('login.ejs',{title: 'Login' , user: req.user });
  }catch(err){
    next(err);
  }
});

module.exports = router;
