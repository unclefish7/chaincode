'use strict';

const { Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // 检查 Admin 身份是否已存在
        const identity = await wallet.get('Admin');
        // if (identity) {
        //     console.log('Admin identity already exists in the wallet');
        //     return;
        // }

        // 加载 Admin 身份
        const credPath = path.resolve(__dirname, '../../test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp');
        const certificate = fs.readFileSync(path.join(credPath, 'signcerts', 'Admin@org1.example.com-cert.pem')).toString();
        const privateKey = fs.readFileSync(path.join(credPath, 'keystore', fs.readdirSync(path.join(credPath, 'keystore'))[0])).toString();

        const x509Identity = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('Admin', x509Identity);
        console.log('Successfully added Admin identity to the wallet');
    } catch (error) {
        console.error(`Failed to add Admin identity: ${error}`);
        process.exit(1);
    }
}

main();
