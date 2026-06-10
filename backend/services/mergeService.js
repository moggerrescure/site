'use strict';

/**
 * Merge Service — Phase 2.2
 *
 * Манaged objединение Profile-страниц памяти.
 *
 * Workflow:
 *   createRequest          → PENDING_OWNERS (или PENDING_ADMIN если requester — оба owner)
 *   ownerApprove(source)   → updates sourceOwnerApprovedAt
 *   ownerApprove(target)   → updates targetOwnerApprovedAt
 *                            если оба → PENDING_ADMIN
 *   adminApprove           → APPROVED
 *   execute                → EXECUTED (транзакционный relink + soft-delete source)
 *
 * Тупиковые статусы: REJECTED, CANCELLED, EXECUTED.
 *
 * Execute relink-ит 9 FK-таблиц:
 *   CandleLight, ContentBlock, GalleryItem, GuestMemory,
 *   ProfileAccess (с union-dedupe), ProfileAccessCode,
 *   ProfileDispute (profileId + duplicateOfProfileId), QrPlaque, TimelineEvent.
 *
 * НЕ перепривязывает: ProfileMergeRequest (исторические), AuditLog, LegacyContact.
 *
 * Source profile soft-deleted (deletedAt = now). Slug остаётся уникальным.
 * Frontend может перенаправлять source.slug → target.slug по deletedAt + executed-merge link.
 */

const prisma = require('../lib/prisma');
const { ApiError } = require('../middleware/errors');

const ACTIVE_STATUSES = new Set(['PENDING_OWNERS', 'PENDING_ADMIN', 'APPROVED']);
const REJECTABLE_STATUSES = new Set(['PENDING_OWNERS', 'PENDING_ADMIN', 'APPROVED']);
const CANCELLABLE_STATUSES = new Set(['PENDING_OWNERS', 'PENDING_ADMIN', 'APPROVED']);

const STANDARD_INCLUDE = {
  sourceProfile: { select: { id: true, slug: true, fullName: true, ownerId: true, deletedAt: true } },
  targetProfile: { select: { id: true, slug: true, fullName: true, ownerId: true, deletedAt: true } },
  requester:     { select: { id: true, displayName: true, email: true } },
  dispute:       { select: { id: true, reason: true, status: true } },
};

// ────── helpers ──────
const isAdmin = (a) => !!a && a.role === 'ADMIN';

function viewerHint(req, actor) {
  if (isAdmin(actor)) return 'admin';
  if (!actor) return 'other';
  if (req.requesterId === actor.id) return 'requester';
  if (req.sourceProfile && req.sourceProfile.ownerId === actor.id) return 'owner-source';
  if (req.targetProfile && req.targetProfile.ownerId === actor.id) return 'owner-target';
  return 'other';
}

function canView(req, actor) {
  return viewerHint(req, actor) !== 'other';
}

function serialize(req, opts = {}) {
  const hint = opts.viewerHint || viewerHint(req, opts.actor);
  const showRequesterEmail = hint === 'admin' || hint === 'requester';
  return {
    id: req.id,
    sourceProfile: req.sourceProfile ? {
      id: req.sourceProfile.id,
      slug: req.sourceProfile.slug,
      title: req.sourceProfile.fullName || null,
      ownerId: hint === 'admin' ? req.sourceProfile.ownerId : undefined,
      deleted: !!req.sourceProfile.deletedAt,
    } : null,
    targetProfile: req.targetProfile ? {
      id: req.targetProfile.id,
      slug: req.targetProfile.slug,
      title: req.targetProfile.fullName || null,
      ownerId: hint === 'admin' ? req.targetProfile.ownerId : undefined,
      deleted: !!req.targetProfile.deletedAt,
    } : null,
    requester: req.requester ? {
      id: req.requester.id,
      displayName: req.requester.displayName,
      email: showRequesterEmail ? req.requester.email : undefined,
    } : null,
    reason: req.reason,
    status: req.status,
    sourceOwnerApprovedAt: req.sourceOwnerApprovedAt,
    targetOwnerApprovedAt: req.targetOwnerApprovedAt,
    adminApprovedAt: req.adminApprovedAt,
    executedAt: req.executedAt,
    rejectedAt: req.rejectedAt,
    rejectionReason: req.rejectionReason,
    dispute: req.dispute ? {
      id: req.dispute.id,
      reason: req.dispute.reason,
      status: req.dispute.status,
    } : null,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    viewerHint: hint,
  };
}

async function findProfileMin(idOrSlug) {
  if (!idOrSlug) return null;
  return prisma.profile.findFirst({
    where: { OR: [{ id: String(idOrSlug) }, { slug: String(idOrSlug) }] },
    select: { id: true, slug: true, fullName: true, ownerId: true, deletedAt: true, familyNodeId: true },
  });
}

async function findRequest(id) {
  if (!id) throw ApiError.badRequest('id обязателен');
  const r = await prisma.profileMergeRequest.findUnique({
    where: { id: String(id) },
    include: STANDARD_INCLUDE,
  });
  if (!r) throw ApiError.notFound('Запрос на объединение не найден');
  return r;
}

// ────── createRequest ──────
async function createRequest({ sourceSlug, targetSlug, reason, actor, disputeId }) {
  if (!actor) throw ApiError.unauthorized();
  const source = await findProfileMin(sourceSlug);
  if (!source) throw ApiError.notFound('Source профиль не найден');
  const target = await findProfileMin(targetSlug);
  if (!target) throw ApiError.notFound('Target профиль не найден');

  if (source.id === target.id) throw ApiError.badRequest('source и target — один и тот же профиль');
  if (source.deletedAt) throw ApiError.badRequest('Source профиль уже удалён');
  if (target.deletedAt) throw ApiError.badRequest('Target профиль уже удалён');

  const isRequesterOwner = source.ownerId === actor.id || target.ownerId === actor.id;
  if (!isAdmin(actor) && !isRequesterOwner) {
    throw ApiError.forbidden('Запрос может создать только владелец одного из профилей или администратор');
  }

  if (reason !== undefined && reason !== null && String(reason).length > 2000) {
    throw ApiError.badRequest('reason: максимум 2000 символов');
  }

  // Нет активных дублей
  const existing = await prisma.profileMergeRequest.findFirst({
    where: {
      OR: [
        { sourceProfileId: source.id, targetProfileId: target.id },
        { sourceProfileId: target.id, targetProfileId: source.id },
      ],
      status: { in: ['PENDING_OWNERS', 'PENDING_ADMIN', 'APPROVED'] },
    },
    select: { id: true, status: true },
  });
  if (existing) {
    throw ApiError.conflict(`Активный запрос уже существует (id=${existing.id}, status=${existing.status})`);
  }

  // Авто-аппрув стороны, если requester == owner
  const now = new Date();
  const data = {
    sourceProfileId: source.id,
    targetProfileId: target.id,
    requesterId: actor.id,
    reason: reason ? String(reason).trim() : null,
    status: 'PENDING_OWNERS',
  };
  if (source.ownerId === actor.id) {
    data.sourceOwnerApprovedAt = now;
    data.sourceOwnerApprovedBy = actor.id;
  }
  if (target.ownerId === actor.id) {
    data.targetOwnerApprovedAt = now;
    data.targetOwnerApprovedBy = actor.id;
  }
  if (data.sourceOwnerApprovedAt && data.targetOwnerApprovedAt) {
    data.status = 'PENDING_ADMIN';
  }

  let created;
  if (disputeId) {
    // Создаём запрос и сразу линкуем dispute в одной транзакции
    created = await prisma.$transaction(async (tx) => {
      const mr = await tx.profileMergeRequest.create({ data, include: STANDARD_INCLUDE });
      await tx.profileDispute.update({
        where: { id: disputeId },
        data: { mergeRequestId: mr.id },
      });
      return mr;
    });
  } else {
    created = await prisma.profileMergeRequest.create({ data, include: STANDARD_INCLUDE });
  }
  return serialize(created, { actor });
}

// ────── ownerApprove ──────
async function ownerApprove({ requestId, actor }) {
  if (!actor) throw ApiError.unauthorized();
  const req = await findRequest(requestId);

  if (req.status !== 'PENDING_OWNERS' && req.status !== 'PENDING_ADMIN') {
    throw ApiError.conflict(`Невозможно одобрить как владелец в статусе ${req.status}`);
  }

  const isSourceOwner = req.sourceProfile.ownerId === actor.id;
  const isTargetOwner = req.targetProfile.ownerId === actor.id;
  if (!isSourceOwner && !isTargetOwner) {
    throw ApiError.forbidden('Только владельцы могут одобрять как владелец');
  }

  const now = new Date();
  const update = {};
  if (isSourceOwner && !req.sourceOwnerApprovedAt) {
    update.sourceOwnerApprovedAt = now;
    update.sourceOwnerApprovedBy = actor.id;
  }
  if (isTargetOwner && !req.targetOwnerApprovedAt) {
    update.targetOwnerApprovedAt = now;
    update.targetOwnerApprovedBy = actor.id;
  }
  if (Object.keys(update).length === 0) {
    throw ApiError.conflict('Вы уже одобрили этот запрос');
  }

  const sourceFinal = update.sourceOwnerApprovedAt || req.sourceOwnerApprovedAt;
  const targetFinal = update.targetOwnerApprovedAt || req.targetOwnerApprovedAt;
  if (sourceFinal && targetFinal && req.status === 'PENDING_OWNERS') {
    update.status = 'PENDING_ADMIN';
  }

  const updated = await prisma.profileMergeRequest.update({
    where: { id: req.id },
    data: update,
    include: STANDARD_INCLUDE,
  });
  return serialize(updated, { actor });
}

// ────── adminApprove ──────
async function adminApprove({ requestId, actor }) {
  if (!isAdmin(actor)) throw ApiError.forbidden('Только администратор может выполнить admin approve');
  const req = await findRequest(requestId);

  if (req.status !== 'PENDING_ADMIN') {
    throw ApiError.conflict(`Невозможно admin-approve в статусе ${req.status} (требуется PENDING_ADMIN)`);
  }

  const updated = await prisma.profileMergeRequest.update({
    where: { id: req.id },
    data: {
      status: 'APPROVED',
      adminApprovedAt: new Date(),
      adminApprovedBy: actor.id,
    },
    include: STANDARD_INCLUDE,
  });
  return serialize(updated, { actor });
}

// ────── reject ──────
async function reject({ requestId, actor, reason }) {
  if (!actor) throw ApiError.unauthorized();
  const req = await findRequest(requestId);

  if (!REJECTABLE_STATUSES.has(req.status)) {
    throw ApiError.conflict(`Невозможно отклонить в статусе ${req.status}`);
  }

  const canReject = isAdmin(actor)
    || req.sourceProfile.ownerId === actor.id
    || req.targetProfile.ownerId === actor.id;
  if (!canReject) throw ApiError.forbidden('Отклонять может только владелец или администратор');

  if (reason !== undefined && reason !== null && String(reason).length > 2000) {
    throw ApiError.badRequest('reason: максимум 2000 символов');
  }

  const updated = await prisma.profileMergeRequest.update({
    where: { id: req.id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: actor.id,
      rejectionReason: reason ? String(reason).trim() : null,
    },
    include: STANDARD_INCLUDE,
  });
  return serialize(updated, { actor });
}

// ────── cancel ──────
async function cancel({ requestId, actor }) {
  if (!actor) throw ApiError.unauthorized();
  const req = await findRequest(requestId);

  if (!CANCELLABLE_STATUSES.has(req.status)) {
    throw ApiError.conflict(`Невозможно отменить в статусе ${req.status}`);
  }
  if (req.requesterId !== actor.id && !isAdmin(actor)) {
    throw ApiError.forbidden('Отменить может только создатель запроса или администратор');
  }

  const updated = await prisma.profileMergeRequest.update({
    where: { id: req.id },
    data: { status: 'CANCELLED' },
    include: STANDARD_INCLUDE,
  });
  return serialize(updated, { actor });
}

// ────── execute — THE BIG ONE ──────
async function execute({ requestId, actor }) {
  if (!isAdmin(actor)) throw ApiError.forbidden('Execute может только администратор');
  const req = await findRequest(requestId);
  if (req.status !== 'APPROVED') {
    throw ApiError.conflict(`Execute возможен только в статусе APPROVED (текущий: ${req.status})`);
  }

  const sourceId = req.sourceProfileId;
  const targetId = req.targetProfileId;
  if (sourceId === targetId) throw ApiError.internal('source === target в APPROVED merge (sanity check)');
  if (req.sourceProfile.deletedAt) throw ApiError.conflict('source профиль уже soft-deleted');
  if (req.targetProfile.deletedAt) throw ApiError.conflict('target профиль soft-deleted (не может быть target)');

  const result = await prisma.$transaction(async (tx) => {
    const stats = {};

    // 1) Simple relink на 7 таблицах
    const simpleTables = [
      ['candleLight',       'candles'],
      ['contentBlock',      'blocks'],
      ['galleryItem',       'gallery'],
      ['guestMemory',       'memories'],
      ['profileAccessCode', 'accessCodes'],
      ['qrPlaque',          'qrPlaques'],
      ['timelineEvent',     'timelineEvents'],
    ];
    for (const [model, key] of simpleTables) {
      const r = await tx[model].updateMany({
        where: { profileId: sourceId },
        data:  { profileId: targetId },
      });
      stats[key] = r.count;
    }

    // 2) ProfileDispute.profileId → relink на target
    const dispR = await tx.profileDispute.updateMany({
      where: { profileId: sourceId },
      data:  { profileId: targetId },
    });
    stats.disputes_profileId = dispR.count;

    // 3) ProfileDispute.duplicateOfProfileId → relink на target
    const dupR = await tx.profileDispute.updateMany({
      where: { duplicateOfProfileId: sourceId },
      data:  { duplicateOfProfileId: targetId },
    });
    stats.disputes_duplicateOf = dupR.count;

    // 4) ProfileAccess — union dedupe (unique [profileId, userId])
    const sourceAccesses = await tx.profileAccess.findMany({ where: { profileId: sourceId } });
    let relinked = 0;
    let merged = 0;
    for (const sa of sourceAccesses) {
      const ta = await tx.profileAccess.findUnique({
        where: { profileId_userId: { profileId: targetId, userId: sa.userId } },
      });
      if (ta) {
        const newCanEdit = sa.canEdit || ta.canEdit;
        if (newCanEdit !== ta.canEdit) {
          await tx.profileAccess.update({ where: { id: ta.id }, data: { canEdit: newCanEdit } });
        }
        await tx.profileAccess.delete({ where: { id: sa.id } });
        merged++;
      } else {
        await tx.profileAccess.update({ where: { id: sa.id }, data: { profileId: targetId } });
        relinked++;
      }
    }
    stats.access = { relinked, merged };

    // 5) Soft-delete source
    await tx.profile.update({
      where: { id: sourceId },
      data:  { deletedAt: new Date() },
    });

    // 6) Mark merge request as EXECUTED
    const updated = await tx.profileMergeRequest.update({
      where: { id: req.id },
      data: { status: 'EXECUTED', executedAt: new Date() },
      include: STANDARD_INCLUDE,
    });

    return { updated, stats };
  }, {
    maxWait: 5000,
    timeout: 30000,
  });

  return {
    request: serialize(result.updated, { actor }),
    stats: result.stats,
  };
}

// ────── Queries ──────
async function getById({ id, actor }) {
  const req = await findRequest(id);
  if (!canView(req, actor)) throw ApiError.forbidden('Нет доступа к этому запросу');
  return serialize(req, { actor });
}

async function listForProfile({ slug, actor }) {
  if (!actor) throw ApiError.unauthorized();
  const profile = await findProfileMin(slug);
  if (!profile) throw ApiError.notFound('Профиль не найден');

  const isOwner = profile.ownerId === actor.id;
  if (!isOwner && !isAdmin(actor)) {
    throw ApiError.forbidden('Только владелец или администратор может смотреть запросы профиля');
  }

  const rows = await prisma.profileMergeRequest.findMany({
    where: {
      OR: [
        { sourceProfileId: profile.id },
        { targetProfileId: profile.id },
      ],
    },
    include: STANDARD_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(r => serialize(r, { actor }));
}

async function listMine({ actor }) {
  if (!actor) throw ApiError.unauthorized();
  const rows = await prisma.profileMergeRequest.findMany({
    where: {
      OR: [
        { requesterId: actor.id },
        { sourceProfile: { ownerId: actor.id } },
        { targetProfile: { ownerId: actor.id } },
      ],
    },
    include: STANDARD_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(r => serialize(r, { actor }));
}

async function listAll({ status, limit = 20, page = 1, actor }) {
  if (!isAdmin(actor)) throw ApiError.forbidden('Доступ только для администраторов');
  const where = {};
  if (status) where.status = String(status).toUpperCase();
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = Math.max((Number(page) || 1) - 1, 0) * take;

  const [rows, total] = await Promise.all([
    prisma.profileMergeRequest.findMany({
      where, include: STANDARD_INCLUDE, orderBy: { createdAt: 'desc' }, take, skip,
    }),
    prisma.profileMergeRequest.count({ where }),
  ]);
  return {
    rows: rows.map(r => serialize(r, { actor })),
    total,
    page: Math.floor(skip / take) + 1,
    limit: take,
    hasMore: skip + rows.length < total,
  };
}

module.exports = {
  createRequest,
  ownerApprove,
  adminApprove,
  reject,
  cancel,
  execute,
  getById,
  listForProfile,
  listMine,
  listAll,
};
