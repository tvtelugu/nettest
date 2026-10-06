const express = require('express');
const router = express.Router();
const controller = require('@/controllers/api-controller');

router.get('/home', controller.getHome);
router.get('/series', controller.getSeries);
router.get('/movies', controller.getMovies);

router.get('/search', controller.search);
router.get('/title/:id', controller.getTitle);
router.get('/playlist/:id', controller.getPlaylist);
router.get('/proxy', controller.proxy);

router.get('/genres', controller.getGenresList);
router.get('/genres/:name', controller.getItemsByGenre);

module.exports = router;
