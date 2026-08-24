"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.getPrismaClient = getPrismaClient;
const client_1 = require("@prisma/client");
const pino_js_1 = require("../shared/logger/pino.js");
let prismaInstance = null;
function getPrismaClient() {
    if (!prismaInstance) {
        prismaInstance = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development'
                ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'stdout', level: 'error' },
                    { emit: 'stdout', level: 'warn' },
                ]
                : [{ emit: 'stdout', level: 'error' }],
        });
        if (process.env.NODE_ENV === 'development') {
            prismaInstance.$on('query', (e) => {
                pino_js_1.logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma query');
            });
        }
    }
    return prismaInstance;
}
exports.prisma = getPrismaClient();
//# sourceMappingURL=prisma.js.map