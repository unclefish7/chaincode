const express = require('express');
const {
    addItem,
    deleteItem,
    borrowItem,
    returnItem,
    getAllItems,
    getItemHistory
} = require('../controllers/fileController');

const router = express.Router();

router.post('/add', addItem);
router.post('/delete', deleteItem);
router.post('/borrow', borrowItem);
router.post('/return', returnItem);
router.get('/all', getAllItems);
router.get('/history', getItemHistory);

module.exports = router;
