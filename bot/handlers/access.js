'use strict';
/* access.js — wizard выдачи доступа к страницам памяти другим пользователям.
   Дублирует логику backend/services/accessService.js через Prisma напрямую. */
const { Markup } = require('telegraf');
const prisma = require('../lib/prisma');
const { getOrCreateBotUser } = require('../lib/auth');

function fmt(p) {
    const y = (d) => (d ? new Date(d).getFullYear() : '?');
    return `${p.fullName} (${y(p.birthDate)}–${y(p.deathDate)})`;
}

/* Шаг 1: показать список профилей юзера для выбора */
async function start(ctx) {
    const user = await getOrCreateBotUser(ctx.from);

    const profiles = await prisma.profile.findMany({
        where: { ownerId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, slug: true, fullName: true, birthDate: true, deathDate: true },
        take: 30,
    });

    if (!profiles.length) {
        return ctx.reply('🤝 У вас нет страниц для выдачи доступа.\n\nСоздайте страницу через 🕯 Создать страницу памяти.');
    }

    const buttons = profiles.map((p) => [
        Markup.button.callback(`📄 ${p.fullName.slice(0, 32)}`, `access_pick_${p.id}`),
    ]);

    return ctx.reply(
        '🤝 Управление доступом\n\nВыберите страницу:',
        Markup.inlineKeyboard(buttons)
    );
}

/* Шаг 2: выбран профиль → меню действий */
async function pickProfile(ctx, profileId) {
    const user = await getOrCreateBotUser(ctx.from);
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, slug: true, fullName: true, ownerId: true, deletedAt: true },
    });

    if (!profile || profile.deletedAt) {
        ctx.answerCbQuery('Не найдено');
        return ctx.editMessageText('⚠️ Страница не найдена.');
    }
    if (profile.ownerId !== user.id && user.role !== 'ADMIN') {
        ctx.answerCbQuery('Доступ запрещён');
        return ctx.editMessageText('⛔ Это не ваша страница.');
    }

    ctx.answerCbQuery();
    return ctx.editMessageText(
        `🤝 ${fmt(profile)}\n\nВыберите действие:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📋 Кому открыт доступ', `access_list_${profile.id}`)],
            [Markup.button.callback('➕ Выдать доступ',     `access_add_${profile.id}`)],
            [Markup.button.callback('↩️ Назад',             'access_back')],
        ])
    );
}

/* Список грантов */
async function listGrants(ctx, profileId) {
    const user = await getOrCreateBotUser(ctx.from);
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, fullName: true, ownerId: true },
    });
    if (!profile || (profile.ownerId !== user.id && user.role !== 'ADMIN')) {
        ctx.answerCbQuery('Доступ запрещён');
        return;
    }

    const grants = await prisma.profileAccess.findMany({
        where: { profileId },
        include: { user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
    });

    ctx.answerCbQuery();

    if (!grants.length) {
        return ctx.editMessageText(
            `📋 ${profile.fullName}\n\nДоступ ни у кого не открыт.`,
            Markup.inlineKeyboard([
                [Markup.button.callback('➕ Выдать доступ', `access_add_${profile.id}`)],
                [Markup.button.callback('↩️ Назад',         `access_pick_${profile.id}`)],
            ])
        );
    }

    const lines = grants.map((g, i) => {
        const name = g.user.displayName || g.user.email;
        const role = g.canEdit ? '✏️ редактор' : '👁 просмотр';
        return `${i + 1}. ${name}\n   ${g.user.email}\n   ${role}`;
    }).join('\n\n');

    const buttons = grants.map((g) => [
        Markup.button.callback(
            `❌ ${(g.user.displayName || g.user.email).slice(0, 28)}`,
            `access_revoke_${profile.id}_${g.userId}`
        ),
    ]);
    buttons.push([Markup.button.callback('➕ Выдать ещё', `access_add_${profile.id}`)]);
    buttons.push([Markup.button.callback('↩️ Назад',     `access_pick_${profile.id}`)]);

    return ctx.editMessageText(
        `📋 Доступ к «${profile.fullName}»:\n\n${lines}\n\n❌ — отозвать`,
        Markup.inlineKeyboard(buttons)
    );
}

/* Начать ввод email */
async function startAdd(ctx, profileId) {
    const user = await getOrCreateBotUser(ctx.from);
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, slug: true, fullName: true, ownerId: true },
    });
    if (!profile || (profile.ownerId !== user.id && user.role !== 'ADMIN')) {
        ctx.answerCbQuery('Доступ запрещён');
        return;
    }

    ctx.session.wizard = {
        step: 'access_email',
        data: { profileId: profile.id, profileName: profile.fullName },
    };

    ctx.answerCbQuery();
    return ctx.editMessageText(
        `➕ Выдать доступ к «${profile.fullName}»\n\nОтправьте email пользователя, которому хотите дать доступ.\n\nЭтот пользователь должен быть уже зарегистрирован на сайте.`,
        Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Отмена', 'access_back')],
        ])
    );
}

/* Получили email → проверяем юзера, спрашиваем уровень */
async function handleEmail(ctx) {
    const email = (ctx.message?.text || '').trim().toLowerCase();
    if (!email.includes('@') || email.length < 5) {
        return ctx.reply('❌ Некорректный email. Попробуйте ещё раз или /menu для отмены.');
    }

    const { profileId, profileName } = ctx.session.wizard.data;

    const target = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, displayName: true },
    });

    if (!target) {
        return ctx.reply(
            `❌ Пользователь с email \`${email}\` не зарегистрирован на сайте.\n\nПопросите его сначала зарегистрироваться (или установить пароль через /menu → 🔑 Пароль если он пользуется ботом).\n\nВведите другой email или /menu для отмены.`,
            { parse_mode: 'Markdown' }
        );
    }

    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { ownerId: true },
    });
    if (target.id === profile.ownerId) {
        ctx.session = {};
        return ctx.reply('⚠️ Это владелец страницы, ему доступ не нужен.');
    }

    // Сохраняем targetId для следующего шага
    ctx.session.wizard.data.targetUserId = target.id;
    ctx.session.wizard.data.targetEmail = target.email;
    ctx.session.wizard.data.targetName = target.displayName || target.email;
    ctx.session.wizard.step = 'access_level';

    return ctx.reply(
        `✅ Найден: ${target.displayName || target.email} (${target.email})\n\nКакой уровень доступа выдать к «${profileName}»?`,
        Markup.inlineKeyboard([
            [Markup.button.callback('👁 Только просмотр', 'access_level_view')],
            [Markup.button.callback('✏️ Просмотр и редактирование', 'access_level_edit')],
            [Markup.button.callback('↩️ Отмена', 'access_back')],
        ])
    );
}

async function finishGrant(ctx, canEdit) {
    const state = ctx.session?.wizard;
    if (!state || state.step !== 'access_level') {
        ctx.answerCbQuery();
        return;
    }
    const { profileId, profileName, targetUserId, targetEmail, targetName } = state.data;
    const user = await getOrCreateBotUser(ctx.from);

    try {
        await prisma.profileAccess.upsert({
            where: { profileId_userId: { profileId, userId: targetUserId } },
            update: { canEdit },
            create: {
                profileId,
                userId: targetUserId,
                grantedBy: user.id,
                canEdit,
            },
        });
    } catch (e) {
        ctx.session = {};
        ctx.answerCbQuery();
        return ctx.editMessageText(`❌ Не удалось выдать доступ: ${e.message}`);
    }

    ctx.session = {};
    ctx.answerCbQuery('Доступ выдан');
    const role = canEdit ? '✏️ редактор' : '👁 просмотр';
    return ctx.editMessageText(
        `✅ Доступ выдан\n\n${targetName} (${targetEmail})\nк «${profileName}»\nуровень: ${role}\n\n/access — управление другими страницами`
    );
}

async function revokeGrant(ctx, profileId, userId) {
    const user = await getOrCreateBotUser(ctx.from);
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { ownerId: true, fullName: true },
    });
    if (!profile || (profile.ownerId !== user.id && user.role !== 'ADMIN')) {
        ctx.answerCbQuery('Доступ запрещён');
        return;
    }

    try {
        await prisma.profileAccess.delete({
            where: { profileId_userId: { profileId, userId } },
        });
    } catch (e) {
        ctx.answerCbQuery('Уже отозван');
    }

    ctx.answerCbQuery('Отозван');
    return listGrants(ctx, profileId);
}

async function back(ctx) {
    ctx.session = {};
    ctx.answerCbQuery();
    return ctx.editMessageText('↩️ Операция отменена. /access — начать заново.');
}

module.exports = { start, pickProfile, listGrants, startAdd, handleEmail, finishGrant, revokeGrant, back };
