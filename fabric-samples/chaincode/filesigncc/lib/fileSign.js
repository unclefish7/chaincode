'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');

class FileSign extends Contract {
    /**
     * 初始化账本
     */
    async InitLedger(ctx) {
        const items = [
            {
                itemId: 'item1',
                name: 'Laptop',
                owner: 'Alice',
                status: 'available',
            },
        ];

        for (const item of items) {
            await ctx.stub.putState(item.itemId, Buffer.from(stringify(sortKeysRecursive(item))));
        }
        return 'Ledger initialized with sample data.';
    }

    /**
     * 添加物品
     */
    async addItem(ctx, itemId, name, owner) {
        const item = {
            itemId,
            name,
            owner,
            status: 'available',
        };

        await ctx.stub.putState(item.itemId, Buffer.from(stringify(sortKeysRecursive(item))));
        return JSON.stringify(item);
    }

    /**
     * 删除物品
     */
    async deleteItem(ctx, itemId) {
        const exists = await this.itemExists(ctx, itemId);
        if (!exists) {
            throw new Error(`The item with ID ${itemId} does not exist`);
        }

        await ctx.stub.deleteState(itemId);
        return `Item ${itemId} has been deleted`;
    }

    /**
     * 租借物品
     */
    async borrowItem(ctx, itemId, borrower) {
        const itemJSON = await ctx.stub.getState(itemId);
        if (!itemJSON || itemJSON.length === 0) {
            throw new Error(`Item with ID ${itemId} does not exist`);
        }

        const item = JSON.parse(itemJSON.toString());
        if (item.status !== 'available') {
            throw new Error(`Item ${itemId} is not available for borrowing`);
        }

        item.status = 'borrowed';
        item.borrower = borrower;

        await ctx.stub.putState(itemId, Buffer.from(stringify(sortKeysRecursive(item))));
        return JSON.stringify(item);
    }

    /**
     * 归还物品
     */
    async returnItem(ctx, itemId) {
        const itemJSON = await ctx.stub.getState(itemId);
        if (!itemJSON || itemJSON.length === 0) {
            throw new Error(`Item with ID ${itemId} does not exist`);
        }

        const item = JSON.parse(itemJSON.toString());
        if (item.status !== 'borrowed') {
            throw new Error(`Item ${itemId} is not currently borrowed`);
        }

        item.status = 'available';
        delete item.borrower;

        await ctx.stub.putState(itemId, Buffer.from(stringify(sortKeysRecursive(item))));
        return JSON.stringify(item);
    }

    /**
     * 查询所有物品的当前状态
     */
    async getAllItems(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const items = [];
        let result = await iterator.next();
    
        while (!result.done) {
            const item = JSON.parse(result.value.value.toString('utf8'));
            items.push(item);
            result = await iterator.next();
        }
    
        return JSON.stringify(items);
    }

    /**
     * 查询物品的历史记录
     */
    async getItemHistory(ctx, itemId) {
        const historyIterator = await ctx.stub.getHistoryForKey(itemId);
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

    /**
     * 判断物品是否存在
     */
    async itemExists(ctx, itemId) {
        const itemJSON = await ctx.stub.getState(itemId);
        return itemJSON && itemJSON.length > 0;
    }
}

module.exports = FileSign;
