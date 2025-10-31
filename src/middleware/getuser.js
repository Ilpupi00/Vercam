module.exports = function getLoggedUser(req, res) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Non autenticato' });
    }
}

module.exports= function isVenditore(req,res,next){
    if(req.isAuthenticated && req.isAuthenticated() && req.user && req.user.ruolo === 'venditore'){
        return next();
    }
    else{
        res.status(403).json({ error: 'Accesso negato. Permessi insufficienti.' });
    }
}