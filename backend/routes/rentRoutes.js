const express = require('express');
const router = express.Router();
const rentController = require('../controllers/rentController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', rentController.getRentEntries);
router.get('/statistics', rentController.getStatistics);
router.get('/:id', rentController.getRentEntry);
router.post('/', rentController.createRentEntry);
router.post('/regenerate', rentController.regenerateRentEntries);
router.put('/:id', rentController.updateRentEntry);
router.patch('/:id/pay', rentController.markAsPaid);
router.delete('/:id', rentController.deleteRentEntry);

module.exports = router;
