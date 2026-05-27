'use strict';

const { PrismaClient } = require('@prisma/client');
const { getOrCreateBotUser } = require('./auth');

// Reuse global prisma если auth.js его уже завёл, иначе создаём свой
let prisma = global.__prisma;
if (!prisma) {
    prisma = new PrismaClient();
    global.__prisma = prisma;
}

/**
 * Вызывается из bot.start когда startPayload = "login_<token>".
 * Атомарно:
 *   1) находит/создаёт User по tg-from
 *   2) находит TgLoginToken
 *   3) если PENDING и не истёк — переводит в READY и привязывает userId
 *   4) возвращает {ok, reason?}
 */
async function confirmLoginToken(token, tgFrom) {
    const t = await prisma.tgLoginToken.findUnique({ where: { token } });
    if (!t) return { ok: false, reason: 'not_found' };
    if (t.status !== 'PENDING') {
        return { ok: false, reason: 'status_' + t.status.toLowerCase() };
    }
    if (t.expiresAt < new Date()) {
        await prisma.tgLoginToken.update({
            where: { token },
            data: { status: 'EXPIRED' },
        });
        return { ok: false, reason: 'expired' };
    }
    // Регистрируем/обновляем юзера в БД
    const user = await getOrCreateBotUser(tgFrom);
    if (!user || !user.id) return { ok: false, reason: 'user_create_failed' };

    await prisma.tgLoginToken.update({
        where: { token },
        data: {
            status: 'READY',
            userId: user.id,
            confirmedAt: new Date(),
        },
    });
    return { ok: true, user };
}

module.exports = { confirmLoginToken };
