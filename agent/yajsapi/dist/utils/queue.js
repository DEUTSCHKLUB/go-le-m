"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sleep_1 = __importDefault(require("./sleep"));
class Queue {
    constructor(list = [], cancellationToken) {
        this._tasks = list;
        this._cancellationToken = cancellationToken;
        if (list.length > 0) {
            let first = this._tasks.shift();
            first();
        }
    }
    put(item) {
        this._tasks.push(item);
    }
    async get() {
        return new Promise(async (resolve, reject) => {
            let item;
            while (!item) {
                if (this._cancellationToken.cancelled)
                    break;
                item = this._tasks.shift();
                if (!item)
                    await sleep_1.default(2);
            }
            if (this._cancellationToken.cancelled)
                reject();
            resolve(item);
        });
    }
    empty() {
        return this._tasks.length === 0;
    }
}
exports.default = Queue;
//# sourceMappingURL=queue.js.map