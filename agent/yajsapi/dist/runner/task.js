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
exports.Task = exports.TaskStatus = void 0;
const utils_1 = require("../utils");
const events = __importStar(require("./events"));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["WAITING"] = "wait";
    TaskStatus["RUNNING"] = "run";
    TaskStatus["ACCEPTED"] = "accept";
    TaskStatus["REJECTED"] = "reject";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
class Task {
    constructor(data, expires = null, timeout = null) {
        this.id = 0;
        this.id = Task.counter;
        this._started = Date.now();
        this._emit_event = null;
        this._callbacks = new Set();
        if (timeout)
            this._expires = this._started + timeout;
        else
            this._expires = expires;
        this._result = null;
        this._data = data;
        this._status = TaskStatus.WAITING;
    }
    _add_callback(callback) {
        this._callbacks.add(callback);
    }
    _start(_emitter) {
        this._status = TaskStatus.RUNNING;
        this._emit_event = _emitter;
    }
    _stop(retry = false) {
        if (this._handle) {
            const [handle, queue] = this._handle;
            let loop = utils_1.eventLoop();
            if (retry)
                loop.create_task(queue.reschedule.bind(queue, handle));
            else
                loop.create_task(queue.mark_done.bind(queue, handle));
        }
    }
    static for_handle(handle, queue, emitter) {
        let task = handle.data();
        task._handle = [handle, queue];
        task._start(emitter);
        return task;
    }
    status() {
        return this._status;
    }
    data() {
        return this._data;
    }
    output() {
        return this._result;
    }
    expires() {
        return this._expires;
    }
    accept_task(result = null) {
        if (this._emit_event) {
            this._emit_event(new events.TaskAccepted({ task_id: this.id, result }));
        }
        if (this._status != TaskStatus.RUNNING)
            throw "Accepted task not running";
        this._status = TaskStatus.ACCEPTED;
        this._result = result;
        this._stop();
        for (let cb of this._callbacks)
            cb && cb(this, TaskStatus.ACCEPTED);
    }
    reject_task(reason = null, retry = false) {
        if (this._emit_event) {
            this._emit_event(new events.TaskRejected({ task_id: this.id, reason }));
        }
        if (this._status != TaskStatus.RUNNING)
            throw "Rejected task not running";
        this._status = TaskStatus.REJECTED;
        this._stop(retry);
        for (let cb of this._callbacks)
            cb && cb(self, TaskStatus.REJECTED);
    }
    static get counter() {
        Task.count = (Task.count || 0) + 1;
        return Task.count;
    }
}
exports.Task = Task;
Task.count = 0;
//# sourceMappingURL=task.js.map