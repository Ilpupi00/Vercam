const express = require('express');
const router = express.Router();

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


module.exports = router;
