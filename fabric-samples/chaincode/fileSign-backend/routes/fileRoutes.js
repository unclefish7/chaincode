const express = require('express');
const multer = require('multer');
const { 
    storeFile, 
    verifyFile, 
    generateSignature,
    generateHash // 添加生成哈希的控制器
} = require('../controllers/fileController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', storeFile);
router.post('/verify', verifyFile);
router.post('/sign', generateSignature);
router.post('/hash', upload.single('file'), generateHash); // 添加生成哈希的路由并使用 multer 中间件

module.exports = router;
