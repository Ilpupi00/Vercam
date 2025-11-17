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

router.get('/documenti', async (req, res, next) => {
  try {
    // Server-side rendering: load documents from DB and render
    const q = req.query.q ? String(req.query.q).toLowerCase() : null;
    const categoryFilter = req.query.category || null;

    const sql = `SELECT id, titolo, contenuto, path, tipo_documento, checksum, created_at FROM documenti ORDER BY created_at DESC`;
    // Use req.db.all which follows sqlite-style callback
    req.db.all(sql, [], (err, rows) => {
      if (err) return next(err);

      let documents = (rows || []).map(doc => ({
        id: doc.id,
        name: doc.titolo,
        description: doc.contenuto,
        category: doc.tipo_documento,
        path: doc.path,
        uploadDate: doc.created_at ? (new Date(doc.created_at).toISOString().split('T')[0].split('-').reverse().join('/')) : ''
      }));

      // Apply server-side filters if present
      if (categoryFilter) {
        documents = documents.filter(d => d.category === categoryFilter);
      }
      if (q) {
        documents = documents.filter(d => (d.name && d.name.toLowerCase().includes(q)) || (d.description && d.description.toLowerCase().includes(q)));
      }

      // Group documents by category
      const grouped = {};
      documents.forEach(d => {
        const cat = d.category || 'altro';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(d);
      });

      res.render('documenti.ejs', { title: 'Documenti', user: req.user, groupedDocuments: grouped, query: { q: req.query.q || '', category: categoryFilter || '' } });
    });
  } catch (err) {
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

router.get('/privacy',(req,res,next)=>{
  try{
    res.render('privacy.ejs',{title: 'Privacy Policy', user: req.user });
  }catch(err){
    next(err);
  }
});

router.get('/termini-servizio',(req,res,next)=>{
  try{
    res.render('termini-servizio.ejs',{title: 'Termini e Condizioni di Servizio', user: req.user });
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
