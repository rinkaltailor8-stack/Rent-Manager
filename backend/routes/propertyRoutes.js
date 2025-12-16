const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getProperty);
router.post('/', propertyController.createProperty);
router.put('/:id', propertyController.updateProperty);
router.post('/:id/assign-tenant', propertyController.assignTenant);
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
