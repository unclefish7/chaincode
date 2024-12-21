const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// 配置路径
const ccpPath = path.resolve(__dirname, '..', 'networkConfig.json');
const walletPath = path.resolve(__dirname, '..', 'wallet');

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

// 添加物品
exports.addItem = async (req, res) => {
    const { itemId, name, owner } = req.body;
    if (!itemId || !name || !owner) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    let gateway;
    try {
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.submitTransaction('addItem', itemId, name, owner);
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('添加物品错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// 删除物品
exports.deleteItem = async (req, res) => {
    const { itemId } = req.body;
    if (!itemId) {
        return res.status(400).json({ error: '缺少物品ID' });
    }

    let gateway;
    try {
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.submitTransaction('deleteItem', itemId);
        res.status(200).json({ message: result.toString() });
    } catch (error) {
        console.error('删除物品错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// 租借物品
exports.borrowItem = async (req, res) => {
    const { itemId, borrower } = req.body;
    if (!itemId || !borrower) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    let gateway;
    try {
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.submitTransaction('borrowItem', itemId, borrower);
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('租借物品错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// 归还物品
exports.returnItem = async (req, res) => {
    const { itemId } = req.body;
    if (!itemId) {
        return res.status(400).json({ error: '缺少物品ID' });
    }

    let gateway;
    try {
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.submitTransaction('returnItem', itemId);
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('归还物品错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// 查询所有物品
exports.getAllItems = async (req, res) => {
    let gateway;
    try {
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.evaluateTransaction('getAllItems');
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('查询所有物品错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

// 查询物品历史记录
exports.getItemHistory = async (req, res) => {
    const { itemId } = req.query;
    if (!itemId) {
        return res.status(400).json({ error: '缺少物品ID' });
    }

    let gateway;
    try {
        const { gateway: gw, contract } = await initializeGateway('Admin');
        gateway = gw;

        const result = await contract.evaluateTransaction('getItemHistory', itemId);
        res.status(200).json(JSON.parse(result.toString()));
    } catch (error) {
        console.error('查询物品历史记录错误:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (gateway) gateway.disconnect();
    }
};

