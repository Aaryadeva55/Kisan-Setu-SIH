"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("@kisan-setu/config");
dotenv_1.default.config();
exports.config = (0, config_1.loadEnv)(process.env);
//# sourceMappingURL=env.js.map