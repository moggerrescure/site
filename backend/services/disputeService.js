'use strict';

const prisma = require('../lib/prisma');
const { ApiError } = require('../middleware/errors');
const mergeService = require('./mergeService');
const auditService = require('./auditService');

const VALID_REASONS = ['WRONG_INFO', 'INAPPROPRIATE', 'OWNERSHIP_CLAIM', 'DUPLICATE', 'OTHER'];

function isAdmin(actor)            { return !!actor && actor.role === 'ADMIN'; }
function isOwnerOf(profile, actor) { return !!actor && profile && profile.ownerId === actor.id; }

function serialize(d, { viewerHint = 'public' } = {}) {
  const out = {
    id:                    d.id,
    profileId:             d.profileId,
    reporterId:            d.reporterId,
    reason:                d.reason,
    description:           d.description,
    evidence:              d.evidence || null,
    duplicateOfProfileId:  d.duplicateOfProfileId || null,
    status:                d.status,
    resolution:            d.resolution || null,
    resolverId:            d.resolverId || null,
    resolvedAt:            d.resolvedAt || null,
    mergeRequestId:        d.mergeRequestId || null,
    createdAt:             d.createdAt,
    updatedAt:             d.updatedAt,
  };
  if (d.reporter) {
    out.reporter = {
      id:          d.reporter.id,
      displayName: d.reporter.displayName,
      ...(viewerHint === 'admin' || viewerHint === 'reporter'
        ? { email: d.reporter.email } : {}),
    };
  }
  if (d.profile) {
    out.profile = {
      id:    d.profile.id,
      slug:  d.profile.slug,
      title: d.profile.fullName || null,
    };
  }
  if (d.duplicateOfProfile) {
    out.duplicateOfProfile = {
      id:    d.duplicateOfProfile.id,
      slug:  d.duplicateOfProfile.slug,
      title: d.duplicateOfProfile.fullName || null,
    };
  }
  return out;
}

async function findProfileMin(idOrSlug) {
  const p = await prisma.profile.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true, slug: true, ownerId: true, visibility: true, deletedAt: true },
  });
  if (!p)            throw ApiError.notFound('Профиль не найден');
  if (p.deletedAt)   throw ApiError.notFound('Профиль удалён');
  return p;
}

const STANDARD_INCLUDE = {
  reporter:           { select: { id: true, displayName: true, email: true } },
  profile:            { select: { id: true, slug: true, fullName: true, ownerId: true } },
  duplicateOfProfile: { select: { id: true, slug: true, fullName: true } },
};

function canViewDispute(d, actor) {
  if (!actor) return false;
  if (isAdmin(actor))                      return true;
  if (d.reporterId === actor.id)           return true;
  if (d.profile && d.profile.ownerId === actor.id) return true;
  return false;
}

function hintFor(d, actor) {
  if (isAdmin(actor))                                return 'admin';
  if (actor && d.reporterId === actor.id)            return 'reporter';
  if (d.profile && actor && d.profile.ownerId === actor.id) return 'owner';
  return 'public';
}

/* ─── CREATE ─────────────────────────────────────────── */
async function create(profileIdOrSlug, data, actor) {
  if (!actor || !actor.id) throw ApiError.unauthorized();

  const profile = await findProfileMin(profileIdOrSlug);
  if (isOwnerOf(profile, actor)) {
    throw ApiError.badRequest('Нельзя оспорить собственный профиль — отредактируйте его напрямую');
  }

  const reason = (data.reason || '').toString().toUpperCase();
  if (!VALID_REASONS.includes(reason)) {
    throw ApiError.badRequest(`reason должен быть одним из: ${VALID_REASONS.join(', ')}`);
  }

  const description = (data.description || '').toString().trim().slice(0, 4000);
  if (!description || description.length < 10) {
    throw ApiError.badRequest('description обязателен (минимум 10 символов)');
  }

  const evidence = data.evidence
    ? (data.evidence.toString().trim().slice(0, 2000) || null)
    : null;

  let duplicateOfProfileId = null;
  if (reason === 'DUPLICATE' && data.duplicateOfProfileId) {
    const dup = await prisma.profile.findFirst({
      where: {
        OR: [
          { id:   data.duplicateOfProfileId.toString() },
          { slug: data.duplicateOfProfileId.toString() },
        ],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!dup) throw ApiError.badRequest('Профиль-оригинал не найден');
    if (dup.id === profile.id) throw ApiError.badRequest('Профиль не может быть дубликатом самого себя');
    duplicateOfProfileId = dup.id;
  }

  // Запрет дубля open-спора от одного reporter'а на один профиль
  const existing = await prisma.profileDispute.findFirst({
    where: {
      profileId:  profile.id,
      reporterId: actor.id,
      status:     { in: ['OPEN', 'UNDER_REVIEW'] },
    },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('У вас уже есть открытый спор на этот профиль');
  }

  const created = await prisma.profileDispute.create({
    data: {
      profileId:            profile.id,
      reporterId:           actor.id,
      reason,
      description,
      evidence,
      duplicateOfProfileId,
      status:               'OPEN',
    },
    include: STANDARD_INCLUDE,
  });

  return serialize(created, { viewerHint: 'reporter' });
}

/* ─── GET BY ID ──────────────────────────────────────── */
async function getById(disputeId, actor) {
  if (!actor) throw ApiError.unauthorized();
  const d = await prisma.profileDispute.findUnique({
    where:   { id: disputeId },
    include: STANDARD_INCLUDE,
  });
  if (!d) throw ApiError.notFound('Спор не найден');
  if (!canViewDispute(d, actor)) {
    throw ApiError.forbidden('Нет прав на просмотр этого спора');
  }
  return serialize(d, { viewerHint: hintFor(d, actor) });
}

/* ─── LIST FOR PROFILE ───────────────────────────────── */
async function listForProfile(profileIdOrSlug, actor, { status } = {}) {
  if (!actor) throw ApiError.unauthorized();
  const profile = await findProfileMin(profileIdOrSlug);

  const where = { profileId: profile.id };
  if (status && VALID_STATUSES_FOR_LIST.has(status)) where.status = status;

  // Owner и admin видят все споры, прочие — только свои
  if (!isAdmin(actor) && !isOwnerOf(profile, actor)) {
    where.reporterId = actor.id;
  }

  const rows = await prisma.profileDispute.findMany({
    where,
    include: STANDARD_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(d => serialize(d, { viewerHint: hintFor(d, actor) }));
}

const VALID_STATUSES_FOR_LIST = new Set([
  'OPEN', 'UNDER_REVIEW', 'RESOLVED_ACCEPTED', 'RESOLVED_REJECTED', 'WITHDRAWN',
]);

/* ─── LIST ALL (ADMIN) ───────────────────────────────── */
async function listAll(actor, { status, reason, page = 1, limit = 50 } = {}) {
  if (!isAdmin(actor)) throw ApiError.forbidden('Только администраторы');

  const where = {};
  if (status && VALID_STATUSES_FOR_LIST.has(status)) where.status = status;
  if (reason && VALID_REASONS.includes(reason))      where.reason = reason;

  const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

  const [rows, total] = await Promise.all([
    prisma.profileDispute.findMany({
      where,
      include: STANDARD_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip, take,
    }),
    prisma.profileDispute.count({ where }),
  ]);

  return {
    rows:    rows.map(d => serialize(d, { viewerHint: 'admin' })),
    total,
    page:    parseInt(page, 10) || 1,
    limit:   take,
    hasMore: skip + rows.length < total,
  };
}

/* ─── LIST MINE (reporter) ───────────────────────────── */
async function listMine(actor) {
  if (!actor || !actor.id) throw ApiError.unauthorized();
  const rows = await prisma.profileDispute.findMany({
    where:   { reporterId: actor.id },
    include: STANDARD_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(d => serialize(d, { viewerHint: 'reporter' }));
}

/* ─── WITHDRAW (reporter only) ───────────────────────── */
async function withdraw(disputeId, actor) {
  if (!actor || !actor.id) throw ApiError.unauthorized();
  const d = await prisma.profileDispute.findUnique({ where: { id: disputeId } });
  if (!d) throw ApiError.notFound('Спор не найден');
  if (d.reporterId !== actor.id) {
    throw ApiError.forbidden('Отозвать спор может только его автор');
  }
  if (!['OPEN', 'UNDER_REVIEW'].includes(d.status)) {
    throw ApiError.conflict(`Нельзя отозвать спор в статусе ${d.status}`);
  }
  const updated = await prisma.profileDispute.update({
    where:   { id: disputeId },
    data:    { status: 'WITHDRAWN', resolvedAt: new Date() },
    include: STANDARD_INCLUDE,
  });
  return serialize(updated, { viewerHint: 'reporter' });
}

/* ─── UPDATE STATUS (ADMIN: → UNDER_REVIEW) ──────────── */
async function updateStatus(disputeId, status, actor) {
  if (!isAdmin(actor)) throw ApiError.forbidden('Только администраторы');
  if (status !== 'UNDER_REVIEW') {
    throw ApiError.badRequest('Этот endpoint переводит только в UNDER_REVIEW. Для финального статуса используй /resolve');
  }
  const d = await prisma.profileDispute.findUnique({ where: { id: disputeId } });
  if (!d) throw ApiError.notFound('Спор не найден');
  if (d.status !== 'OPEN') {
    throw ApiError.conflict(`Перевести в UNDER_REVIEW можно только из OPEN, текущий: ${d.status}`);
  }
  const updated = await prisma.profileDispute.update({
    where:   { id: disputeId },
    data:    { status: 'UNDER_REVIEW' },
    include: STANDARD_INCLUDE,
  });
  return serialize(updated, { viewerHint: 'admin' });
}

/* ─── RESOLVE (ADMIN: ACCEPTED / REJECTED) ───────────── */
async function resolve(disputeId, data, actor) {
  if (!isAdmin(actor)) throw ApiError.forbidden('Только администраторы');

  const STATUS_MAP = {
    accept: 'RESOLVED_ACCEPTED',  accepted: 'RESOLVED_ACCEPTED',  RESOLVED_ACCEPTED: 'RESOLVED_ACCEPTED',
    reject: 'RESOLVED_REJECTED',  rejected: 'RESOLVED_REJECTED',  RESOLVED_REJECTED: 'RESOLVED_REJECTED',
  };
  const finalStatus = STATUS_MAP[data.status || data.outcome || ''];
  if (!finalStatus) {
    throw ApiError.badRequest('status обязателен: "accept" / "reject" (или полные RESOLVED_ACCEPTED / RESOLVED_REJECTED)');
  }

  const resolution = (data.resolution || '').toString().trim().slice(0, 4000);
  if (!resolution || resolution.length < 5) {
    throw ApiError.badRequest('resolution обязателен (минимум 5 символов) — опиши решение для аудита');
  }

  const d = await prisma.profileDispute.findUnique({ where: { id: disputeId } });
  if (!d) throw ApiError.notFound('Спор не найден');
  if (['RESOLVED_ACCEPTED', 'RESOLVED_REJECTED', 'WITHDRAWN'].includes(d.status)) {
    throw ApiError.conflict(`Спор уже закрыт (${d.status})`);
  }

  const updated = await prisma.profileDispute.update({
    where: { id: disputeId },
    data:  {
      status:     finalStatus,
      resolution,
      resolverId: actor.id,
      resolvedAt: new Date(),
    },
    include: STANDARD_INCLUDE,
  });

  // Auto-link: если DUPLICATE спор подтверждён и указан duplicateOfProfileId,
  // автоматически создаём ProfileMergeRequest (source=disputed, target=canonical).
  // mergeService.createRequest({disputeId}) сам линкует dispute.mergeRequestId в транзакции.
  let autoMerge = null;
  if (d.reason === 'DUPLICATE' && finalStatus === 'RESOLVED_ACCEPTED' && d.duplicateOfProfileId) {
    try {
      const [source, target] = await Promise.all([
        prisma.profile.findUnique({ where: { id: d.profileId },            select: { slug: true } }),
        prisma.profile.findUnique({ where: { id: d.duplicateOfProfileId }, select: { slug: true } }),
      ]);
      if (source && target) {
        autoMerge = await mergeService.createRequest({
          sourceSlug: source.slug,
          targetSlug: target.slug,
          reason:     `Автосоздан после разрешения спора #${d.id}: ${resolution}`.slice(0, 2000),
          actor,
          disputeId:  d.id,
        });
        // Audit log MR creation (мимо auditWrap, поскольку вызов из service)
        try {
          await auditService.logAction({
            action:     'MERGE_REQUEST_CREATE',
            userId:     actor.id,
            entityType: 'ProfileMergeRequest',
            entityId:   autoMerge.id,
            newValue:   autoMerge,
            metadata:   { source: 'dispute-auto-link', disputeId: d.id },
          });
        } catch (auditErr) {
          console.error('[disputeService.resolve] audit log failed:', auditErr.message);
        }
      }
    } catch (e) {
      console.error('[disputeService.resolve] auto-merge failed:', e.message);
      autoMerge = { error: e.message };
    }
  }

  // Если auto-merge сработал — перечитаем dispute, чтобы mergeRequestId был свежим
  const finalDispute = (autoMerge && !autoMerge.error)
    ? await prisma.profileDispute.findUnique({ where: { id: disputeId }, include: STANDARD_INCLUDE })
    : updated;

  const out = serialize(finalDispute, { viewerHint: 'admin' });
  if (autoMerge) out.mergeRequest = autoMerge;
  return out;
}

module.exports = {
  create,
  getById,
  listForProfile,
  listAll,
  listMine,
  withdraw,
  updateStatus,
  resolve,
};
