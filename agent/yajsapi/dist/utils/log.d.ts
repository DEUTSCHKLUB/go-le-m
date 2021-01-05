import winston from "winston";
import { Callable } from "./";
import * as events from "../runner/events";
declare const logger: winston.Logger;
export declare function logSummary(wrapped_emitter?: Callable<[events.YaEvent], void> | null | undefined): (event: events.YaEvent) => void;
export declare const changeLogLevel: (level: string) => void;
export default logger;
