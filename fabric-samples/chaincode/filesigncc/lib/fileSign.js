'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');

class FileSign extends Contract {
    /**
     * 初始化账本
     */
    async InitLedger(ctx) {
        const files = [
            {
                fileHash: 'hash123',
                signature: 'signature123',
                owner: 'Alice',

            },
        ];

        for (const file of files) {
            await ctx.stub.putState(file.fileHash, Buffer.from(stringify(sortKeysRecursive(file))));
        }
        return 'Ledger initialized with sample data.';
    }

    /**
     * 存储文件签名记录
     */
    async storeFile(ctx, fileHash, encryptedSignature, owner) {
        console.log(`Storing file: ${fileHash}, ${encryptedSignature}, ${owner}`);
        
        // 构建文件记录
        const fileRecord = {
            fileHash,
            encryptedSignature,
            owner,
        };

        console.log(`File record: ${JSON.stringify(fileRecord)}`);

        // 存储到区块链
        await ctx.stub.putState(fileHash, Buffer.from(stringify(sortKeysRecursive(fileRecord))));
        return JSON.stringify(fileRecord);
    }

    /**
     * 验证文件签名
     */
    async verifyFile(ctx, fileHash, signature) {
        // 获取文件记录
        const fileJSON = await ctx.stub.getState(fileHash);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`File with hash ${fileHash} does not exist`);
        }

        const fileRecord = JSON.parse(fileJSON.toString());

        // 验证签名是否匹配
        if (fileRecord.signature !== signature) {
            throw new Error('Signature does not match the stored record.');
        }

        return {
            message: 'File verification successful',
            fileHash: fileRecord.fileHash,
            owner: fileRecord.owner,
            timestamp: fileRecord.timestamp,
        };
    }

    /**
     * 查询文件记录
     */
    async getFileRecord(ctx, fileHash) {
        const fileJSON = await ctx.stub.getState(fileHash);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`File with hash ${fileHash} does not exist`);
        }
        return fileJSON.toString();
    }

    /**
     * 判断文件是否存在
     */
    async fileExists(ctx, fileHash) {
        const fileJSON = await ctx.stub.getState(fileHash);
        return fileJSON && fileJSON.length > 0;
    }

    /**
     * 查询文件的历史记录
     */
    async getFileHistory(ctx, fileHash) {
        const historyIterator = await ctx.stub.getHistoryForKey(fileHash);
        const history = [];
        let result = await historyIterator.next();

        while (!result.done) {
            const record = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                isDelete: result.value.isDelete,
                value: result.value.value.toString('utf8'),
            };
            history.push(record);
            result = await historyIterator.next();
        }

        return JSON.stringify(history);
    }
}

module.exports = FileSign;
