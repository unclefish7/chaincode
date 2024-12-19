const { Gateway, Wallets } = require('fabric-network');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 配置路径
const ccpPath = path.resolve(__dirname, '..', 'networkConfig.json');
const walletPath = path.resolve(__dirname, '..', 'wallet');
const PRIVATE_KEY_PATH = path.join(__dirname, '..', 'keys', 'private.pem');
const PUBLIC_KEY_PATH = path.join(__dirname, '..', 'keys', 'public.pem');

// 文件上传配置
const upload = multer({ dest: 'uploads/' });

// 初始化 Gateway 和 Contract
async function initializeGateway(identity) {
    try {
        // 创建钱包实例
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // 检查身份是否存在
        const identityExists = await wallet.get(identity);
        if (!identityExists) {
            // 如果身份不存在，创建新的身份
            const cert = fs.readFileSync(path.join(walletPath, 'cert.pem')).toString();
            const key = fs.readFileSync(path.join(walletPath, 'priv_sk')).toString();
            
            const x509Identity = {
                credentials: {
                    certificate: cert,
                    privateKey: key,
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
            await wallet.put(identity, x509Identity);
        }

        // 连接网络
        const gateway = new Gateway();
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        await gateway.connect(ccp, {
            wallet,
            identity,
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('filechannel');
        const contract = network.getContract('filesigncc');

        return { gateway, contract };
    } catch (error) {
        console.error('Failed to initialize gateway:', error);
        throw new Error('Failed to connect to Fabric network');
    }
}

// 文件哈希生成
exports.generateHash = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未上传文件' });
        }

        const fileBuffer = fs.readFileSync(req.file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        fs.unlinkSync(req.file.path);
        res.status(200).json({ fileHash });
    } catch (error) {
        console.error('生成哈希错误:', error);
        res.status(500).json({ error: error.message });
    }
};

// 使用公钥加密生成签名
exports.generateSignature = async (req, res) => {
    const { fileHash } = req.body;
    if (!fileHash) {
        return res.status(400).json({ error: '缺少文件哈希' });
    }

    try {
        // 读取公钥
        const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
        
        // 使用公钥加密文件哈希
        const encryptedSignature = crypto.publicEncrypt(publicKey, Buffer.from(fileHash)).toString('base64');

        res.status(200).json({ encryptedSignature });
    } catch (error) {
        console.error('生成签名错误:', error);
        res.status(500).json({ error: error.message });
    }
};

// 存储文件签名记录
exports.storeFile = async (req, res) => {
    const { fileHash, encryptedSignature, owner } = req.body;
    
    if (!fileHash || !encryptedSignature || !owner) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    let gateway;
    try {
        console.log(`Storing file: ${fileHash}, ${encryptedSignature}, ${owner}`);
        
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.submitTransaction('storeFile', fileHash, encryptedSignature, owner);
        console.log('Transaction result:', result.toString());
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('存储文件错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// 验证文件签名
exports.verifyFile = async (req, res) => {
    const { fileHash } = req.body;
    
    // 验证参数完整性
    if (!fileHash) {
        return res.status(400).json({ 
            isValid: false, 
            message: '缺少文件哈希'
        });
    }

    let gateway;
    try {
        // 1. 查询区块链记录
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        let fileRecord;
        let fileExists = false;
        
        try {
            const result = await contract.evaluateTransaction('getFileRecord', fileHash);
            fileRecord = JSON.parse(result.toString());
            fileExists = true;
        } catch (error) {
            return res.status(404).json({
                isValid: false,
                message: '文件记录不存在',
                details: {
                    fileExists: false
                }
            });
        }

        // 2. 使用私钥解密签名
        let decryptedHash;
        try {
            const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
            decryptedHash = crypto.privateDecrypt(privateKey, Buffer.from(fileRecord.encryptedSignature, 'base64')).toString('utf8');
        } catch (error) {
            return res.status(400).json({
                isValid: false,
                message: '解密签名失败',
                details: {
                    error: '私钥格式错误或签名格式错误'
                }
            });
        }

        // 3. 验证解密后的哈希是否匹配
        const hashMatches = decryptedHash === fileHash;

        // 4. 返回完整的验证结果
        res.status(200).json({
            isValid: fileExists && hashMatches,
            message: fileExists && hashMatches 
                ? '验证通过' 
                : '验证失败',
            details: {
                fileExists,
                hashMatches,
                fileRecord: {
                    fileHash: fileRecord.fileHash,
                    owner: fileRecord.owner,
                    timestamp: fileRecord.timestamp
                }
            }
        });

    } catch (error) {
        console.error('验证文件错误:', error);
        res.status(500).json({ 
            isValid: false,
            message: '验证过程发生错误',
            details: {
                error: error.message
            }
        });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

