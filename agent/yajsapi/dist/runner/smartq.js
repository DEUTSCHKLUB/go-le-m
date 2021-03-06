"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consumer = exports.SmartQueue = exports.Handle = void 0;
const csp = __importStar(require("js-csp"));
const utils_1 = require("../utils");
class Handle {
    constructor({ data, consumer, ...rest }) {
        this._data = data;
        this._prev_consumers = new Set();
        if (!!consumer)
            this._prev_consumers.add(consumer);
        this._consumer = consumer;
    }
    consumer() {
        return this._consumer;
    }
    assign_consumer(consumer) {
        this._prev_consumers.add(consumer);
        this._consumer = consumer;
    }
    data() {
        return this._data;
    }
}
exports.Handle = Handle;
class SmartQueue {
    constructor(items, retry_cnt = 2, ...rest) {
        this._items = items;
        this._rescheduled_items = new Set();
        this._in_progress = new Set();
        this.__new_items = csp.chan();
        this.__eof = csp.chan();
    }
    new_consumer() {
        return new Consumer(this);
    }
    __have_data() {
        const have_data = !!(this._items && this._items.length) ||
            !!this._rescheduled_items.size ||
            !!this._in_progress.size;
        return have_data;
    }
    __find_rescheduled_item(consumer) {
        const items = [...this._rescheduled_items].map((handle) => {
            if (!handle._prev_consumers.has(consumer))
                return handle;
        });
        return items[Symbol.iterator]().next().value;
    }
    async *get(consumer, callback) {
        while (this.__have_data()) {
            let handle = this.__find_rescheduled_item(consumer);
            if (!!handle) {
                this._rescheduled_items.delete(handle);
                this._in_progress.add(handle);
                handle.assign_consumer(consumer);
                callback && callback(handle);
                yield handle;
            }
            if (!!(this._items && this._items.length)) {
                let next_elem = this._items.pop();
                if (!next_elem) {
                    this._items = null;
                    if (!this._rescheduled_items && !this._in_progress) {
                        csp.putAsync(this.__new_items, true);
                        throw new Error();
                    }
                }
                else {
                    handle = new Handle({ data: next_elem, consumer: consumer });
                    this._in_progress.add(handle);
                    callback && callback(handle);
                    yield handle;
                }
            }
            await promisify(csp.takeAsync)(this.__new_items);
        }
    }
    async mark_done(handle) {
        if (!this._in_progress.has(handle))
            throw "handle is not in progress";
        this._in_progress.delete(handle);
        csp.putAsync(this.__eof, true);
        csp.putAsync(this.__new_items, true);
    }
    async reschedule(handle) {
        if (!this._in_progress.has(handle))
            throw "handle is not in progress";
        this._in_progress.delete(handle);
        this._rescheduled_items.add(handle);
        csp.putAsync(this.__new_items, true);
    }
    async reschedule_all(consumer) {
        let handles = [...this._in_progress].map((handle) => {
            if (handle.consumer() === consumer)
                return handle;
        });
        for (let handle of handles) {
            if (handle) {
                this._in_progress.delete(handle);
                this._rescheduled_items.add(handle);
            }
        }
        csp.putAsync(this.__new_items, true);
    }
    stats() {
        return {
            items: !!this._items,
            "in-progress": this._in_progress.size,
            "rescheduled-items": this._rescheduled_items.size,
        };
    }
    async wait_until_done() {
        while (this.__have_data()) {
            await promisify(csp.takeAsync)(this.__eof);
        }
    }
    has_unassigned_items() {
        return !!(this._items && this._items.length) || !!this._rescheduled_items.size;
    }
}
exports.SmartQueue = SmartQueue;
class Consumer {
    constructor(queue) {
        this._queue = queue;
        this._fetched = null;
    }
    ready() {
        return this;
    }
    done() {
        utils_1.eventLoop().create_task(this._queue.reschedule_all.bind(this._queue, this));
        return null;
    }
    last_item() {
        return this._fetched ? this._fetched.data() : null;
    }
    async *[Symbol.asyncIterator]() {
        const _fetch = (handle) => (this._fetched = handle);
        const val = await this._queue.get(this, _fetch);
        yield* val;
    }
}
exports.Consumer = Consumer;
function promisify(fn) {
    return (...args) => new Promise((resolve, reject) => {
        try {
            fn(...args, resolve);
        }
        catch (error) {
            reject(error);
        }
    });
}
//# sourceMappingURL=smartq.js.map