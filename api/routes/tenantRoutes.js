const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', tenantController.getTenants);
router.get('/:id', tenantController.getTenant);
router.post('/', tenantController.createTenant);
router.put('/:id', tenantController.updateTenant);
router.post('/:id/assign-property', tenantController.assignProperty);
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;
