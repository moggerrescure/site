--
-- PostgreSQL database dump
--

\restrict OpJ0KQ1yXnyG0khTPHSpmfPDpKHAX6ZghtZc8Qo8s2VLYEKIwkg2qSQSfA0DwG8

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'LOGIN',
    'LOGIN_FAILED',
    'LOGOUT',
    'PROFILE_CREATE',
    'PROFILE_UPDATE',
    'PROFILE_SOFT_DELETE',
    'PROFILE_RESTORE',
    'PROFILE_HARD_DELETE',
    'TREE_CREATE',
    'TREE_DELETE',
    'USER_ROLE_CHANGE',
    'ACCESS_CODE_GENERATE',
    'ACCESS_CODE_REDEEM',
    'TREE_UPDATE',
    'TIMELINE_EVENT_CREATE',
    'TIMELINE_EVENT_UPDATE',
    'TIMELINE_EVENT_DELETE',
    'ACCESS_GRANT_CREATE',
    'ACCESS_GRANT_UPDATE',
    'ACCESS_GRANT_DELETE',
    'ACCESS_CODE_REVOKE',
    'ACCESS_CODE_DELETE',
    'DISPUTE_CREATE',
    'DISPUTE_UPDATE_STATUS',
    'DISPUTE_RESOLVE',
    'DISPUTE_WITHDRAW',
    'MERGE_REQUEST_CREATE',
    'MERGE_REQUEST_OWNER_APPROVE',
    'MERGE_REQUEST_ADMIN_APPROVE',
    'MERGE_REQUEST_REJECT',
    'MERGE_REQUEST_EXECUTE',
    'MERGE_REQUEST_CANCEL',
    'LEGACY_CONTACT_SET',
    'LEGACY_CONTACT_INVITE_SEND',
    'LEGACY_CONTACT_INVITE_ACCEPT',
    'LEGACY_CONTACT_REVOKE',
    'LEGACY_CONTACT_TRIGGER',
    'LEGACY_CLAIM_CREATE',
    'LEGACY_CLAIM_APPROVE',
    'LEGACY_CLAIM_REJECT',
    'OWNERSHIP_TRANSFER',
    'LEGACY_CLAIM_EXPIRE'
);


--
-- Name: BlockType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BlockType" AS ENUM (
    'HERO',
    'CHILDHOOD',
    'EDUCATION',
    'CAREER',
    'FAMILY',
    'HOBBIES',
    'LEGACY',
    'CUSTOM'
);


--
-- Name: DisputeReason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DisputeReason" AS ENUM (
    'WRONG_INFO',
    'INAPPROPRIATE',
    'OWNERSHIP_CLAIM',
    'DUPLICATE',
    'OTHER'
);


--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED_ACCEPTED',
    'RESOLVED_REJECTED',
    'WITHDRAWN'
);


--
-- Name: Gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'UNKNOWN'
);


--
-- Name: LegacyClaimStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LegacyClaimStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
);


--
-- Name: LegacyContactStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LegacyContactStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'TRIGGERED',
    'TRANSFERRED',
    'REVOKED'
);


--
-- Name: MediaKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaKind" AS ENUM (
    'IMAGE',
    'AUDIO',
    'VIDEO',
    'DOCUMENT'
);


--
-- Name: MemoryType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MemoryType" AS ENUM (
    'TEXT',
    'PHOTO',
    'AUDIO',
    'VIDEO'
);


--
-- Name: MergeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MergeStatus" AS ENUM (
    'PENDING_OWNERS',
    'PENDING_ADMIN',
    'APPROVED',
    'EXECUTED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: RelationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RelationType" AS ENUM (
    'PARENT',
    'SPOUSE',
    'ADOPTIVE',
    'STEP'
);


--
-- Name: TgLoginStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TgLoginStatus" AS ENUM (
    'PENDING',
    'READY',
    'CONSUMED',
    'EXPIRED'
);


--
-- Name: TimelineCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TimelineCategory" AS ENUM (
    'BIRTH',
    'DEATH',
    'MARRIAGE',
    'EDUCATION',
    'CAREER',
    'RELOCATION',
    'AWARD',
    'HISTORICAL',
    'CUSTOM'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'EDITOR',
    'ADMIN'
);


--
-- Name: Visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Visibility" AS ENUM (
    'PUBLIC',
    'UNLISTED',
    'PASSWORD',
    'PRIVATE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action public."AuditAction" NOT NULL,
    "userId" text,
    "entityType" text,
    "entityId" text,
    "oldValue" jsonb,
    "newValue" jsonb,
    metadata jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CandleLight; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CandleLight" (
    id text NOT NULL,
    "profileId" text,
    "userId" text,
    fingerprint text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ContentBlock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContentBlock" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    type public."BlockType" NOT NULL,
    title text,
    body text NOT NULL,
    "photoId" text,
    "order" integer NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FamilyClan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FamilyClan" (
    id text NOT NULL,
    "treeId" text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#c8a84b'::text NOT NULL,
    icon text DEFAULT '✦'::text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FamilyConnection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FamilyConnection" (
    id text NOT NULL,
    "fromNodeId" text NOT NULL,
    "toNodeId" text NOT NULL,
    type public."RelationType" NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FamilyNode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FamilyNode" (
    id text NOT NULL,
    "treeId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text,
    "maidenName" text,
    "birthDate" timestamp(3) without time zone,
    "deathDate" timestamp(3) without time zone,
    gender public."Gender" DEFAULT 'UNKNOWN'::public."Gender" NOT NULL,
    "photoId" text,
    notes text,
    "posX" double precision,
    "posY" double precision,
    generation integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clanId" text
);


--
-- Name: FamilyTree; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FamilyTree" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "ownerId" text NOT NULL,
    visibility public."Visibility" DEFAULT 'UNLISTED'::public."Visibility" NOT NULL,
    "accessHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GalleryItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GalleryItem" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "mediaId" text NOT NULL,
    caption text,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: GuestMemory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GuestMemory" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "authorUserId" text,
    "authorName" text NOT NULL,
    type public."MemoryType" DEFAULT 'TEXT'::public."MemoryType" NOT NULL,
    text text,
    "mediaId" text,
    "isApproved" boolean DEFAULT false NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LegacyClaim; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LegacyClaim" (
    id text NOT NULL,
    "legacyContactId" text NOT NULL,
    "claimantId" text NOT NULL,
    status public."LegacyClaimStatus" DEFAULT 'PENDING'::public."LegacyClaimStatus" NOT NULL,
    evidence text,
    "reviewerId" text,
    "reviewedAt" timestamp(3) without time zone,
    "reviewNotes" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LegacyContact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LegacyContact" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    "heirUserId" text,
    "heirEmail" text NOT NULL,
    "heirName" text,
    status public."LegacyContactStatus" DEFAULT 'PENDING'::public."LegacyContactStatus" NOT NULL,
    "inviteTokenHash" text,
    "inviteExpiresAt" timestamp(3) without time zone,
    "inviteSentAt" timestamp(3) without time zone,
    "verifiedAt" timestamp(3) without time zone,
    "triggeredAt" timestamp(3) without time zone,
    "inactivityDays" integer DEFAULT 90 NOT NULL,
    message text,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Media" (
    id text NOT NULL,
    kind public."MediaKind" NOT NULL,
    url text NOT NULL,
    "originalName" text,
    "mimeType" text NOT NULL,
    "sizeBytes" integer NOT NULL,
    width integer,
    height integer,
    "durationSec" integer,
    "uploadedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    ip text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Profile" (
    id text NOT NULL,
    slug text NOT NULL,
    "fullName" text NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "deathDate" timestamp(3) without time zone,
    "birthPlace" text,
    "deathPlace" text,
    "burialPlace" text,
    "burialLat" double precision,
    "burialLng" double precision,
    bio text,
    "coverPhotoId" text,
    gender public."Gender" DEFAULT 'UNKNOWN'::public."Gender" NOT NULL,
    visibility public."Visibility" DEFAULT 'PUBLIC'::public."Visibility" NOT NULL,
    "accessHash" text,
    "ownerId" text NOT NULL,
    "familyNodeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "searchVector" tsvector GENERATED ALWAYS AS (((setweight(to_tsvector('russian'::regconfig, COALESCE("fullName", ''::text)), 'A'::"char") || setweight(to_tsvector('russian'::regconfig, COALESCE(bio, ''::text)), 'B'::"char")) || setweight(to_tsvector('russian'::regconfig, COALESCE("burialPlace", ''::text)), 'C'::"char"))) STORED,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: ProfileAccess; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProfileAccess" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "userId" text NOT NULL,
    "grantedBy" text NOT NULL,
    "canEdit" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProfileAccessCode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProfileAccessCode" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "codeHash" text NOT NULL,
    label text,
    "expiresAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProfileDispute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProfileDispute" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "reporterId" text NOT NULL,
    reason public."DisputeReason" NOT NULL,
    description text NOT NULL,
    evidence text,
    status public."DisputeStatus" DEFAULT 'OPEN'::public."DisputeStatus" NOT NULL,
    "resolverId" text,
    resolution text,
    "resolvedAt" timestamp(3) without time zone,
    "mergeRequestId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "duplicateOfProfileId" text
);


--
-- Name: ProfileMergeRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProfileMergeRequest" (
    id text NOT NULL,
    "sourceProfileId" text NOT NULL,
    "targetProfileId" text NOT NULL,
    "requesterId" text NOT NULL,
    reason text,
    status public."MergeStatus" DEFAULT 'PENDING_OWNERS'::public."MergeStatus" NOT NULL,
    "sourceOwnerApprovedAt" timestamp(3) without time zone,
    "sourceOwnerApprovedBy" text,
    "targetOwnerApprovedAt" timestamp(3) without time zone,
    "targetOwnerApprovedBy" text,
    "adminApprovedAt" timestamp(3) without time zone,
    "adminApprovedBy" text,
    "executedAt" timestamp(3) without time zone,
    "rejectedAt" timestamp(3) without time zone,
    "rejectedBy" text,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: QrPlaque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QrPlaque" (
    id text NOT NULL,
    "profileId" text NOT NULL,
    code text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "orderedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "shippedAt" timestamp(3) without time zone
);


--
-- Name: TgLoginToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TgLoginToken" (
    id text NOT NULL,
    token text NOT NULL,
    status public."TgLoginStatus" DEFAULT 'PENDING'::public."TgLoginStatus" NOT NULL,
    "userId" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "consumedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TimelineEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimelineEvent" (
    id text NOT NULL,
    "familyNodeId" text,
    "profileId" text,
    category public."TimelineCategory" NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp(3) without time zone NOT NULL,
    "dateAccuracy" text,
    place text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "iconKey" text,
    "createdById" text,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "displayName" text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "telegramId" bigint,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastSeenAt" timestamp(3) without time zone,
    "legacyInactivityDays" integer DEFAULT 90 NOT NULL,
    "acceptedTermsAt" timestamp(3) without time zone,
    "acceptedTermsIp" text,
    "jwtVersion" integer DEFAULT 0 NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, action, "userId", "entityType", "entityId", "oldValue", "newValue", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmpvm2ze30001qz2ahmw6ihzf	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	::ffff:172.18.0.1	curl/8.19.0	2026-06-01 19:38:30.699
cmpvm3jou0003qz2astynw984	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-01 19:38:57.006
cmpvm9v2f0005qz2ac4sstzfs	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	::ffff:172.18.0.1	curl/8.19.0	2026-06-01 19:43:51.687
cmpwzr1250001pa28l3v15wbc	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "admin", "reason": "Неверный email или пароль"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-02 18:48:53.789
cmpwzrvdh0003pa28x8mxj544	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-02 18:49:33.078
cmpx3t6250001mq2884gc1jvl	LOGOUT	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-02 20:42:32.041
cmq1jcv0t0001o128vnj4rfla	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 23:08:49.795
cmq1jd0se000bo128neu4z3kd	PROFILE_CREATE	cmpvm2avm0000qz36l57c1d7z	Profile	cmq1jd0m10003o128bmidjz1k	null	{"id": "cmq1jd0m10003o128bmidjz1k", "slug": "novaya-stranitsa", "visibility": "PUBLIC"}	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-05 23:08:57.278
cmq21zz700001o128y6kznq3k	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-06 07:50:41.375
cmq2kb5px0007o128tcu335kh	LOGOUT	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-06 16:23:16.144
cmq2kb92n0009o1288ue5e689	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-06 16:23:20.495
cmq2lcgnb000jo1283yrgpeyx	PROFILE_CREATE	cmpvm2avm0000qz36l57c1d7z	Profile	cmq2lcggq000bo128nh1y4bny	null	{"id": "cmq2lcggq000bo128nh1y4bny", "slug": "novaya-stranitsa-1", "visibility": "PUBLIC"}	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-06 16:52:16.583
cmq2nhx0u000lo128mfy5x90z	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-06 17:52:30.315
cmq709ih00001nx2x6vtxkbzj	LOGOUT	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:00:57.923
cmq709qv90003nx2xdq0zris9	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:01:08.805
cmq71dzi60001mx2ynt82szz0	LOGOUT	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:32:26.236
cmq71e1k70003mx2yoph9itto	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:32:28.903
cmq71xxa50005mx2y6p4a4lmo	LOGOUT	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:47:56.473
cmq71y0si0007mx2yhn125ju6	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:48:01.026
cmq71ycll0009mx2ybsctwzpc	LOGOUT	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 19:48:16.328
cmq72u829000cmx2yp1tklyp3	LOGOUT	cmq71zgnw000amx2ya6y63i6f	\N	\N	null	null	null	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 20:13:03.36
cmq72udtg000emx2ynazheayt	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-09 20:13:10.901
cmq8bfua10001mx2xi06x7uck	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "test@test.ru", "reason": "Неверный email или пароль"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:01:35.106
cmq8bgj340003mx2xnv8gidhm	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "admin.admin@local", "reason": "Неверный email или пароль"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:02:07.264
cmq8bgqsy0005mx2xc4f3iqtm	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "krutko@memory.site", "reason": "Неверный email или пароль"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:02:17.266
cmq8biaoq0007mx2xsv8j68l3	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "admin@admin.local", "reason": "Неверный email или пароль"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:03:29.69
cmq8bic0i0009mx2xc5lke4gg	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "admin@admin.local", "reason": "Неверный email или пароль"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:03:31.411
cmq8blxmv000bmx2x5xw1wnvg	LOGIN_FAILED	\N	\N	\N	null	null	{"email": "admin@admin.local", "reason": "Неверный email или пароль"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:06:19.399
cmq8bmof9000dmx2xphrky6qr	LOGIN	cmpvm2avm0000qz36l57c1d7z	\N	\N	null	null	{"email": "admin@admin.local"}	::ffff:172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 17:06:54.118
\.


--
-- Data for Name: CandleLight; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CandleLight" (id, "profileId", "userId", fingerprint, "createdAt") FROM stdin;
cmq22hzey0003o12802ac437o	\N	cmpvm2avm0000qz36l57c1d7z	1202a7ce0594c499eb00c8556eba873a	2026-06-06 08:04:41.481
cmq23074e0005o128t1i1jf79	\N	cmpvm2avm0000qz36l57c1d7z	1202a7ce0594c499eb00c8556eba873a	2026-06-06 08:18:51.274
cmq4b3ns80001qt28ws4m1v09	\N	\N	a9de2219e9bb2356ab05e31e9a549d3d	2026-06-07 21:41:02.12
cmq8bzj9u000hmx2x35mm4901	\N	\N	55b8d7d5ac4c261a491db18205f4b8bd	2026-06-10 17:16:53.97
cmq8bzn49000jmx2x6whepspu	\N	\N	55b8d7d5ac4c261a491db18205f4b8bd	2026-06-10 17:16:58.954
cmq8bzqje000lmx2x1qo1yjkb	\N	\N	55b8d7d5ac4c261a491db18205f4b8bd	2026-06-10 17:17:03.386
\.


--
-- Data for Name: ContentBlock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ContentBlock" (id, "profileId", type, title, body, "photoId", "order", "isHidden", "createdAt", "updatedAt") FROM stdin;
cmpx2xfk0000opa31ipt5dxdx	cmpx2xewe000ipa31cl7m0ces	CHILDHOOD	Детство в Любани	Родился в простой крестьянской семье, с детства приучался к тяжелому крестьянскому труду на земле.	cmpx2xf8l000kpa31up5vxm99	0	f	2026-06-02 20:17:51.361	2026-06-02 20:17:51.361
cmpx2xfkc000qpa319bmiksl3	cmpx2xewe000ipa31cl7m0ces	CAREER	Крестьянский труд	До войны занимался сельским хозяйством, помогал односельчанам, прослыл мастером на все руки.	cmpx2xfjt000mpa31aw1b9iud	1	f	2026-06-02 20:17:51.373	2026-06-02 20:17:51.373
cmpx2xhbw0018pa31nun233u4	cmpx2xfs20012pa31ukcont01	FAMILY	Хранительница очага	Оставшись без мужа в суровые годы войны, сумела сберечь и вырастить детей, дать им образование.	cmpx2xfzh0014pa31dsrm0hvg	0	f	2026-06-02 20:17:53.66	2026-06-02 20:17:53.66
cmpx2xhc3001apa319d71sacv	cmpx2xfs20012pa31ukcont01	HOBBIES	Любовь к вышивке	Создавала прекрасные рушники и вышиванки с традиционными орнаментами.	cmpx2xhbr0016pa31kmoxb66p	1	f	2026-06-02 20:17:53.667	2026-06-02 20:17:53.667
cmpx2xhxs001spa3158u1qexw	cmpx2xhfc001mpa311wqcigrs	CAREER	Кузнечное мастерство	Работал кузнецом в Гомеле, ковал металл и создавал надежные инструменты для всего города.	cmpx2xhtx001opa31zrvxkmle	0	f	2026-06-02 20:17:54.448	2026-06-02 20:17:54.448
cmpx2xhxw001upa31q9xo4ypy	cmpx2xhfc001mpa311wqcigrs	LEGACY	Воинский долг	Был призван на фронт в первые дни войны. Погиб при освобождении родной земли в 1944 году.	cmpx2xhxn001qpa31asjo6np6	1	f	2026-06-02 20:17:54.452	2026-06-02 20:17:54.452
cmpx2xifg002cpa31mbqq13hx	cmpx2xi1b0026pa31gwjcuzaw	CAREER	Гомельское ателье	Шила верхнюю одежду для жителей Гомеля, работала в городском ателье.	cmpx2xibd0028pa313yvde44p	0	f	2026-06-02 20:17:55.085	2026-06-02 20:17:55.085
cmpx2xifk002epa31zazytshn	cmpx2xi1b0026pa31gwjcuzaw	FAMILY	Воспитание внуков	Всегда с радостью принимала внуков на каникулах, шила для них лучшие наряды.	cmpx2xifc002apa31q1dlg9oj	1	f	2026-06-02 20:17:55.088	2026-06-02 20:17:55.088
cmpx2xj0l002wpa31571af975	cmpx2xip9002qpa31juqegp2n	CAREER	Рабочий МТЗ	Более 40 лет проработал слесарем-сборщиком на тракторном заводе, награжден медалью Трудовой Славы.	cmpx2xiuc002spa31z46jxjdy	0	f	2026-06-02 20:17:55.846	2026-06-02 20:17:55.846
cmpx2xj0n002ypa311dudqcix	cmpx2xip9002qpa31juqegp2n	EDUCATION	Вечерняя школа	После войны совмещал тяжелую работу на заводе с учебой в вечерней школе.	cmpx2xj0j002upa31bnuc23vg	1	f	2026-06-02 20:17:55.847	2026-06-02 20:17:55.847
cmpx2xjtp003gpa317kz440eh	cmpx2xj2k003apa31pa2och9n	CAREER	Бухгалтерия Минска	Точность и аккуратность в расчетах были ее визитной карточкой. Уважаемый специалист в коллективе.	cmpx2xjgr003cpa318alb997y	0	f	2026-06-02 20:17:56.893	2026-06-02 20:17:56.893
cmpx2xjts003ipa3153hlusef	cmpx2xj2k003apa31pa2och9n	FAMILY	Любящая мать	Создала теплый и уютный дом для мужа Петра и двоих детей.	cmpx2xjtm003epa31mgzoldfw	1	f	2026-06-02 20:17:56.897	2026-06-02 20:17:56.897
cmpx2xk900040pa31u047dxdi	cmpx2xjxc003upa31fccp1k9c	CAREER	Витебская школа	Преподавала точные науки, вела математические кружки, помогала детям находить призвание.	cmpx2xk36003wpa312en3q8qb	0	f	2026-06-02 20:17:57.445	2026-06-02 20:17:57.445
cmpx2xk930042pa31ezixmquh	cmpx2xjxc003upa31fccp1k9c	HOBBIES	Выращивание цветов	В свободное время занималась разведением гераней и роз на дачном участке.	cmpx2xk8w003ypa315o53w9lu	1	f	2026-06-02 20:17:57.447	2026-06-02 20:17:57.447
cmpx2xl0r004kpa31mtnjlg1g	cmpx2xkbh004epa31iy4ced9x	CAREER	Профессиональный шофёр	Проехал сотни тысяч километров по дорогам БССР, управляя грузовыми автомобилями автобазы.	cmpx2xkvl004gpa315pcu9lcx	0	f	2026-06-02 20:17:58.443	2026-06-02 20:17:58.443
cmpx2xl0v004mpa31kdgbrfmc	cmpx2xkbh004epa31iy4ced9x	LEGACY	Фронтовые воспоминания	Служил водителем полуторки во время прорыва блокады, награжден боевыми медалями.	cmpx2xl0o004ipa312wpa82q4	1	f	2026-06-02 20:17:58.447	2026-06-02 20:17:58.447
cmpx2xnua0054pa31cun4ex0v	cmpx2xl3r004ypa311s8qsdgx	CAREER	Генплан Гомеля	Принимал активное участие в проектировании промышленных зон и жилых микрорайонов.	cmpx2xle80050pa31kxhr2p34	0	f	2026-06-02 20:18:02.098	2026-06-02 20:18:02.098
cmpx2xnuc0056pa31nh6gk2k2	cmpx2xl3r004ypa311s8qsdgx	EDUCATION	Строительный институт	Окончил Ленинградский инженерно-строительный институт и вернулся восстанавливать родную Беларусь.	cmpx2xnu60052pa31w5t1yife	1	f	2026-06-02 20:18:02.1	2026-06-02 20:18:02.1
cmpx2xrba005opa31lm7kr55e	cmpx2xnw2005ipa31e96ccnjl	CAREER	Медицинское служение	Помогала людям восстанавливаться после операций, дарила пациентам искреннюю заботу и тепло.	cmpx2xr23005kpa3162rabb1s	0	f	2026-06-02 20:18:06.598	2026-06-02 20:18:06.598
cmpx2xrbe005qpa31ttbpuq7q	cmpx2xnw2005ipa31e96ccnjl	HOBBIES	Вязание теплых вещей	Вязала красивые свитера и носки для всей большой семьи.	cmpx2xrb5005mpa310jngi7k4	1	f	2026-06-02 20:18:06.603	2026-06-02 20:18:06.603
cmpx2xru30068pa31yy2cl9bn	cmpx2xrei0062pa31ydtahh3c	CAREER	Отдел редких книг	Занималась каталогизацией и оцифровкой старинных рукописей, организовывала книжные лектории.	cmpx2xrmp0064pa318xgu7nlc	0	f	2026-06-02 20:18:07.275	2026-06-02 20:18:07.275
cmpx2xru7006apa31b2obveby	cmpx2xrei0062pa31ydtahh3c	EDUCATION	Минский институт культуры	Окончила институт культуры с красным дипломом, была влюблена в литературу.	cmpx2xrtz0066pa315yvvsszz	1	f	2026-06-02 20:18:07.279	2026-06-02 20:18:07.279
cmpx2xsc4006spa31cq0t72e7	cmpx2xryk006mpa31rcd7p69t	CAREER	Завод МАЗ	Разрабатывал уникальные приспособления для скоростной металлообработки деталей грузовиков.	cmpx2xs9a006opa316sd3jixg	0	f	2026-06-02 20:18:07.925	2026-06-02 20:18:07.925
cmpx2xsc8006upa31yb0pig3y	cmpx2xryk006mpa31rcd7p69t	HOBBIES	Дачное хозяйство	Своими руками построил дачный дом и выращивал прекрасные сорта яблонь.	cmpx2xsc0006qpa31i1l8lc3y	1	f	2026-06-02 20:18:07.928	2026-06-02 20:18:07.928
cmpx2xspx007cpa31va7pt5cg	cmpx2xse70076pa317acy2jvv	CAREER	Инженерные проекты	Работал главным специалистом в проектном институте Минэнерго, внедрял энергоэффективные подстанции.	cmpx2xsl90078pa31op9vf6ju	0	f	2026-06-02 20:18:08.421	2026-06-02 20:18:08.421
cmpx2xsq1007epa31buhqwzup	cmpx2xse70076pa317acy2jvv	EDUCATION	БПИ	Окончил энергетический факультет Белорусского политехнического института.	cmpx2xspu007apa31ibusqjhv	1	f	2026-06-02 20:18:08.426	2026-06-02 20:18:08.426
cmpx2xthz007wpa31j4thp6jy	cmpx2xss1007qpa31g0pnr9xz	CAREER	Плановый отдел	Занималась координацией поставок сырья на крупные трикотажные производства.	cmpx2xt7p007spa31ne6gx3ru	0	f	2026-06-02 20:18:09.432	2026-06-02 20:18:09.432
cmpx2xti4007ypa31swrpo468	cmpx2xss1007qpa31g0pnr9xz	FAMILY	Семейная гармония	Окружила теплом мужа Ивана и дочерей, сохраняя дружественную атмосферу дома.	cmpx2xthw007upa31g2vbakkq	1	f	2026-06-02 20:18:09.436	2026-06-02 20:18:09.436
cmpx2xuo3008ypa31bopqzrqn	cmpx2xtsv008spa31g1884yos	CAREER	Международные трассы	Работал в системе Совтрансавто, объездил множество стран, доставляя ценные грузы.	cmpx2xuf6008upa31kafdslbk	0	f	2026-06-02 20:18:10.947	2026-06-02 20:18:10.947
cmpx2xuo70090pa31ttermfjb	cmpx2xtsv008spa31g1884yos	HOBBIES	Сбор дорожных историй	Был великолепным рассказчиком, знал сотни интересных историй о дорогах.	cmpx2xunz008wpa31klgrqvkl	1	f	2026-06-02 20:18:10.951	2026-06-02 20:18:10.951
cmpx2xvzj009opa31wbxdduu1	cmpx2xv46009ipa3102vkt5sf	CAREER	Преподавание истории	Увлекал школьников уроками истории, вел кружок исторической реконструкции.	cmpx2xvv1009kpa31fby7gc52	0	f	2026-06-02 20:18:12.656	2026-06-02 20:18:12.656
cmpx2xvzn009qpa31xw2rma2q	cmpx2xv46009ipa3102vkt5sf	HOBBIES	Археологические раскопки	Каждое лето организовывал экспедиции по исследованию замчищ Могилевщины.	cmpx2xvzg009mpa31ffltl1yh	1	f	2026-06-02 20:18:12.659	2026-06-02 20:18:12.659
cmq1jd0q30004o128aziawxqr	cmq1jd0m10003o128bmidjz1k	CHILDHOOD	Детство и юность		\N	0	f	2026-06-05 23:08:57.194	2026-06-05 23:08:57.194
cmq1jd0q30005o1282h9x48ek	cmq1jd0m10003o128bmidjz1k	EDUCATION	Образование		\N	10	f	2026-06-05 23:08:57.194	2026-06-05 23:08:57.194
cmq1jd0q30006o128n8atwg88	cmq1jd0m10003o128bmidjz1k	CAREER	Профессиональный путь		\N	20	f	2026-06-05 23:08:57.194	2026-06-05 23:08:57.194
cmq1jd0q30007o128p55amkuh	cmq1jd0m10003o128bmidjz1k	FAMILY	Семья		\N	30	f	2026-06-05 23:08:57.194	2026-06-05 23:08:57.194
cmq1jd0q30008o128ga7algvf	cmq1jd0m10003o128bmidjz1k	HOBBIES	Хобби и увлечения		\N	40	f	2026-06-05 23:08:57.194	2026-06-05 23:08:57.194
cmq1jd0q30009o128qs7esrvd	cmq1jd0m10003o128bmidjz1k	LEGACY	Наследие		\N	50	f	2026-06-05 23:08:57.194	2026-06-05 23:08:57.194
cmq2lcglh000co128oz7scsr6	cmq2lcggq000bo128nh1y4bny	CHILDHOOD	Детство и юность		\N	0	f	2026-06-06 16:52:16.517	2026-06-06 16:52:16.517
cmq2lcglh000do128lgb8zrtr	cmq2lcggq000bo128nh1y4bny	EDUCATION	Образование		\N	10	f	2026-06-06 16:52:16.517	2026-06-06 16:52:16.517
cmq2lcglh000eo128g8je82uj	cmq2lcggq000bo128nh1y4bny	CAREER	Профессиональный путь		\N	20	f	2026-06-06 16:52:16.517	2026-06-06 16:52:16.517
cmq2lcglh000fo128eqqa8bp5	cmq2lcggq000bo128nh1y4bny	FAMILY	Семья		\N	30	f	2026-06-06 16:52:16.517	2026-06-06 16:52:16.517
cmq2lcglh000go128k4432zuz	cmq2lcggq000bo128nh1y4bny	HOBBIES	Хобби и увлечения		\N	40	f	2026-06-06 16:52:16.517	2026-06-06 16:52:16.517
cmq2lcglh000ho128ibj1yvt0	cmq2lcggq000bo128nh1y4bny	LEGACY	Наследие		\N	50	f	2026-06-06 16:52:16.517	2026-06-06 16:52:16.517
\.


--
-- Data for Name: FamilyClan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FamilyClan" (id, "treeId", name, color, icon, description, "createdAt") FROM stdin;
cmpx2xeir0002pa31hso0pwu8	cmpx2xehh0000pa313hbd9znu	Морозовы	#c0392b	❦	Род полоцких конструкторов и инженеров.	2026-06-02 20:17:50.019
cmpx2xeke0004pa31es0eu0gw	cmpx2xehh0000pa313hbd9znu	Волковы	#27ae60	✦	Род витебских врачей и ученых.	2026-06-02 20:17:50.078
cmpx2xekj0006pa31oxqj3ivz	cmpx2xehh0000pa313hbd9znu	Соколовы	#2980b9	✶	Род гродненских учителей и музыкантов.	2026-06-02 20:17:50.083
cmpx2xeko0008pa31kl7s9mdf	cmpx2xehh0000pa313hbd9znu	Петровы	#8e44ad	◆	Род могилевских строителей и агрономов.	2026-06-02 20:17:50.088
\.


--
-- Data for Name: FamilyConnection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FamilyConnection" (id, "fromNodeId", "toNodeId", type, "startDate", "endDate", notes, "createdAt") FROM stdin;
cmq8bwk15000fmx2xk5ljssys	cmpx2xx0g00aqpa319ibr5n6w	cmpx2xyza00ckpa31k7x59dbe	PARENT	\N	\N	\N	2026-06-10 17:14:34.986
cmq2nih3f0009vtmwitewz599	cmpx2xww600akpa31gpd8z6ib	cmpx2xyog00c8pa317t70rmie	PARENT	\N	\N	\N	2026-06-06 17:52:56.331
cmq2nih4d000bvtmwxqfpqhvs	cmpx2xx0g00aqpa319ibr5n6w	cmpx2xyog00c8pa317t70rmie	PARENT	\N	\N	\N	2026-06-06 17:52:56.365
cmq2nih57000dvtmwnj7a186f	cmpx2xww600akpa31gpd8z6ib	cmpx2xyt600cepa31b9zcbs2o	PARENT	\N	\N	\N	2026-06-06 17:52:56.395
cmq2nih5x000fvtmwxiz6dk0r	cmpx2xx0g00aqpa319ibr5n6w	cmpx2xyt600cepa31b9zcbs2o	PARENT	\N	\N	\N	2026-06-06 17:52:56.421
cmq2oule80001p728mrnz1oka	cmpx2xxi000b2pa31ubuegkfj	cmpx2xzg600d2pa31dlpgc8qa	PARENT	\N	\N	\N	2026-06-06 18:30:21.381
cmq2ov3ht0003p728cy6ed3hq	cmpx2xxmp00b8pa31mbkqcvh1	cmpx2xzg600d2pa31dlpgc8qa	PARENT	\N	\N	\N	2026-06-06 18:30:44.85
cmq8drk6u0001ox2xt8ou219h	cmpx2xy0p00bkpa31u0k28wyq	cmpx2xzq600depa31fai1m84p	PARENT	\N	\N	\N	2026-06-10 18:06:41.139
cmq8dro0e0003ox2xa6hogmbq	cmpx2xxpx00bepa31cpmc0501	cmpx2xzq600depa31fai1m84p	PARENT	\N	\N	\N	2026-06-10 18:06:46.094
cmq2rzl5x0009p7289gs8h6tf	cmpx2xy0p00bkpa31u0k28wyq	cmpx2xzmt00d8pa314sl19pzn	PARENT	\N	\N	\N	2026-06-06 19:58:13.221
cmq2rzo1f000bp728qp461y0y	cmpx2xy0p00bkpa31u0k28wyq	cmpx2xzuq00dkpa31i2k2o86o	PARENT	\N	\N	\N	2026-06-06 19:58:16.947
cmq2s02ti000dp72873plb6zi	cmpx2xxpx00bepa31cpmc0501	cmpx2xzmt00d8pa314sl19pzn	PARENT	\N	\N	\N	2026-06-06 19:58:36.103
cmq2s08t5000fp728ngtrbg8g	cmpx2xxpx00bepa31cpmc0501	cmpx2xzuq00dkpa31i2k2o86o	PARENT	\N	\N	\N	2026-06-06 19:58:43.865
cmpx2xzuz00dopa313vfkeqcu	cmpx2xesw000cpa31ihoxwcmq	cmpx2xfrd000wpa314clccsh0	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.675
cmpx2xzv600dqpa311du977bu	cmpx2xfrd000wpa314clccsh0	cmpx2xesw000cpa31ihoxwcmq	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.683
cmpx2xzvb00dspa31haimn3o2	cmpx2xhes001gpa31zf5gf3e2	cmpx2xi0j0020pa31higiablf	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.687
cmpx2xzvf00dupa313b6besdt	cmpx2xi0j0020pa31higiablf	cmpx2xhes001gpa31zf5gf3e2	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.692
cmpx2xzvk00dwpa31zse2w32k	cmpx2xesw000cpa31ihoxwcmq	cmpx2xion002kpa31nbk3q88t	PARENT	\N	\N	\N	2026-06-02 20:18:17.696
cmpx2xzvp00dypa31n9m3w90h	cmpx2xfrd000wpa314clccsh0	cmpx2xion002kpa31nbk3q88t	PARENT	\N	\N	\N	2026-06-02 20:18:17.701
cmpx2xzvt00e0pa31jfvb8hs0	cmpx2xesw000cpa31ihoxwcmq	cmpx2xjx3003opa31s9w5wl6k	PARENT	\N	\N	\N	2026-06-02 20:18:17.706
cmpx2xzvx00e2pa317q7k10zj	cmpx2xfrd000wpa314clccsh0	cmpx2xjx3003opa31s9w5wl6k	PARENT	\N	\N	\N	2026-06-02 20:18:17.709
cmpx2xzvz00e4pa31rn0yszgp	cmpx2xhes001gpa31zf5gf3e2	cmpx2xl3c004spa318jb9kmbp	PARENT	\N	\N	\N	2026-06-02 20:18:17.712
cmpx2xzw100e6pa31mc85drw0	cmpx2xi0j0020pa31higiablf	cmpx2xl3c004spa318jb9kmbp	PARENT	\N	\N	\N	2026-06-02 20:18:17.713
cmpx2xzw400e8pa314y3c2dg9	cmpx2xhes001gpa31zf5gf3e2	cmpx2xre7005wpa31hkg7y3rp	PARENT	\N	\N	\N	2026-06-02 20:18:17.716
cmpx2xzw700eapa31sm9dx6gl	cmpx2xi0j0020pa31higiablf	cmpx2xre7005wpa31hkg7y3rp	PARENT	\N	\N	\N	2026-06-02 20:18:17.72
cmpx2xzwb00ecpa31ymv3bpsy	cmpx2xkb10048pa31wmm679bp	cmpx2xjx3003opa31s9w5wl6k	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.724
cmpx2xzwe00eepa31y2awexky	cmpx2xjx3003opa31s9w5wl6k	cmpx2xkb10048pa31wmm679bp	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.727
cmpx2xzwh00egpa31ef2vko1l	cmpx2xion002kpa31nbk3q88t	cmpx2xj250034pa31qaqm5vpx	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.729
cmpx2xzwk00eipa312i9lhmd8	cmpx2xj250034pa31qaqm5vpx	cmpx2xion002kpa31nbk3q88t	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.732
cmpx2xzwn00ekpa31bgc60zbo	cmpx2xl3c004spa318jb9kmbp	cmpx2xnvp005cpa31z8si8w9z	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.735
cmpx2xzwq00empa31uoy2qr5c	cmpx2xnvp005cpa31z8si8w9z	cmpx2xl3c004spa318jb9kmbp	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.738
cmpx2xzwt00eopa31u9kcf2i4	cmpx2xry0006gpa31molq0rsx	cmpx2xre7005wpa31hkg7y3rp	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.742
cmpx2xzww00eqpa31pjg4dn9n	cmpx2xre7005wpa31hkg7y3rp	cmpx2xry0006gpa31molq0rsx	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.745
cmpx2xzwz00espa31ahol2krh	cmpx2xion002kpa31nbk3q88t	cmpx2xsds0070pa31dqmj70bn	PARENT	\N	\N	\N	2026-06-02 20:18:17.747
cmpx2xzx100eupa31s8ztckmr	cmpx2xj250034pa31qaqm5vpx	cmpx2xsds0070pa31dqmj70bn	PARENT	\N	\N	\N	2026-06-02 20:18:17.75
cmpx2xzx400ewpa3171sjr87h	cmpx2xion002kpa31nbk3q88t	cmpx2xtl50084pa315urz597a	PARENT	\N	\N	\N	2026-06-02 20:18:17.753
cmpx2xzx800eypa31zjju08s2	cmpx2xj250034pa31qaqm5vpx	cmpx2xtl50084pa315urz597a	PARENT	\N	\N	\N	2026-06-02 20:18:17.756
cmpx2xzxc00f0pa312zilmvok	cmpx2xl3c004spa318jb9kmbp	cmpx2xtnp008apa31qxw4ep5t	PARENT	\N	\N	\N	2026-06-02 20:18:17.76
cmpx2xzxg00f2pa31r7dbh502	cmpx2xnvp005cpa31z8si8w9z	cmpx2xtnp008apa31qxw4ep5t	PARENT	\N	\N	\N	2026-06-02 20:18:17.764
cmpx2xzxj00f4pa31w94rejk0	cmpx2xkb10048pa31wmm679bp	cmpx2xtse008mpa31vb92295i	PARENT	\N	\N	\N	2026-06-02 20:18:17.767
cmpx2xzxm00f6pa31oo615xvu	cmpx2xjx3003opa31s9w5wl6k	cmpx2xtse008mpa31vb92295i	PARENT	\N	\N	\N	2026-06-02 20:18:17.771
cmpx2xzxr00f8pa31k0kgwgi5	cmpx2xry0006gpa31molq0rsx	cmpx2xv3n009cpa3139zcgqgp	PARENT	\N	\N	\N	2026-06-02 20:18:17.775
cmpx2xzxt00fapa314fk8xk5k	cmpx2xre7005wpa31hkg7y3rp	cmpx2xv3n009cpa3139zcgqgp	PARENT	\N	\N	\N	2026-06-02 20:18:17.778
cmpx2xzxv00fcpa31g9baavxi	cmpx2xsds0070pa31dqmj70bn	cmpx2xsrp007kpa31rzgjqohm	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.78
cmpx2xzxx00fepa313et5j2c8	cmpx2xsrp007kpa31rzgjqohm	cmpx2xsds0070pa31dqmj70bn	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.782
cmpx2xzxz00fgpa31nww7as4m	cmpx2xtnp008apa31qxw4ep5t	cmpx2xtq5008gpa31t17rvorr	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.784
cmpx2xzy200fipa317qx4n5em	cmpx2xtq5008gpa31t17rvorr	cmpx2xtnp008apa31qxw4ep5t	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.787
cmpx2xzy600fkpa31nq4zuh8d	cmpx2xtse008mpa31vb92295i	cmpx2xuwv0096pa31jae2vnza	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.79
cmpx2xzya00fmpa31swy0kb97	cmpx2xuwv0096pa31jae2vnza	cmpx2xtse008mpa31vb92295i	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.794
cmpx2xzyc00fopa31yyugbtsp	cmpx2xv3n009cpa3139zcgqgp	cmpx2xw24009wpa31a3kklhkb	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.797
cmpx2xzye00fqpa31dvde5vbm	cmpx2xw24009wpa31a3kklhkb	cmpx2xv3n009cpa3139zcgqgp	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.799
cmpx2xzyg00fspa31xj3tu3wq	cmpx2xsds0070pa31dqmj70bn	cmpx2xwhf00a2pa31wwd77ols	PARENT	\N	\N	\N	2026-06-02 20:18:17.8
cmpx2xzyi00fupa31v77zoxus	cmpx2xsrp007kpa31rzgjqohm	cmpx2xwhf00a2pa31wwd77ols	PARENT	\N	\N	\N	2026-06-02 20:18:17.802
cmpx2xzyk00fwpa31usxut5n5	cmpx2xsds0070pa31dqmj70bn	cmpx2xwsu00aepa31sitxcgq6	PARENT	\N	\N	\N	2026-06-02 20:18:17.804
cmpx2xzyn00fypa31419u2zb8	cmpx2xsrp007kpa31rzgjqohm	cmpx2xwsu00aepa31sitxcgq6	PARENT	\N	\N	\N	2026-06-02 20:18:17.807
cmpx2xzyp00g0pa3130zfo90p	cmpx2xtnp008apa31qxw4ep5t	cmpx2xww600akpa31gpd8z6ib	PARENT	\N	\N	\N	2026-06-02 20:18:17.81
cmpx2xzyr00g2pa31euwb74hj	cmpx2xtq5008gpa31t17rvorr	cmpx2xww600akpa31gpd8z6ib	PARENT	\N	\N	\N	2026-06-02 20:18:17.812
cmpx2xzyt00g4pa31oh6h9084	cmpx2xtnp008apa31qxw4ep5t	cmpx2xxdq00awpa314azjc638	PARENT	\N	\N	\N	2026-06-02 20:18:17.814
cmpx2xzyv00g6pa313vn6d48n	cmpx2xtq5008gpa31t17rvorr	cmpx2xxdq00awpa314azjc638	PARENT	\N	\N	\N	2026-06-02 20:18:17.816
cmpx2xzyx00g8pa31cfqz3rlo	cmpx2xtse008mpa31vb92295i	cmpx2xxi000b2pa31ubuegkfj	PARENT	\N	\N	\N	2026-06-02 20:18:17.818
cmpx2xzz000gapa31qdr2rth3	cmpx2xuwv0096pa31jae2vnza	cmpx2xxi000b2pa31ubuegkfj	PARENT	\N	\N	\N	2026-06-02 20:18:17.82
cmpx2xzz400gcpa31nmounlca	cmpx2xv3n009cpa3139zcgqgp	cmpx2xxpx00bepa31cpmc0501	PARENT	\N	\N	\N	2026-06-02 20:18:17.824
cmpx2xzz900gepa31txlz1f5o	cmpx2xw24009wpa31a3kklhkb	cmpx2xxpx00bepa31cpmc0501	PARENT	\N	\N	\N	2026-06-02 20:18:17.829
cmpx2xzzb00ggpa31dhfwj53l	cmpx2xwhf00a2pa31wwd77ols	cmpx2xwln00a8pa3168l6xlvs	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.831
cmpx2xzzd00gipa31ue49lqfd	cmpx2xwln00a8pa3168l6xlvs	cmpx2xwhf00a2pa31wwd77ols	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.834
cmpx2xzzh00gkpa315aq8xj4e	cmpx2xww600akpa31gpd8z6ib	cmpx2xx0g00aqpa319ibr5n6w	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.837
cmpx2xzzk00gmpa31hpjl7g9h	cmpx2xx0g00aqpa319ibr5n6w	cmpx2xww600akpa31gpd8z6ib	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.84
cmpx2xzzn00gopa31t1hu2nnx	cmpx2xxi000b2pa31ubuegkfj	cmpx2xxmp00b8pa31mbkqcvh1	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.844
cmpx2xzzp00gqpa31ph7bbab5	cmpx2xxmp00b8pa31mbkqcvh1	cmpx2xxi000b2pa31ubuegkfj	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.846
cmpx2xzzt00gspa313yrx3woz	cmpx2xxpx00bepa31cpmc0501	cmpx2xy0p00bkpa31u0k28wyq	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.849
cmpx2xzzv00gupa31xsi6m73b	cmpx2xy0p00bkpa31u0k28wyq	cmpx2xxpx00bepa31cpmc0501	SPOUSE	\N	\N	\N	2026-06-02 20:18:17.851
cmpx2xzzz00gwpa31whle8qky	cmpx2xwhf00a2pa31wwd77ols	cmpx2xy4a00bqpa31wfxozpid	PARENT	\N	\N	\N	2026-06-02 20:18:17.855
cmpx2y00300gypa31295kofrn	cmpx2xwln00a8pa3168l6xlvs	cmpx2xy4a00bqpa31wfxozpid	PARENT	\N	\N	\N	2026-06-02 20:18:17.859
cmpx2y00600h0pa311etuhckp	cmpx2xwhf00a2pa31wwd77ols	cmpx2xyaw00bwpa31gfseg01a	PARENT	\N	\N	\N	2026-06-02 20:18:17.862
cmpx2y00900h2pa31bcg7xwxi	cmpx2xwln00a8pa3168l6xlvs	cmpx2xyaw00bwpa31gfseg01a	PARENT	\N	\N	\N	2026-06-02 20:18:17.865
cmpx2y00h00h4pa31d0nzot3q	cmpx2xwhf00a2pa31wwd77ols	cmpx2xyja00c2pa31kbugw5k9	PARENT	\N	\N	\N	2026-06-02 20:18:17.873
cmpx2y00k00h6pa31518gywn9	cmpx2xwln00a8pa3168l6xlvs	cmpx2xyja00c2pa31kbugw5k9	PARENT	\N	\N	\N	2026-06-02 20:18:17.876
cmpx2y01b00hkpa31ncqw8hvf	cmpx2xxi000b2pa31ubuegkfj	cmpx2xz6o00cqpa31kzxr0z39	PARENT	\N	\N	\N	2026-06-02 20:18:17.903
cmpx2y01f00hmpa31wptl05gm	cmpx2xxmp00b8pa31mbkqcvh1	cmpx2xz6o00cqpa31kzxr0z39	PARENT	\N	\N	\N	2026-06-02 20:18:17.907
cmpx2y01m00hopa31vjp4ai9e	cmpx2xxi000b2pa31ubuegkfj	cmpx2xzc700cwpa310spaux57	PARENT	\N	\N	\N	2026-06-02 20:18:17.912
cmpx2y01r00hqpa31wh7uj53o	cmpx2xxmp00b8pa31mbkqcvh1	cmpx2xzc700cwpa310spaux57	PARENT	\N	\N	\N	2026-06-02 20:18:17.919
\.


--
-- Data for Name: FamilyNode; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FamilyNode" (id, "treeId", "firstName", "lastName", "maidenName", "birthDate", "deathDate", gender, "photoId", notes, "posX", "posY", generation, "createdAt", "updatedAt", "clanId") FROM stdin;
cmpx2xesw000cpa31ihoxwcmq	cmpx2xehh0000pa313hbd9znu	Фёдор	Морозов	\N	1905-03-12 00:00:00	1943-11-05 00:00:00	MALE	cmpx2xepc000apa31awg7enic	Крестьянин из деревни Любань, погиб в Великой Отечественной войне.	540	1120	0	2026-06-02 20:17:50.384	2026-06-02 20:17:50.384	cmpx2xeir0002pa31hso0pwu8
cmpx2xfrd000wpa314clccsh0	cmpx2xehh0000pa313hbd9znu	Анна	Морозова	Ковалёва	1908-05-18 00:00:00	1979-09-22 00:00:00	FEMALE	cmpx2xfr6000upa31175j5zdd	Домохозяйка, хранительница очага, воспитавшая детей в трудные военные годы.	760	1120	0	2026-06-02 20:17:51.625	2026-06-02 20:17:51.625	cmpx2xeir0002pa31hso0pwu8
cmpx2xhes001gpa31zf5gf3e2	cmpx2xehh0000pa313hbd9znu	Иван	Соколов	\N	1907-06-15 00:00:00	1944-07-28 00:00:00	MALE	cmpx2xheo001epa31tq9xz6kf	Кузнец из Гомеля, мужественно сражавшийся и погибший в годы Великой Отечественной войны.	1200	1120	0	2026-06-02 20:17:53.765	2026-06-02 20:17:53.765	cmpx2xekj0006pa31oxqj3ivz
cmpx2xi0j0020pa31higiablf	cmpx2xehh0000pa313hbd9znu	Мария	Соколова	Гурло	1910-09-02 00:00:00	1988-12-14 00:00:00	FEMALE	cmpx2xi0b001ypa31i1aaeqfe	Швея из Гомеля, посвятившая жизнь заботе о семье в послевоенные годы.	1420	1120	0	2026-06-02 20:17:54.547	2026-06-02 20:17:54.547	cmpx2xekj0006pa31oxqj3ivz
cmpx2xion002kpa31nbk3q88t	cmpx2xehh0000pa313hbd9znu	Пётр	Морозов	\N	1930-01-20 00:00:00	2005-04-12 00:00:00	MALE	cmpx2xiog002ipa3157g2jlki	Труженик Минского тракторного завода (МТЗ), внесший вклад в послевоенное восстановление.	540	840	1	2026-06-02 20:17:55.415	2026-06-02 20:17:55.415	cmpx2xeir0002pa31hso0pwu8
cmpx2xj250034pa31qaqm5vpx	cmpx2xehh0000pa313hbd9znu	Ольга	Морозова	Лагунова	1934-11-02 00:00:00	2011-08-30 00:00:00	FEMALE	cmpx2xj230032pa316d5h1b3l	Бухгалтер, проработавшая долгие годы в системе коммунального хозяйства Минска.	760	840	1	2026-06-02 20:17:55.902	2026-06-02 20:17:55.902	cmpx2xeir0002pa31hso0pwu8
cmpx2xjx3003opa31s9w5wl6k	cmpx2xehh0000pa313hbd9znu	Нина	Волкова	Морозова	1933-04-15 00:00:00	2012-05-20 00:00:00	FEMALE	cmpx2xjx1003mpa31g40hwjs6	Заслуженный учитель математики в Витебске, дочь рода Морозовых.	310	840	1	2026-06-02 20:17:57.015	2026-06-02 20:17:57.015	cmpx2xeir0002pa31hso0pwu8
cmpx2xkb10048pa31wmm679bp	cmpx2xehh0000pa313hbd9znu	Сергей	Волков	\N	1928-10-12 00:00:00	1998-03-03 00:00:00	MALE	cmpx2xkax0046pa31vmrz841t	Ветеран Великой Отечественной войны, после войны работал профессиональным шофёром.	90	840	1	2026-06-02 20:17:57.517	2026-06-02 20:17:57.517	cmpx2xeke0004pa31es0eu0gw
cmpx2xl3c004spa318jb9kmbp	cmpx2xehh0000pa313hbd9znu	Владимир	Соколов	\N	1932-08-11 00:00:00	2009-02-14 00:00:00	MALE	cmpx2xl38004qpa3100z94sdk	Инженер-строитель, руководивший восстановлением и застройкой кварталов Гомеля.	1200	840	1	2026-06-02 20:17:58.536	2026-06-02 20:17:58.536	cmpx2xekj0006pa31oxqj3ivz
cmpx2xnvp005cpa31z8si8w9z	cmpx2xehh0000pa313hbd9znu	Валентина	Соколова	Дроздова	1937-05-05 00:00:00	2015-10-25 00:00:00	FEMALE	cmpx2xnvm005apa31w0pakxhn	Медицинская сестра Гомельской областной больницы с многолетним стажем.	1420	840	1	2026-06-02 20:18:02.15	2026-06-02 20:18:02.15	cmpx2xekj0006pa31oxqj3ivz
cmpx2xre7005wpa31hkg7y3rp	cmpx2xehh0000pa313hbd9znu	Татьяна	Петрова	Соколова	1936-07-07 00:00:00	2018-09-12 00:00:00	FEMALE	cmpx2xre4005upa31s4tb1kyf	Библиотекарь, много лет заведовавшая отделом редких книг научной библиотеки в Минске.	2080	840	1	2026-06-02 20:18:06.703	2026-06-02 20:18:06.703	cmpx2xekj0006pa31oxqj3ivz
cmpx2xry0006gpa31molq0rsx	cmpx2xehh0000pa313hbd9znu	Николай	Петров	\N	1931-12-12 00:00:00	2007-06-18 00:00:00	MALE	cmpx2xrxw006epa31drkp9im5	Токарь-универсал Минского автомобильного завода (МАЗ), заслуженный рационализатор.	1860	840	1	2026-06-02 20:18:07.417	2026-06-02 20:18:07.417	cmpx2xeko0008pa31kl7s9mdf
cmpx2xsds0070pa31dqmj70bn	cmpx2xehh0000pa313hbd9znu	Иван	Морозов	\N	1955-02-18 00:00:00	2020-03-14 00:00:00	MALE	cmpx2xsdo006ypa318beh8tuo	Инженер-электрик, проектировавший системы электроснабжения промышленных предприятий.	540	560	2	2026-06-02 20:18:07.984	2026-06-02 20:18:07.984	cmpx2xeir0002pa31hso0pwu8
cmpx2xsrp007kpa31rzgjqohm	cmpx2xehh0000pa313hbd9znu	Тамара	Морозова	Шуба	1957-04-20 00:00:00	2019-11-22 00:00:00	FEMALE	cmpx2xsrm007ipa312xna77qb	Экономист, специалист в области планирования материально-технического снабжения.	760	560	2	2026-06-02 20:18:08.486	2026-06-02 20:18:08.486	cmpx2xeir0002pa31hso0pwu8
cmpx2xtl50084pa315urz597a	cmpx2xehh0000pa313hbd9znu	Светлана	Морозова	\N	1958-09-08 00:00:00	\N	FEMALE	cmpx2xtl10082pa31if32h67a	Заслуженный педагог, преподающий русский язык в Минском колледже.	980	560	2	2026-06-02 20:18:09.546	2026-06-02 20:18:09.546	cmpx2xeir0002pa31hso0pwu8
cmpx2xtnp008apa31qxw4ep5t	cmpx2xehh0000pa313hbd9znu	Андрей	Соколов	\N	1956-07-24 00:00:00	\N	MALE	cmpx2xtnk0088pa31ln4c9cmw	Офицер в отставке, ныне преподает начальную военную подготовку в Минске.	1200	560	2	2026-06-02 20:18:09.637	2026-06-02 20:18:09.637	cmpx2xekj0006pa31oxqj3ivz
cmpx2xtq5008gpa31t17rvorr	cmpx2xehh0000pa313hbd9znu	Лариса	Соколова	Дубко	1959-11-12 00:00:00	\N	FEMALE	cmpx2xtq0008epa31r5uy9tzh	Врач-педиатр высшей категории в детской городской поликлинике Минска.	1420	560	2	2026-06-02 20:18:09.725	2026-06-02 20:18:09.725	cmpx2xekj0006pa31oxqj3ivz
cmpx2xtse008mpa31vb92295i	cmpx2xehh0000pa313hbd9znu	Виктор	Волков	\N	1954-10-18 00:00:00	2018-05-05 00:00:00	MALE	cmpx2xts9008kpa31qsm9dcdt	Водитель-дальнобойщик, осуществивший сотни международных рейсов.	90	560	2	2026-06-02 20:18:09.806	2026-06-02 20:18:09.806	cmpx2xeke0004pa31es0eu0gw
cmpx2xuwv0096pa31jae2vnza	cmpx2xehh0000pa313hbd9znu	Раиса	Волкова	Корзун	1956-03-30 00:00:00	\N	FEMALE	cmpx2xuwp0094pa31m9jyum2c	Продавец-консультант центрального универмага в Витебске.	310	560	2	2026-06-02 20:18:11.263	2026-06-02 20:18:11.263	cmpx2xeke0004pa31es0eu0gw
cmpx2xv3n009cpa3139zcgqgp	cmpx2xehh0000pa313hbd9znu	Михаил	Петров	\N	1959-06-15 00:00:00	2021-12-08 00:00:00	MALE	cmpx2xv3i009apa31mkg5gklb	Учитель истории средней школы, краевед, исследователь Могилевского замка.	1860	560	2	2026-06-02 20:18:11.507	2026-06-02 20:18:11.507	cmpx2xeko0008pa31kl7s9mdf
cmpx2xw24009wpa31a3kklhkb	cmpx2xehh0000pa313hbd9znu	Зоя	Петрова	Каспер	1961-04-22 00:00:00	\N	FEMALE	cmpx2xw20009upa316p4qqeii	Старший воспитатель детского дошкольного центра развития в Могилеве.	2080	560	2	2026-06-02 20:18:12.748	2026-06-02 20:18:12.748	cmpx2xeko0008pa31kl7s9mdf
cmpx2xwhf00a2pa31wwd77ols	cmpx2xehh0000pa313hbd9znu	Сергей	Морозов	\N	1980-03-12 00:00:00	\N	MALE	cmpx2xwhb00a0pa316ql8ojhy	Старший программист в сфере разработки облачных решений, Минск.	430	280	3	2026-06-02 20:18:13.299	2026-06-02 20:18:13.299	cmpx2xeir0002pa31hso0pwu8
cmpx2xwln00a8pa3168l6xlvs	cmpx2xehh0000pa313hbd9znu	Алёна	Морозова	Лис	1982-08-15 00:00:00	\N	FEMALE	cmpx2xwlj00a6pa31fle7dnea	Ведущий дизайнер интерьеров в архитектурной студии, Минск.	650	280	3	2026-06-02 20:18:13.451	2026-06-02 20:18:13.451	cmpx2xeir0002pa31hso0pwu8
cmpx2xwsu00aepa31sitxcgq6	cmpx2xehh0000pa313hbd9znu	Наталья	Морозова	\N	1985-10-20 00:00:00	\N	FEMALE	cmpx2xwsq00acpa317nv6eghq	Маркетолог в крупной дистрибьюторской компании, Минск.	870	280	3	2026-06-02 20:18:13.71	2026-06-02 20:18:13.71	cmpx2xeir0002pa31hso0pwu8
cmpx2xww600akpa31gpd8z6ib	cmpx2xehh0000pa313hbd9znu	Артём	Соколов	\N	1981-11-05 00:00:00	\N	MALE	cmpx2xww200aipa3180cgv7ii	Врач-хирург отделения сосудистой хирургии в клинической больнице Минска.	1200	280	3	2026-06-02 20:18:13.83	2026-06-02 20:18:13.83	cmpx2xekj0006pa31oxqj3ivz
cmpx2xx0g00aqpa319ibr5n6w	cmpx2xehh0000pa313hbd9znu	Юлия	Соколова	Кот	1984-06-12 00:00:00	\N	FEMALE	cmpx2xx0a00aopa31chig6q35	Фармацевт, управляющая современной сетевой аптекой в Минске.	1420	280	3	2026-06-02 20:18:13.984	2026-06-02 20:18:13.984	cmpx2xekj0006pa31oxqj3ivz
cmpx2xxdq00awpa314azjc638	cmpx2xehh0000pa313hbd9znu	Дарья	Соколова	\N	1986-09-28 00:00:00	\N	FEMALE	cmpx2xxdj00aupa31ijzd9b5q	Журналист, обозреватель культурных событий в столичных СМИ.	1640	280	3	2026-06-02 20:18:14.462	2026-06-02 20:18:14.462	cmpx2xekj0006pa31oxqj3ivz
cmpx2xxi000b2pa31ubuegkfj	cmpx2xehh0000pa313hbd9znu	Дмитрий	Волков	\N	1979-05-18 00:00:00	\N	MALE	cmpx2xxhv00b0pa31dmjxqxys	Частный предприниматель в сфере логистических услуг, Витебск.	90	280	3	2026-06-02 20:18:14.616	2026-06-02 20:18:14.616	cmpx2xeke0004pa31es0eu0gw
cmpx2xxmp00b8pa31mbkqcvh1	cmpx2xehh0000pa313hbd9znu	Марина	Волкова	Шах	1983-12-25 00:00:00	\N	FEMALE	cmpx2xxmk00b6pa316n8xk535	Главный бухгалтер в торговой компании, Витебск.	310	280	3	2026-06-02 20:18:14.785	2026-06-02 20:18:14.785	cmpx2xeke0004pa31es0eu0gw
cmpx2xxpx00bepa31cpmc0501	cmpx2xehh0000pa313hbd9znu	Роман	Петров	\N	1982-02-14 00:00:00	\N	MALE	cmpx2xxpt00bcpa31a5zbfq42	Ведущий инженер-программист промышленного холдинга, Могилев.	1860	280	3	2026-06-02 20:18:14.901	2026-06-02 20:18:14.901	cmpx2xeko0008pa31kl7s9mdf
cmpx2xy0p00bkpa31u0k28wyq	cmpx2xehh0000pa313hbd9znu	Оксана	Петрова	Бель	1985-07-04 00:00:00	\N	FEMALE	cmpx2xy0l00bipa3197sfjvwi	Учитель английского языка высшей категории в гимназии Могилева.	2080	280	3	2026-06-02 20:18:15.289	2026-06-02 20:18:15.289	cmpx2xeko0008pa31kl7s9mdf
cmpx2xy4a00bqpa31wfxozpid	cmpx2xehh0000pa313hbd9znu	Тимур	Морозов	\N	2008-05-12 00:00:00	\N	MALE	cmpx2xy4600bopa31i9v52fbu	Школьник, увлекается робототехникой и шахматами, Минск.	540	0	4	2026-06-02 20:18:15.418	2026-06-02 20:18:15.418	cmpx2xeir0002pa31hso0pwu8
cmpx2xyaw00bwpa31gfseg01a	cmpx2xehh0000pa313hbd9znu	Полина	Морозова	\N	2010-09-18 00:00:00	\N	FEMALE	cmpx2xyas00bupa31nokdpf4u	Ученица средней школы, занимается художественной гимнастикой, Минск.	760	0	4	2026-06-02 20:18:15.656	2026-06-02 20:18:15.656	cmpx2xeir0002pa31hso0pwu8
cmpx2xyja00c2pa31kbugw5k9	cmpx2xehh0000pa313hbd9znu	Никита	Морозов	\N	2012-11-04 00:00:00	\N	MALE	cmpx2xyj800c0pa31k4ov4dk4	Школьник, увлекается футболом и LEGO-конструированием, Минск.	980	0	4	2026-06-02 20:18:15.959	2026-06-02 20:18:15.959	cmpx2xeir0002pa31hso0pwu8
cmpx2xz6o00cqpa31kzxr0z39	cmpx2xehh0000pa313hbd9znu	Кирилл	Волков	\N	2007-04-22 00:00:00	\N	MALE	cmpx2xz6l00copa31hpuumy1q	Студент технического колледжа, увлекается программированием, Витебск.	-120	0	4	2026-06-02 20:18:16.8	2026-06-02 20:18:16.8	cmpx2xeke0004pa31es0eu0gw
cmpx2xzc700cwpa310spaux57	cmpx2xehh0000pa313hbd9znu	Алиса	Волкова	\N	2010-08-11 00:00:00	\N	FEMALE	cmpx2xzc400cupa31yk20dc5e	Школьница, занимается легкой атлетикой и вокалом, Витебск.	100	0	4	2026-06-02 20:18:16.999	2026-06-02 20:18:16.999	cmpx2xeke0004pa31es0eu0gw
cmpx2xyza00ckpa31k7x59dbe	cmpx2xehh0000pa313hbd9znu	Глеб	Соколов	\N	2013-10-18 00:00:00	\N	MALE	cmpx2xyz700cipa310xf0zn4t	Ученик младших классов, любит конструировать и рисовать комиксы.	1640	0	4	2026-06-02 20:18:16.535	2026-06-06 21:00:02.54	cmpx2xekj0006pa31oxqj3ivz
cmpx2xyog00c8pa317t70rmie	cmpx2xehh0000pa313hbd9znu	Максим	Соколов	\N	2009-03-20 00:00:00	\N	MALE	cmpx2xyod00c6pa31oq1ltjvv	Школьник, занимается плаванием и игрой на гитаре, Минск.	1200	0	4	2026-06-02 20:18:16.145	2026-06-06 17:49:39.353	cmpx2xekj0006pa31oxqj3ivz
cmpx2xzq600depa31fai1m84p	cmpx2xehh0000pa313hbd9znu	Владислав	Петров	\N	2010-06-12 00:00:00	\N	MALE	cmpx2xzq300dcpa31hzocpwxs	Школьник, занимается плаванием и увлекается 3D-моделированием, Могилев.	2080	0	4	2026-06-02 20:18:17.503	2026-06-06 21:00:04.742	cmpx2xeko0008pa31kl7s9mdf
cmpx2xyt600cepa31b9zcbs2o	cmpx2xehh0000pa313hbd9znu	Вероника	Соколова	\N	2011-07-07 00:00:00	\N	FEMALE	cmpx2xyt200ccpa31rn9x2xgh	Школьница, увлекается рисованием акварелью и танцами, Минск.	1420	0	4	2026-06-02 20:18:16.314	2026-06-06 17:50:09.536	cmpx2xekj0006pa31oxqj3ivz
cmpx2xzmt00d8pa314sl19pzn	cmpx2xehh0000pa313hbd9znu	Ева	Петрова	\N	2009-02-14 00:00:00	\N	FEMALE	cmpx2xzmo00d6pa319aeuw9ty	Школьница, увлекается игрой на скрипке и театральным искусством, Могилев.	1860	0	4	2026-06-02 20:18:17.381	2026-06-06 19:19:34.368	cmpx2xeko0008pa31kl7s9mdf
cmpx2xzg600d2pa31dlpgc8qa	cmpx2xehh0000pa313hbd9znu	Егор	Волков	\N	2012-09-30 00:00:00	\N	MALE	cmpx2xzg300d0pa31u1e1mcs5	Школьник, любит собирать авиамодели и играть в настольный теннис.	320	0	4	2026-06-02 20:18:17.143	2026-06-06 18:24:15.242	cmpx2xeke0004pa31es0eu0gw
cmpx2xzuq00dkpa31i2k2o86o	cmpx2xehh0000pa313hbd9znu	София	Петрова	\N	2012-12-25 00:00:00	\N	FEMALE	cmpx2xzum00dipa3132ist7a6	Школьница, любит лепить из глины, занимается танцами, Могилев.	2300	0	4	2026-06-02 20:18:17.666	2026-06-06 19:19:29.111	cmpx2xeko0008pa31kl7s9mdf
\.


--
-- Data for Name: FamilyTree; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FamilyTree" (id, name, description, "ownerId", visibility, "accessHash", "createdAt", "updatedAt") FROM stdin;
cmpx2xehh0000pa313hbd9znu	Родословное древо Морозовых, Соколовых, Волковых и Петровых	Белорусское генеалогическое древо четырёх пересекающихся родов на протяжении пяти поколений (43 человека).	cmpvm2avm0000qz36l57c1d7z	PUBLIC	\N	2026-06-02 20:17:49.972	2026-06-02 20:17:49.972
\.


--
-- Data for Name: GalleryItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GalleryItem" (id, "profileId", "mediaId", caption, "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: GuestMemory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GuestMemory" (id, "profileId", "authorUserId", "authorName", type, text, "mediaId", "isApproved", "approvedAt", "approvedById", "createdAt", "updatedAt") FROM stdin;
cmpx2xfki000spa31xk2jux8s	cmpx2xewe000ipa31cl7m0ces	\N	Пётр (сын)	TEXT	Отец ушел на фронт в сорок первом и остался в нашей памяти героем.	\N	t	2026-06-02 20:17:51.376	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:51.378	2026-06-02 20:17:51.378
cmpx2xhc7001cpa31pp0djc80	cmpx2xfs20012pa31ukcont01	\N	Нина (дочь)	TEXT	Мама умела согреть теплом в самые голодные зимы. Её рушники мы храним как реликвию.	\N	t	2026-06-02 20:17:53.67	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:53.671	2026-06-02 20:17:53.671
cmpx2xhy2001wpa316guj9apb	cmpx2xhfc001mpa311wqcigrs	\N	Владимир (сын)	TEXT	Отец ковал победу в кузнице, а затем защитил нас ценой своей жизни на фронте.	\N	t	2026-06-02 20:17:54.455	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:54.458	2026-06-02 20:17:54.458
cmpx2xifo002gpa31c4w52bjg	cmpx2xi1b0026pa31gwjcuzaw	\N	Татьяна (дочь)	TEXT	Мама шила прекрасные платья и научила меня ценить аккуратность в деталях.	\N	t	2026-06-02 20:17:55.091	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.092	2026-06-02 20:17:55.092
cmpx2xj0p0030pa31x4v4k4d5	cmpx2xip9002qpa31juqegp2n	\N	Иван (сын)	TEXT	Отец научил меня главному — уважать свой труд и никогда не бросать начатое дело.	\N	t	2026-06-02 20:17:55.848	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.849	2026-06-02 20:17:55.849
cmpx2xjty003kpa314056blez	cmpx2xj2k003apa31pa2och9n	\N	Светлана (дочь)	TEXT	У мамы всегда все лежало по полочкам — и в бухгалтерии, и дома.	\N	t	2026-06-02 20:17:56.9	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:56.902	2026-06-02 20:17:56.902
cmpx2xk970044pa31nqk1gj79	cmpx2xjxc003upa31fccp1k9c	\N	Виктор (сын)	TEXT	Мама умела объяснить сложнейшую теорему так, что понимал каждый ученик.	\N	t	2026-06-02 20:17:57.45	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:57.452	2026-06-02 20:17:57.452
cmpx2xl0y004opa314n5yso6c	cmpx2xkbh004epa31iy4ced9x	\N	Виктор (сын)	TEXT	Отец обожал технику, мог починить мотор грузовика прямо в чистом поле.	\N	t	2026-06-02 20:17:58.448	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:58.45	2026-06-02 20:17:58.45
cmpx2xnue0058pa31ek0it87r	cmpx2xl3r004ypa311s8qsdgx	\N	Андрей (сын)	TEXT	Дедушка строил жилые дома, в которых до сих пор счастливо живут люди.	\N	t	2026-06-02 20:18:02.101	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:02.102	2026-06-02 20:18:02.102
cmpx2xrbj005spa31ecnhpwnj	cmpx2xnw2005ipa31e96ccnjl	\N	Андрей (сын)	TEXT	Мама была самым добрым человеком. Умела лечить просто своим тихим словом.	\N	t	2026-06-02 20:18:06.605	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:06.607	2026-06-02 20:18:06.607
cmpx2xrua006cpa31x8gt38q8	cmpx2xrei0062pa31ydtahh3c	\N	Михаил (сын)	TEXT	Мама привила мне огромную любовь к книгам и уважение к истории.	\N	t	2026-06-02 20:18:07.281	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.282	2026-06-02 20:18:07.282
cmpx2xscb006wpa31oj97bjqn	cmpx2xryk006mpa31rcd7p69t	\N	Михаил (сын)	TEXT	Отец мог выточить на станке деталь любой сложности с ювелирной точностью.	\N	t	2026-06-02 20:18:07.93	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.931	2026-06-02 20:18:07.931
cmpx2xsq6007gpa31euhe9rz4	cmpx2xse70076pa317acy2jvv	\N	Сергей (сын)	TEXT	Отец всегда учил меня просчитывать безопасность на два шага вперед.	\N	t	2026-06-02 20:18:08.429	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:08.43	2026-06-02 20:18:08.43
cmpx2xti70080pa31txzcs88r	cmpx2xss1007qpa31g0pnr9xz	\N	Наталья (дочь)	TEXT	Мама всегда помогала найти верное решение в любых жизненных вопросах.	\N	t	2026-06-02 20:18:09.438	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.439	2026-06-02 20:18:09.439
cmpx2xuob0092pa31al1sjsoz	cmpx2xtsv008spa31g1884yos	\N	Дмитрий (сын)	TEXT	Отец привозил из поездок удивительные сувениры и открытки из разных городов.	\N	t	2026-06-02 20:18:10.954	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:10.955	2026-06-02 20:18:10.955
cmpx2xvzp009spa314yvi903h	cmpx2xv46009ipa3102vkt5sf	\N	Роман (сын)	TEXT	Отец научил меня любить историю родного края и понимать ценность прошлого.	\N	t	2026-06-02 20:18:12.66	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:12.662	2026-06-02 20:18:12.662
\.


--
-- Data for Name: LegacyClaim; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LegacyClaim" (id, "legacyContactId", "claimantId", status, evidence, "reviewerId", "reviewedAt", "reviewNotes", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LegacyContact; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LegacyContact" (id, "ownerId", "heirUserId", "heirEmail", "heirName", status, "inviteTokenHash", "inviteExpiresAt", "inviteSentAt", "verifiedAt", "triggeredAt", "inactivityDays", message, "revokedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Media" (id, kind, url, "originalName", "mimeType", "sizeBytes", width, height, "durationSec", "uploadedById", "createdAt") FROM stdin;
cmpx2xepc000apa31awg7enic	IMAGE	/uploads/avatar_fedor_g0.webp	avatar_fedor_g0.webp	image/webp	312408	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:50.256
cmpx2xf8l000kpa31up5vxm99	IMAGE	/uploads/photo_fedor_g0_1.webp	photo_fedor_g0_1.webp	image/webp	308132	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:50.95
cmpx2xfjt000mpa31aw1b9iud	IMAGE	/uploads/photo_fedor_g0_2.webp	photo_fedor_g0_2.webp	image/webp	281066	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:51.353
cmpx2xfr6000upa31175j5zdd	IMAGE	/uploads/avatar_anna_g0.webp	avatar_anna_g0.webp	image/webp	348248	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:51.619
cmpx2xfzh0014pa31dsrm0hvg	IMAGE	/uploads/photo_anna_g0_1.webp	photo_anna_g0_1.webp	image/webp	341004	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:51.917
cmpx2xhbr0016pa31kmoxb66p	IMAGE	/uploads/photo_anna_g0_2.webp	photo_anna_g0_2.webp	image/webp	293642	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:53.656
cmpx2xheo001epa31tq9xz6kf	IMAGE	/uploads/avatar_ivan_g0.webp	avatar_ivan_g0.webp	image/webp	380316	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:53.761
cmpx2xhtx001opa31zrvxkmle	IMAGE	/uploads/photo_ivan_g0_1.webp	photo_ivan_g0_1.webp	image/webp	399348	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:54.31
cmpx2xhxn001qpa31asjo6np6	IMAGE	/uploads/photo_ivan_g0_2.webp	photo_ivan_g0_2.webp	image/webp	362552	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:54.443
cmpx2xi0b001ypa31i1aaeqfe	IMAGE	/uploads/avatar_maria_g0.webp	avatar_maria_g0.webp	image/webp	470646	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:54.539
cmpx2xibd0028pa313yvde44p	IMAGE	/uploads/photo_maria_g0_1.webp	photo_maria_g0_1.webp	image/webp	302914	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:54.937
cmpx2xifc002apa31q1dlg9oj	IMAGE	/uploads/photo_maria_g0_2.webp	photo_maria_g0_2.webp	image/webp	266686	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.08
cmpx2xiog002ipa3157g2jlki	IMAGE	/uploads/avatar_petr_g1.webp	avatar_petr_g1.webp	image/webp	71848	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.409
cmpx2xiuc002spa31z46jxjdy	IMAGE	/uploads/photo_petr_g1_1.webp	photo_petr_g1_1.webp	image/webp	75674	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.62
cmpx2xj0j002upa31bnuc23vg	IMAGE	/uploads/photo_petr_g1_2.webp	photo_petr_g1_2.webp	image/webp	75678	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.843
cmpx2xj230032pa316d5h1b3l	IMAGE	/uploads/avatar_olga_g1.webp	avatar_olga_g1.webp	image/webp	264934	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:55.899
cmpx2xjgr003cpa318alb997y	IMAGE	/uploads/photo_olga_g1_1.webp	photo_olga_g1_1.webp	image/webp	262448	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:56.427
cmpx2xjtm003epa31mgzoldfw	IMAGE	/uploads/photo_olga_g1_2.webp	photo_olga_g1_2.webp	image/webp	236700	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:56.89
cmpx2xk36003wpa312en3q8qb	IMAGE	/uploads/photo_nina_g1_1.webp	photo_nina_g1_1.webp	image/webp	288286	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:57.234
cmpx2xk8w003ypa315o53w9lu	IMAGE	/uploads/photo_nina_g1_2.webp	photo_nina_g1_2.webp	image/webp	246744	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:57.44
cmpx2xkvl004gpa315pcu9lcx	IMAGE	/uploads/photo_sergey_g1_1.webp	photo_sergey_g1_1.webp	image/webp	254192	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:58.258
cmpx2xl0o004ipa312wpa82q4	IMAGE	/uploads/photo_sergey_g1_2.webp	photo_sergey_g1_2.webp	image/webp	221652	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:58.44
cmpx2xl38004qpa3100z94sdk	IMAGE	/uploads/avatar_vladimir_g1.webp	avatar_vladimir_g1.webp	image/webp	303080	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:58.532
cmpx2xle80050pa31kxhr2p34	IMAGE	/uploads/photo_vladimir_g1_1.webp	photo_vladimir_g1_1.webp	image/webp	296768	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:58.929
cmpx2xnu60052pa31w5t1yife	IMAGE	/uploads/photo_vladimir_g1_2.webp	photo_vladimir_g1_2.webp	image/webp	251078	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:02.094
cmpx2xkax0046pa31vmrz841t	IMAGE	/uploads/avatar_sergey_g1.webp	avatar_sergey_g1.webp	image/webp	293858	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:57.513
cmpx2xjx1003mpa31g40hwjs6	IMAGE	/uploads/avatar_nina_g1.webp	avatar_nina_g1.webp	image/webp	306962	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:17:57.014
cmpx2xnvm005apa31w0pakxhn	IMAGE	/uploads/avatar_valentina_g1.webp	avatar_valentina_g1.webp	image/webp	71140	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:02.147
cmpx2xr23005kpa3162rabb1s	IMAGE	/uploads/photo_valentina_g1_1.webp	photo_valentina_g1_1.webp	image/webp	334148	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:06.268
cmpx2xrb5005mpa310jngi7k4	IMAGE	/uploads/photo_valentina_g1_2.webp	photo_valentina_g1_2.webp	image/webp	309714	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:06.593
cmpx2xre4005upa31s4tb1kyf	IMAGE	/uploads/avatar_tatiana_g1.webp	avatar_tatiana_g1.webp	image/webp	69632	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:06.7
cmpx2xrmp0064pa318xgu7nlc	IMAGE	/uploads/photo_tatiana_g1_1.webp	photo_tatiana_g1_1.webp	image/webp	261234	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.01
cmpx2xrtz0066pa315yvvsszz	IMAGE	/uploads/photo_tatiana_g1_2.webp	photo_tatiana_g1_2.webp	image/webp	225418	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.272
cmpx2xrxw006epa31drkp9im5	IMAGE	/uploads/avatar_nikolay_g1.webp	avatar_nikolay_g1.webp	image/webp	74442	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.412
cmpx2xs9a006opa316sd3jixg	IMAGE	/uploads/photo_nikolay_g1_1.webp	photo_nikolay_g1_1.webp	image/webp	308966	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.822
cmpx2xsc0006qpa31i1l8lc3y	IMAGE	/uploads/photo_nikolay_g1_2.webp	photo_nikolay_g1_2.webp	image/webp	273910	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.92
cmpx2xsdo006ypa318beh8tuo	IMAGE	/uploads/avatar_ivan_g2.webp	avatar_ivan_g2.webp	image/webp	277764	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:07.98
cmpx2xsl90078pa31op9vf6ju	IMAGE	/uploads/photo_ivan_g2_1.webp	photo_ivan_g2_1.webp	image/webp	58440	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:08.253
cmpx2xspu007apa31ibusqjhv	IMAGE	/uploads/photo_ivan_g2_2.webp	photo_ivan_g2_2.webp	image/webp	51990	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:08.418
cmpx2xsrm007ipa312xna77qb	IMAGE	/uploads/avatar_tamara_g2.webp	avatar_tamara_g2.webp	image/webp	284672	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:08.483
cmpx2xt7p007spa31ne6gx3ru	IMAGE	/uploads/photo_tamara_g2_1.webp	photo_tamara_g2_1.webp	image/webp	277682	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.061
cmpx2xthw007upa31g2vbakkq	IMAGE	/uploads/photo_tamara_g2_2.webp	photo_tamara_g2_2.webp	image/webp	228348	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.428
cmpx2xtl10082pa31if32h67a	IMAGE	/uploads/avatar_svetlana_g2.webp	avatar_svetlana_g2.webp	image/webp	242700	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.541
cmpx2xtnk0088pa31ln4c9cmw	IMAGE	/uploads/avatar_andrey_g2.webp	avatar_andrey_g2.webp	image/webp	289706	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.632
cmpx2xtq0008epa31r5uy9tzh	IMAGE	/uploads/avatar_larisa_g2.webp	avatar_larisa_g2.webp	image/webp	304256	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.721
cmpx2xts9008kpa31qsm9dcdt	IMAGE	/uploads/avatar_viktor_g2.webp	avatar_viktor_g2.webp	image/webp	338856	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:09.801
cmpx2xuf6008upa31kafdslbk	IMAGE	/uploads/photo_viktor_g2_1.webp	photo_viktor_g2_1.webp	image/webp	16696	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:10.626
cmpx2xunz008wpa31klgrqvkl	IMAGE	/uploads/photo_viktor_g2_2.webp	photo_viktor_g2_2.webp	image/webp	20006	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:10.943
cmpx2xww200aipa3180cgv7ii	IMAGE	/uploads/avatar_artem_g3.webp	avatar_artem_g3.webp	image/webp	244044	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:13.826
cmpx2xwsq00acpa317nv6eghq	IMAGE	/uploads/avatar_natalia_g3.webp	avatar_natalia_g3.webp	image/webp	205558	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:13.706
cmpx2xx0a00aopa31chig6q35	IMAGE	/uploads/avatar_yulia_g3.webp	avatar_yulia_g3.webp	image/webp	214248	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:13.979
cmpx2xw20009upa316p4qqeii	IMAGE	/uploads/avatar_zoya_g2.webp	avatar_zoya_g2.webp	image/webp	264538	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:12.744
cmpx2xuwp0094pa31m9jyum2c	IMAGE	/uploads/avatar_raisa_g2.webp	avatar_raisa_g2.webp	image/webp	313698	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:11.257
cmpx2xv3i009apa31mkg5gklb	IMAGE	/uploads/avatar_mikhail_g2.webp	avatar_mikhail_g2.webp	image/webp	337924	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:11.502
cmpx2xvv1009kpa31fby7gc52	IMAGE	/uploads/photo_mikhail_g2_1.webp	photo_mikhail_g2_1.webp	image/webp	125704	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:12.494
cmpx2xvzg009mpa31ffltl1yh	IMAGE	/uploads/photo_mikhail_g2_2.webp	photo_mikhail_g2_2.webp	image/webp	134224	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:12.652
cmpx2xwhb00a0pa316ql8ojhy	IMAGE	/uploads/avatar_sergey_g3.webp	avatar_sergey_g3.webp	image/webp	251708	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:13.295
cmpx2xwlj00a6pa31fle7dnea	IMAGE	/uploads/avatar_alena_g3.webp	avatar_alena_g3.webp	image/webp	253206	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:13.447
cmpx2xxhv00b0pa31dmjxqxys	IMAGE	/uploads/avatar_dmitry_g3.webp	avatar_dmitry_g3.webp	image/webp	388372	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:14.611
cmpx2xxmk00b6pa316n8xk535	IMAGE	/uploads/avatar_marina_g3.webp	avatar_marina_g3.webp	image/webp	249182	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:14.78
cmpx2xy0l00bipa3197sfjvwi	IMAGE	/uploads/avatar_oksana_g3.webp	avatar_oksana_g3.webp	image/webp	312740	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:15.285
cmpx2xyas00bupa31nokdpf4u	IMAGE	/uploads/avatar_polina_g4.webp	avatar_polina_g4.webp	image/webp	298024	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:15.652
cmpx2xyj800c0pa31k4ov4dk4	IMAGE	/uploads/avatar_nikita_g4.webp	avatar_nikita_g4.webp	image/webp	203796	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:15.956
cmpx2xyod00c6pa31oq1ltjvv	IMAGE	/uploads/avatar_maksim_g4.webp	avatar_maksim_g4.webp	image/webp	250182	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:16.141
cmpx2xyt200ccpa31rn9x2xgh	IMAGE	/uploads/avatar_veronika_g4.webp	avatar_veronika_g4.webp	image/webp	340200	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:16.31
cmpx2xyz700cipa310xf0zn4t	IMAGE	/uploads/avatar_gleb_g4.webp	avatar_gleb_g4.webp	image/webp	324934	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:16.531
cmpx2xzc400cupa31yk20dc5e	IMAGE	/uploads/avatar_alisa_g4.webp	avatar_alisa_g4.webp	image/webp	249260	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:16.996
cmpx2xzg300d0pa31u1e1mcs5	IMAGE	/uploads/avatar_egor_g4.webp	avatar_egor_g4.webp	image/webp	221340	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:17.139
cmpx2xzmo00d6pa319aeuw9ty	IMAGE	/uploads/avatar_eva_g4.webp	avatar_eva_g4.webp	image/webp	251010	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:17.377
cmpx2xzq300dcpa31hzocpwxs	IMAGE	/uploads/avatar_vladislav_g4.webp	avatar_vladislav_g4.webp	image/webp	219186	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:17.499
cmpx2xy4600bopa31i9v52fbu	IMAGE	/uploads/avatar_timur_g4.webp	avatar_timur_g4.webp	image/webp	193490	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:15.414
cmpx2xz6l00copa31hpuumy1q	IMAGE	/uploads/avatar_kirill_g4.webp	avatar_kirill_g4.webp	image/webp	188662	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:16.797
cmpx2xzum00dipa3132ist7a6	IMAGE	/uploads/avatar_sofia_g4.webp	avatar_sofia_g4.webp	image/webp	236210	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:17.662
cmpx2xxpt00bcpa31a5zbfq42	IMAGE	/uploads/avatar_roman_g3.webp	avatar_roman_g3.webp	image/webp	215010	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:14.897
cmpx2xxdj00aupa31ijzd9b5q	IMAGE	/uploads/avatar_daria_g3.webp	avatar_daria_g3.webp	image/webp	242238	900	900	\N	cmpvm2avm0000qz36l57c1d7z	2026-06-02 20:18:14.455
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "usedAt", ip, "createdAt") FROM stdin;
\.


--
-- Data for Name: Profile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Profile" (id, slug, "fullName", "birthDate", "deathDate", "birthPlace", "deathPlace", "burialPlace", "burialLat", "burialLng", bio, "coverPhotoId", gender, visibility, "accessHash", "ownerId", "familyNodeId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmpx2xewe000ipa31cl7m0ces	morozov-fyodor	Морозов Фёдор Иванович	1905-03-12 00:00:00	1943-11-05 00:00:00	д. Любань	Поле сражения	Братская могила, Любань	\N	\N	Крестьянин из деревни Любань, погиб в Великой Отечественной войне.	cmpx2xepc000apa31awg7enic	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xesw000cpa31ihoxwcmq	2026-06-02 20:17:50.51	2026-06-02 20:17:50.51	\N
cmpx2xfs20012pa31ukcont01	morozova-anna	Морозова Анна Степановна	1908-05-18 00:00:00	1979-09-22 00:00:00	д. Любань	г. Минск	Северное кладбище, Минск	\N	\N	Домохозяйка, хранительница очага, воспитавшая детей в трудные военные годы.	cmpx2xfr6000upa31175j5zdd	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xfrd000wpa314clccsh0	2026-06-02 20:17:51.65	2026-06-02 20:17:51.65	\N
cmpx2xhfc001mpa311wqcigrs	sokolov-ivan	Соколов Иван Григорьевич	1907-06-15 00:00:00	1944-07-28 00:00:00	г. Гомель	Фронт	Воинское кладбище, Гомель	\N	\N	Кузнец из Гомеля, мужественно сражавшийся и погибший в годы Великой Отечественной войны.	cmpx2xheo001epa31tq9xz6kf	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xhes001gpa31zf5gf3e2	2026-06-02 20:17:53.784	2026-06-02 20:17:53.784	\N
cmpx2xi1b0026pa31gwjcuzaw	sokolova-mariya	Соколова Мария Павловна	1910-09-02 00:00:00	1988-12-14 00:00:00	г. Гомель	г. Гомель	Новобелицкое кладбище, Гомель	\N	\N	Швея из Гомеля, посвятившая жизнь заботе о семье в послевоенные годы.	cmpx2xi0b001ypa31i1aaeqfe	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xi0j0020pa31higiablf	2026-06-02 20:17:54.575	2026-06-02 20:17:54.575	\N
cmpx2xip9002qpa31juqegp2n	morozov-pyotr	Морозов Пётр Фёдорович	1930-01-20 00:00:00	2005-04-12 00:00:00	д. Любань	г. Минск	Северное кладбище, Минск	\N	\N	Труженик Минского тракторного завода (МТЗ), внесший вклад в послевоенное восстановление.	cmpx2xiog002ipa3157g2jlki	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xion002kpa31nbk3q88t	2026-06-02 20:17:55.437	2026-06-02 20:17:55.437	\N
cmpx2xj2k003apa31pa2och9n	morozova-olga	Морозова Ольга Антоновна	1934-11-02 00:00:00	2011-08-30 00:00:00	г. Минск	г. Минск	Северное кладбище, Минск	\N	\N	Бухгалтер, проработавшая долгие годы в системе коммунального хозяйства Минска.	cmpx2xj230032pa316d5h1b3l	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xj250034pa31qaqm5vpx	2026-06-02 20:17:55.917	2026-06-02 20:17:55.917	\N
cmpx2xjxc003upa31fccp1k9c	volkova-nina	Волкова Нина Фёдоровна	1933-04-15 00:00:00	2012-05-20 00:00:00	д. Любань	г. Витебск	Мазуринское кладбище, Витебск	\N	\N	Заслуженный учитель математики в Витебске, дочь рода Морозовых.	cmpx2xjx1003mpa31g40hwjs6	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xjx3003opa31s9w5wl6k	2026-06-02 20:17:57.024	2026-06-02 20:17:57.024	\N
cmpx2xkbh004epa31iy4ced9x	volkov-sergey	Волков Сергей Андреевич	1928-10-12 00:00:00	1998-03-03 00:00:00	г. Витебск	г. Витебск	Мазуринское кладбище, Витебск	\N	\N	Ветеран Великой Отечественной войны, после войны работал профессиональным шофёром.	cmpx2xkax0046pa31vmrz841t	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xkb10048pa31wmm679bp	2026-06-02 20:17:57.533	2026-06-02 20:17:57.533	\N
cmpx2xl3r004ypa311s8qsdgx	sokolov-vladimir	Соколов Владимир Иванович	1932-08-11 00:00:00	2009-02-14 00:00:00	г. Гомель	г. Гомель	Рандовское кладбище, Гомель	\N	\N	Инженер-строитель, руководивший восстановлением и застройкой кварталов Гомеля.	cmpx2xl38004qpa3100z94sdk	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xl3c004spa318jb9kmbp	2026-06-02 20:17:58.551	2026-06-02 20:17:58.551	\N
cmpx2xnw2005ipa31e96ccnjl	sokolova-valentina	Соколова Валентина Петровна	1937-05-05 00:00:00	2015-10-25 00:00:00	г. Рогачев	г. Гомель	Рандовское кладбище, Гомель	\N	\N	Медицинская сестра Гомельской областной больницы с многолетним стажем.	cmpx2xnvm005apa31w0pakxhn	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xnvp005cpa31z8si8w9z	2026-06-02 20:18:02.163	2026-06-02 20:18:02.163	\N
cmpx2xrei0062pa31ydtahh3c	petrova-tatyana	Петрова Татьяна Ивановна	1936-07-07 00:00:00	2018-09-12 00:00:00	г. Гомель	г. Минск	Восточное кладбище, Минск	\N	\N	Библиотекарь, много лет заведовавшая отделом редких книг научной библиотеки в Минске.	cmpx2xre4005upa31s4tb1kyf	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xre7005wpa31hkg7y3rp	2026-06-02 20:18:06.714	2026-06-02 20:18:06.714	\N
cmpx2xryk006mpa31rcd7p69t	petrov-nikolay	Петров Николай Степанович	1931-12-12 00:00:00	2007-06-18 00:00:00	г. Могилев	г. Минск	Восточное кладбище, Минск	\N	\N	Токарь-универсал Минского автомобильного завода (МАЗ), заслуженный рационализатор.	cmpx2xrxw006epa31drkp9im5	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xry0006gpa31molq0rsx	2026-06-02 20:18:07.436	2026-06-02 20:18:07.436	\N
cmpx2xse70076pa317acy2jvv	morozov-ivan	Морозов Иван Петрович	1955-02-18 00:00:00	2020-03-14 00:00:00	г. Минск	г. Минск	Чижовское кладбище, Минск	\N	\N	Инженер-электрик, проектировавший системы электроснабжения промышленных предприятий.	cmpx2xsdo006ypa318beh8tuo	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xsds0070pa31dqmj70bn	2026-06-02 20:18:07.999	2026-06-02 20:18:07.999	\N
cmpx2xss1007qpa31g0pnr9xz	morozova-tamara	Морозова Тамара Викторовна	1957-04-20 00:00:00	2019-11-22 00:00:00	г. Слуцк	г. Минск	Чижовское кладбище, Минск	\N	\N	Экономист, специалист в области планирования материально-технического снабжения.	cmpx2xsrm007ipa312xna77qb	FEMALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xsrp007kpa31rzgjqohm	2026-06-02 20:18:08.497	2026-06-02 20:18:08.497	\N
cmpx2xtsv008spa31g1884yos	volkov-viktor	Волков Виктор Сергеевич	1954-10-18 00:00:00	2018-05-05 00:00:00	г. Витебск	г. Витебск	Мазуринское кладбище, Витебск	\N	\N	Водитель-дальнобойщик, осуществивший сотни международных рейсов.	cmpx2xts9008kpa31qsm9dcdt	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xtse008mpa31vb92295i	2026-06-02 20:18:09.823	2026-06-02 20:18:09.823	\N
cmpx2xv46009ipa3102vkt5sf	petrov-mikhail	Петров Михаил Николаевич	1959-06-15 00:00:00	2021-12-08 00:00:00	г. Минск	г. Могилев	Ново-Машековское кладбище, Могилев	\N	\N	Учитель истории средней школы, краевед, исследователь Могилевского замка.	cmpx2xv3i009apa31mkg5gklb	MALE	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	cmpx2xv3n009cpa3139zcgqgp	2026-06-02 20:18:11.526	2026-06-02 20:18:11.526	\N
cmq1jd0m10003o128bmidjz1k	novaya-stranitsa	Новая страница	\N	\N	\N	\N	\N	\N	\N	\N	\N	UNKNOWN	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	\N	2026-06-05 23:08:57.05	2026-06-05 23:08:57.05	\N
cmq2lcggq000bo128nh1y4bny	novaya-stranitsa-1	Новая страница	\N	\N	\N	\N	\N	\N	\N	\N	\N	UNKNOWN	PUBLIC	\N	cmpvm2avm0000qz36l57c1d7z	\N	2026-06-06 16:52:16.345	2026-06-06 16:52:16.345	\N
\.


--
-- Data for Name: ProfileAccess; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProfileAccess" (id, "profileId", "userId", "grantedBy", "canEdit", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProfileAccessCode; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProfileAccessCode" (id, "profileId", "codeHash", label, "expiresAt", "revokedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProfileDispute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProfileDispute" (id, "profileId", "reporterId", reason, description, evidence, status, "resolverId", resolution, "resolvedAt", "mergeRequestId", "createdAt", "updatedAt", "duplicateOfProfileId") FROM stdin;
\.


--
-- Data for Name: ProfileMergeRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProfileMergeRequest" (id, "sourceProfileId", "targetProfileId", "requesterId", reason, status, "sourceOwnerApprovedAt", "sourceOwnerApprovedBy", "targetOwnerApprovedAt", "targetOwnerApprovedBy", "adminApprovedAt", "adminApprovedBy", "executedAt", "rejectedAt", "rejectedBy", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: QrPlaque; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."QrPlaque" (id, "profileId", code, "isActive", "orderedAt", "shippedAt") FROM stdin;
\.


--
-- Data for Name: TgLoginToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TgLoginToken" (id, token, status, "userId", "expiresAt", "confirmedAt", "consumedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: TimelineEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimelineEvent" (id, "familyNodeId", "profileId", category, title, description, date, "dateAccuracy", place, "createdAt", "updatedAt", "iconKey", "createdById", "deletedAt") FROM stdin;
cmpx2xeto000epa3153rqwcoh	cmpx2xesw000cpa31ihoxwcmq	cmpx2xewe000ipa31cl7m0ces	BIRTH	Рождение	Рождение в г./д. д. Любань.	1905-03-12 00:00:00	day	\N	2026-06-02 20:17:50.411	2026-06-02 20:17:50.733	\N	\N	\N
cmpx2xevq000gpa319resext4	cmpx2xesw000cpa31ihoxwcmq	cmpx2xewe000ipa31cl7m0ces	DEATH	Уход из жизни	Скончался в возрасте 38 лет. Похоронен: Братская могила, Любань.	1943-11-05 00:00:00	day	\N	2026-06-02 20:17:50.486	2026-06-02 20:17:50.733	\N	\N	\N
cmpx2xfrl000ypa31z8ereeyg	cmpx2xfrd000wpa314clccsh0	cmpx2xfs20012pa31ukcont01	BIRTH	Рождение	Рождение в г./д. д. Любань.	1908-05-18 00:00:00	day	\N	2026-06-02 20:17:51.634	2026-06-02 20:17:51.658	\N	\N	\N
cmpx2xfrr0010pa31jik69t0h	cmpx2xfrd000wpa314clccsh0	cmpx2xfs20012pa31ukcont01	DEATH	Уход из жизни	Скончался в возрасте 71 лет. Похоронен: Северное кладбище, Минск.	1979-09-22 00:00:00	day	\N	2026-06-02 20:17:51.639	2026-06-02 20:17:51.658	\N	\N	\N
cmpx2xhf0001ipa312gk3h6dk	cmpx2xhes001gpa31zf5gf3e2	cmpx2xhfc001mpa311wqcigrs	BIRTH	Рождение	Рождение в г./д. г. Гомель.	1907-06-15 00:00:00	day	\N	2026-06-02 20:17:53.772	2026-06-02 20:17:53.79	\N	\N	\N
cmpx2xhf4001kpa316an0rx2c	cmpx2xhes001gpa31zf5gf3e2	cmpx2xhfc001mpa311wqcigrs	DEATH	Уход из жизни	Скончался в возрасте 37 лет. Похоронен: Воинское кладбище, Гомель.	1944-07-28 00:00:00	day	\N	2026-06-02 20:17:53.776	2026-06-02 20:17:53.79	\N	\N	\N
cmpx2xi0r0022pa31t42alky1	cmpx2xi0j0020pa31higiablf	cmpx2xi1b0026pa31gwjcuzaw	BIRTH	Рождение	Рождение в г./д. г. Гомель.	1910-09-02 00:00:00	day	\N	2026-06-02 20:17:54.556	2026-06-02 20:17:54.58	\N	\N	\N
cmpx2xi0y0024pa31ubegumr1	cmpx2xi0j0020pa31higiablf	cmpx2xi1b0026pa31gwjcuzaw	DEATH	Уход из жизни	Скончался в возрасте 78 лет. Похоронен: Новобелицкое кладбище, Гомель.	1988-12-14 00:00:00	day	\N	2026-06-02 20:17:54.562	2026-06-02 20:17:54.58	\N	\N	\N
cmpx2xiou002mpa31xqig9ty6	cmpx2xion002kpa31nbk3q88t	cmpx2xip9002qpa31juqegp2n	BIRTH	Рождение	Рождение в г./д. д. Любань.	1930-01-20 00:00:00	day	\N	2026-06-02 20:17:55.422	2026-06-02 20:17:55.444	\N	\N	\N
cmpx2xioy002opa315dfh1ktp	cmpx2xion002kpa31nbk3q88t	cmpx2xip9002qpa31juqegp2n	DEATH	Уход из жизни	Скончался в возрасте 75 лет. Похоронен: Северное кладбище, Минск.	2005-04-12 00:00:00	day	\N	2026-06-02 20:17:55.427	2026-06-02 20:17:55.444	\N	\N	\N
cmpx2xj290036pa31txoooknn	cmpx2xj250034pa31qaqm5vpx	cmpx2xj2k003apa31pa2och9n	BIRTH	Рождение	Рождение в г./д. г. Минск.	1934-11-02 00:00:00	day	\N	2026-06-02 20:17:55.906	2026-06-02 20:17:55.92	\N	\N	\N
cmpx2xj2d0038pa31dilgfusy	cmpx2xj250034pa31qaqm5vpx	cmpx2xj2k003apa31pa2och9n	DEATH	Уход из жизни	Скончался в возрасте 77 лет. Похоронен: Северное кладбище, Минск.	2011-08-30 00:00:00	day	\N	2026-06-02 20:17:55.91	2026-06-02 20:17:55.92	\N	\N	\N
cmpx2xjx5003qpa31axpicthn	cmpx2xjx3003opa31s9w5wl6k	cmpx2xjxc003upa31fccp1k9c	BIRTH	Рождение	Рождение в г./д. д. Любань.	1933-04-15 00:00:00	day	\N	2026-06-02 20:17:57.017	2026-06-02 20:17:57.027	\N	\N	\N
cmpx2xjx7003spa31u0si1xdw	cmpx2xjx3003opa31s9w5wl6k	cmpx2xjxc003upa31fccp1k9c	DEATH	Уход из жизни	Скончался в возрасте 79 лет. Похоронен: Мазуринское кладбище, Витебск.	2012-05-20 00:00:00	day	\N	2026-06-02 20:17:57.02	2026-06-02 20:17:57.027	\N	\N	\N
cmpx2xkb6004apa311i6zuerm	cmpx2xkb10048pa31wmm679bp	cmpx2xkbh004epa31iy4ced9x	BIRTH	Рождение	Рождение в г./д. г. Витебск.	1928-10-12 00:00:00	day	\N	2026-06-02 20:17:57.522	2026-06-02 20:17:57.537	\N	\N	\N
cmpx2xkba004cpa31d4gybdb0	cmpx2xkb10048pa31wmm679bp	cmpx2xkbh004epa31iy4ced9x	DEATH	Уход из жизни	Скончался в возрасте 70 лет. Похоронен: Мазуринское кладбище, Витебск.	1998-03-03 00:00:00	day	\N	2026-06-02 20:17:57.526	2026-06-02 20:17:57.537	\N	\N	\N
cmpx2xl3g004upa31stomuijz	cmpx2xl3c004spa318jb9kmbp	cmpx2xl3r004ypa311s8qsdgx	BIRTH	Рождение	Рождение в г./д. г. Гомель.	1932-08-11 00:00:00	day	\N	2026-06-02 20:17:58.54	2026-06-02 20:17:58.556	\N	\N	\N
cmpx2xl3j004wpa31zhks1qb2	cmpx2xl3c004spa318jb9kmbp	cmpx2xl3r004ypa311s8qsdgx	DEATH	Уход из жизни	Скончался в возрасте 77 лет. Похоронен: Рандовское кладбище, Гомель.	2009-02-14 00:00:00	day	\N	2026-06-02 20:17:58.543	2026-06-02 20:17:58.556	\N	\N	\N
cmpx2xnvt005epa31lsahqkb5	cmpx2xnvp005cpa31z8si8w9z	cmpx2xnw2005ipa31e96ccnjl	BIRTH	Рождение	Рождение в г./д. г. Рогачев.	1937-05-05 00:00:00	day	\N	2026-06-02 20:18:02.153	2026-06-02 20:18:02.202	\N	\N	\N
cmpx2xnvw005gpa31f81ajgki	cmpx2xnvp005cpa31z8si8w9z	cmpx2xnw2005ipa31e96ccnjl	DEATH	Уход из жизни	Скончался в возрасте 78 лет. Похоронен: Рандовское кладбище, Гомель.	2015-10-25 00:00:00	day	\N	2026-06-02 20:18:02.156	2026-06-02 20:18:02.202	\N	\N	\N
cmpx2xrea005ypa31brufzatj	cmpx2xre7005wpa31hkg7y3rp	cmpx2xrei0062pa31ydtahh3c	BIRTH	Рождение	Рождение в г./д. г. Гомель.	1936-07-07 00:00:00	day	\N	2026-06-02 20:18:06.707	2026-06-02 20:18:06.719	\N	\N	\N
cmpx2xred0060pa31dizb05uj	cmpx2xre7005wpa31hkg7y3rp	cmpx2xrei0062pa31ydtahh3c	DEATH	Уход из жизни	Скончался в возрасте 82 лет. Похоронен: Восточное кладбище, Минск.	2018-09-12 00:00:00	day	\N	2026-06-02 20:18:06.709	2026-06-02 20:18:06.719	\N	\N	\N
cmpx2xry6006ipa31g4jlor5d	cmpx2xry0006gpa31molq0rsx	cmpx2xryk006mpa31rcd7p69t	BIRTH	Рождение	Рождение в г./д. г. Могилев.	1931-12-12 00:00:00	day	\N	2026-06-02 20:18:07.422	2026-06-02 20:18:07.441	\N	\N	\N
cmpx2xryc006kpa31x8d7vge8	cmpx2xry0006gpa31molq0rsx	cmpx2xryk006mpa31rcd7p69t	DEATH	Уход из жизни	Скончался в возрасте 76 лет. Похоронен: Восточное кладбище, Минск.	2007-06-18 00:00:00	day	\N	2026-06-02 20:18:07.428	2026-06-02 20:18:07.441	\N	\N	\N
cmpx2xsdw0072pa312k2w4v9w	cmpx2xsds0070pa31dqmj70bn	cmpx2xse70076pa317acy2jvv	BIRTH	Рождение	Рождение в г./д. г. Минск.	1955-02-18 00:00:00	day	\N	2026-06-02 20:18:07.988	2026-06-02 20:18:08.003	\N	\N	\N
cmpx2xse00074pa314yuhhx3a	cmpx2xsds0070pa31dqmj70bn	cmpx2xse70076pa317acy2jvv	DEATH	Уход из жизни	Скончался в возрасте 65 лет. Похоронен: Чижовское кладбище, Минск.	2020-03-14 00:00:00	day	\N	2026-06-02 20:18:07.992	2026-06-02 20:18:08.003	\N	\N	\N
cmpx2xsrs007mpa31o8m5nuw8	cmpx2xsrp007kpa31rzgjqohm	cmpx2xss1007qpa31g0pnr9xz	BIRTH	Рождение	Рождение в г./д. г. Слуцк.	1957-04-20 00:00:00	day	\N	2026-06-02 20:18:08.488	2026-06-02 20:18:08.502	\N	\N	\N
cmpx2xsru007opa317s551jzi	cmpx2xsrp007kpa31rzgjqohm	cmpx2xss1007qpa31g0pnr9xz	DEATH	Уход из жизни	Скончался в возрасте 62 лет. Похоронен: Чижовское кладбище, Минск.	2019-11-22 00:00:00	day	\N	2026-06-02 20:18:08.49	2026-06-02 20:18:08.502	\N	\N	\N
cmpx2xtla0086pa317vevrdrz	cmpx2xtl50084pa315urz597a	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1958-09-08 00:00:00	day	\N	2026-06-02 20:18:09.55	2026-06-02 20:18:09.55	\N	\N	\N
cmpx2xtns008cpa3183giea79	cmpx2xtnp008apa31qxw4ep5t	\N	BIRTH	Рождение	Рождение в г./д. г. Гомель.	1956-07-24 00:00:00	day	\N	2026-06-02 20:18:09.641	2026-06-02 20:18:09.641	\N	\N	\N
cmpx2xtqa008ipa311t0j9fo0	cmpx2xtq5008gpa31t17rvorr	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1959-11-12 00:00:00	day	\N	2026-06-02 20:18:09.73	2026-06-02 20:18:09.73	\N	\N	\N
cmpx2xtsi008opa31jxu29osb	cmpx2xtse008mpa31vb92295i	cmpx2xtsv008spa31g1884yos	BIRTH	Рождение	Рождение в г./д. г. Витебск.	1954-10-18 00:00:00	day	\N	2026-06-02 20:18:09.81	2026-06-02 20:18:09.829	\N	\N	\N
cmpx2xtsm008qpa31i25r87jp	cmpx2xtse008mpa31vb92295i	cmpx2xtsv008spa31g1884yos	DEATH	Уход из жизни	Скончался в возрасте 64 лет. Похоронен: Мазуринское кладбище, Витебск.	2018-05-05 00:00:00	day	\N	2026-06-02 20:18:09.814	2026-06-02 20:18:09.829	\N	\N	\N
cmpx2xux10098pa319y7aeiyu	cmpx2xuwv0096pa31jae2vnza	\N	BIRTH	Рождение	Рождение в г./д. г. Полоцк.	1956-03-30 00:00:00	day	\N	2026-06-02 20:18:11.269	2026-06-02 20:18:11.269	\N	\N	\N
cmpx2xv3s009epa31fkdvd7cq	cmpx2xv3n009cpa3139zcgqgp	cmpx2xv46009ipa3102vkt5sf	BIRTH	Рождение	Рождение в г./д. г. Минск.	1959-06-15 00:00:00	day	\N	2026-06-02 20:18:11.512	2026-06-02 20:18:11.531	\N	\N	\N
cmpx2xv3w009gpa31dbec9m4m	cmpx2xv3n009cpa3139zcgqgp	cmpx2xv46009ipa3102vkt5sf	DEATH	Уход из жизни	Скончался в возрасте 62 лет. Похоронен: Ново-Машековское кладбище, Могилев.	2021-12-08 00:00:00	day	\N	2026-06-02 20:18:11.517	2026-06-02 20:18:11.531	\N	\N	\N
cmpx2xw28009ypa31zaicusbe	cmpx2xw24009wpa31a3kklhkb	\N	BIRTH	Рождение	Рождение в г./д. г. Могилев.	1961-04-22 00:00:00	day	\N	2026-06-02 20:18:12.752	2026-06-02 20:18:12.752	\N	\N	\N
cmpx2xwhi00a4pa310dxjz794	cmpx2xwhf00a2pa31wwd77ols	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1980-03-12 00:00:00	day	\N	2026-06-02 20:18:13.302	2026-06-02 20:18:13.302	\N	\N	\N
cmpx2xwlr00aapa31c2782uuk	cmpx2xwln00a8pa3168l6xlvs	\N	BIRTH	Рождение	Рождение в г./д. г. Гродно.	1982-08-15 00:00:00	day	\N	2026-06-02 20:18:13.455	2026-06-02 20:18:13.455	\N	\N	\N
cmpx2xwsy00agpa31jy0xzbuh	cmpx2xwsu00aepa31sitxcgq6	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1985-10-20 00:00:00	day	\N	2026-06-02 20:18:13.715	2026-06-02 20:18:13.715	\N	\N	\N
cmpx2xwwa00ampa31xrjlh4mh	cmpx2xww600akpa31gpd8z6ib	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1981-11-05 00:00:00	day	\N	2026-06-02 20:18:13.835	2026-06-02 20:18:13.835	\N	\N	\N
cmpx2xx0m00aspa31jzwevyzt	cmpx2xx0g00aqpa319ibr5n6w	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1984-06-12 00:00:00	day	\N	2026-06-02 20:18:13.99	2026-06-02 20:18:13.99	\N	\N	\N
cmpx2xxdw00aypa31eoflwyut	cmpx2xxdq00awpa314azjc638	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	1986-09-28 00:00:00	day	\N	2026-06-02 20:18:14.469	2026-06-02 20:18:14.469	\N	\N	\N
cmpx2xxi500b4pa31tb8j6yoi	cmpx2xxi000b2pa31ubuegkfj	\N	BIRTH	Рождение	Рождение в г./д. г. Витебск.	1979-05-18 00:00:00	day	\N	2026-06-02 20:18:14.621	2026-06-02 20:18:14.621	\N	\N	\N
cmpx2xxmt00bapa311d3kopko	cmpx2xxmp00b8pa31mbkqcvh1	\N	BIRTH	Рождение	Рождение в г./д. г. Витебск.	1983-12-25 00:00:00	day	\N	2026-06-02 20:18:14.789	2026-06-02 20:18:14.789	\N	\N	\N
cmpx2xxq200bgpa31fstzqxfz	cmpx2xxpx00bepa31cpmc0501	\N	BIRTH	Рождение	Рождение в г./д. г. Могилев.	1982-02-14 00:00:00	day	\N	2026-06-02 20:18:14.907	2026-06-02 20:18:14.907	\N	\N	\N
cmpx2xy0t00bmpa31i14e6ole	cmpx2xy0p00bkpa31u0k28wyq	\N	BIRTH	Рождение	Рождение в г./д. г. Могилев.	1985-07-04 00:00:00	day	\N	2026-06-02 20:18:15.293	2026-06-02 20:18:15.293	\N	\N	\N
cmpx2xy4e00bspa31mdtpg3qq	cmpx2xy4a00bqpa31wfxozpid	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	2008-05-12 00:00:00	day	\N	2026-06-02 20:18:15.422	2026-06-02 20:18:15.422	\N	\N	\N
cmpx2xyb000bypa31jx6dym8m	cmpx2xyaw00bwpa31gfseg01a	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	2010-09-18 00:00:00	day	\N	2026-06-02 20:18:15.661	2026-06-02 20:18:15.661	\N	\N	\N
cmpx2xyjg00c4pa311a7ipicz	cmpx2xyja00c2pa31kbugw5k9	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	2012-11-04 00:00:00	day	\N	2026-06-02 20:18:15.964	2026-06-02 20:18:15.964	\N	\N	\N
cmpx2xyok00capa31giyq3ek7	cmpx2xyog00c8pa317t70rmie	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	2009-03-20 00:00:00	day	\N	2026-06-02 20:18:16.148	2026-06-02 20:18:16.148	\N	\N	\N
cmpx2xytb00cgpa31onn7iv67	cmpx2xyt600cepa31b9zcbs2o	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	2011-07-07 00:00:00	day	\N	2026-06-02 20:18:16.319	2026-06-02 20:18:16.319	\N	\N	\N
cmpx2xyze00cmpa31ywggkfi1	cmpx2xyza00ckpa31k7x59dbe	\N	BIRTH	Рождение	Рождение в г./д. г. Минск.	2013-10-18 00:00:00	day	\N	2026-06-02 20:18:16.538	2026-06-02 20:18:16.538	\N	\N	\N
cmpx2xz6s00cspa319n4iwtgm	cmpx2xz6o00cqpa31kzxr0z39	\N	BIRTH	Рождение	Рождение в г./д. г. Витебск.	2007-04-22 00:00:00	day	\N	2026-06-02 20:18:16.804	2026-06-02 20:18:16.804	\N	\N	\N
cmpx2xzcb00cypa31ynzvvegi	cmpx2xzc700cwpa310spaux57	\N	BIRTH	Рождение	Рождение в г./д. г. Витебск.	2010-08-11 00:00:00	day	\N	2026-06-02 20:18:17.003	2026-06-02 20:18:17.003	\N	\N	\N
cmpx2xzg900d4pa31dlb4s1ib	cmpx2xzg600d2pa31dlpgc8qa	\N	BIRTH	Рождение	Рождение в г./д. г. Витебск.	2012-09-30 00:00:00	day	\N	2026-06-02 20:18:17.145	2026-06-02 20:18:17.145	\N	\N	\N
cmpx2xzmx00dapa31n4snwc34	cmpx2xzmt00d8pa314sl19pzn	\N	BIRTH	Рождение	Рождение в г./д. г. Могилев.	2009-02-14 00:00:00	day	\N	2026-06-02 20:18:17.385	2026-06-02 20:18:17.385	\N	\N	\N
cmpx2xzq900dgpa31e4ez2sre	cmpx2xzq600depa31fai1m84p	\N	BIRTH	Рождение	Рождение в г./д. г. Могилев.	2010-06-12 00:00:00	day	\N	2026-06-02 20:18:17.505	2026-06-02 20:18:17.505	\N	\N	\N
cmpx2xzuv00dmpa31ktlcbds3	cmpx2xzuq00dkpa31i2k2o86o	\N	BIRTH	Рождение	Рождение в г./д. г. Могилев.	2012-12-25 00:00:00	day	\N	2026-06-02 20:18:17.671	2026-06-02 20:18:17.671	\N	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", "displayName", role, "telegramId", "createdAt", "updatedAt", "lastSeenAt", "legacyInactivityDays", "acceptedTermsAt", "acceptedTermsIp", "jwtVersion") FROM stdin;
cmpvm2avm0000qz36l57c1d7z	admin@admin.local	100000:c311cba939369047011b4696c4666684:7c8f8199f6c779c78829450a97ed2faef65aa592d7dfbf8eee04a5cb572c0e0e4386635fe76644d7ca2bd44d255566fc1ed9504af297276ccf95c8970ff67d1a	admin	ADMIN	\N	2026-06-01 19:37:58.931	2026-06-10 18:19:38.59	2026-06-10 18:19:38.586	90	2026-06-01 19:37:58.665	\N	6
cmq71zgnw000amx2ya6y63i6f	ivan@example.com	100000:3b728cccaa4102fac41467d52c14bfdc:f0d8c04e573c4a0a67d015229357d8fbd5c226e2062d6bd519c4443a4697efe8db286871762a7008a6d37e691c04bbdb21744728e82dca62d5c2516801ae5737	Ivan	USER	\N	2026-06-09 19:49:08.251	2026-06-09 20:13:02.562	2026-06-09 20:08:39.654	90	2026-06-09 19:49:08.243	172.18.0.1	1
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
91b71023-8628-4433-88c6-3c311d906ed2	782fc36b5cfe843ffc31475baa7d610504a5f96cf8b5c3c15aab46e472ae0b08	2026-06-01 19:26:57.058696+00	20260525161315_init	\N	\N	2026-06-01 19:26:38.622536+00	1
4acf5fb5-1585-44b5-8bcf-028c16782fa7	f260182cbdf3120a9ea270f9ed37b80b4d423384672054cf1c9fcadb6b668729	2026-06-01 19:27:12.973723+00	20260527214314_add_dispute_duplicate_of_profile_id	\N	\N	2026-06-01 19:27:12.496089+00	1
60a722ef-233a-4703-8f01-bfc6234f0878	300c323fa9f2c8cbc9661996e7d5cf1e32bcaa322e7f3656c9a1bfd342be21b7	2026-06-01 19:26:58.202024+00	20260525163944_add_family_clan	\N	\N	2026-06-01 19:26:57.191976+00	1
670969a8-4fe9-42db-82e6-3b4e361f4410	b43dbb296eedae7e6f83b69fd7ee45d79acf6ffae55b9fe762db2e349b00f383	2026-06-01 19:27:00.268272+00	20260525222700_add_profile_search_vector	\N	\N	2026-06-01 19:26:58.266401+00	1
c3e3f900-2de6-4f89-a218-4bb71173df53	0b51addc827c5d24dd4f63b98f9381474d847dfe5d1739bc9e57626e0a96042f	2026-06-01 19:27:00.59457+00	20260526103015_add_profile_access_code_cascade	\N	\N	2026-06-01 19:27:00.335099+00	1
f33a5cee-292a-4269-af31-19798cb47cab	9915906f2d5b74280690e0fc72258ac029d6bb74fb5357b406ee72f698e3c098	2026-06-01 19:27:14.3554+00	20260528000000_add_tg_login_token	\N	\N	2026-06-01 19:27:13.065566+00	1
668bf618-0ae3-4da0-8e72-969997e112b2	3f7679d514c29df8df4cfced8357ed064bea2843a4ad8bc553a3c3a6c218aa81	2026-06-01 19:27:01.105811+00	20260526103200_add_profile_soft_delete	\N	\N	2026-06-01 19:27:00.650382+00	1
5e8bd93e-b4b7-4e58-8b77-a5ad1c44f6fb	eba441ce09300828340fcacdf6e785dbb0ca4aa267fea81611437a0f9fde57f8	2026-06-01 19:27:02.07804+00	20260526170400_add_historical_to_timeline	\N	\N	2026-06-01 19:27:01.211545+00	1
75baa50e-5fb7-498f-a0ef-b691a7cb2360	85343ba1295a94765c4474c6e7a306ea643e26ba87629453d5b5223e25457e41	2026-06-01 19:27:03.537437+00	20260526175038_add_audit_log	\N	\N	2026-06-01 19:27:02.16198+00	1
db6d6da2-86a9-4ebd-89e7-ac75f2251b3d	6406aefb33c053ec010ee905701eaeec729877ebbb9ba0b9d936afa0e40a2c08	2026-06-01 19:27:14.603579+00	20260528010000_add_user_jwt_version	\N	\N	2026-06-01 19:27:14.409511+00	1
c6e2f971-4bd1-48f0-a00f-6524e8577ffb	1c098ad32e1002258cd386a8f6ac491db1337c3923c264fda3cd17cf08847d57	2026-06-01 19:27:03.837453+00	20260527122041_add_audit_actions_timeline_tree_update	\N	\N	2026-06-01 19:27:03.644665+00	1
16ebfe75-3189-4024-b6b2-4c2c7460350c	b0bd359bfef0e590fff0ef9a723a4989cfb499fff93501c9c1ee6155d87d8a14	2026-06-01 19:27:04.312944+00	20260527122947_add_audit_actions_access	\N	\N	2026-06-01 19:27:03.917992+00	1
b74ace86-b186-48ed-be4e-c33af04a42f7	5d9e2b143d4686695d3782c9f0d45a130de5b44d578179311e02683b02614e78	2026-06-01 19:27:05.436404+00	20260527160000_add_password_reset_token	\N	\N	2026-06-01 19:27:04.403162+00	1
d1ec6b26-4bba-4146-acdb-c44b89ecc5cc	f50980e5d7c968c2a08bf151ac2a49e26607b406fcb5cfd253b2d3824d400551	2026-06-01 19:27:11.805383+00	20260527181625_add_disputes_merge_legacy_contact	\N	\N	2026-06-01 19:27:05.478764+00	1
7ca68ba2-147f-4c55-9d52-3190ef4fb23a	716e95a43d019ce36a828517fb2a8ec4a4f4598eba9a3231aad59b95fd8b1248	2026-06-01 19:27:12.163535+00	20260527195249_add_legacy_claim_expire_audit_action	\N	\N	2026-06-01 19:27:11.930915+00	1
cac91909-3e08-4ed6-abf4-30f92bc64ceb	8f505c760d449903854037364dedb57abbb16dfc1adde4f01db3fe9ae36d93cb	2026-06-01 19:27:12.431925+00	20260527200000_add_accepted_terms_at	\N	\N	2026-06-01 19:27:12.246974+00	1
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CandleLight CandleLight_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandleLight"
    ADD CONSTRAINT "CandleLight_pkey" PRIMARY KEY (id);


--
-- Name: ContentBlock ContentBlock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContentBlock"
    ADD CONSTRAINT "ContentBlock_pkey" PRIMARY KEY (id);


--
-- Name: FamilyClan FamilyClan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyClan"
    ADD CONSTRAINT "FamilyClan_pkey" PRIMARY KEY (id);


--
-- Name: FamilyConnection FamilyConnection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyConnection"
    ADD CONSTRAINT "FamilyConnection_pkey" PRIMARY KEY (id);


--
-- Name: FamilyNode FamilyNode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyNode"
    ADD CONSTRAINT "FamilyNode_pkey" PRIMARY KEY (id);


--
-- Name: FamilyTree FamilyTree_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyTree"
    ADD CONSTRAINT "FamilyTree_pkey" PRIMARY KEY (id);


--
-- Name: GalleryItem GalleryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryItem"
    ADD CONSTRAINT "GalleryItem_pkey" PRIMARY KEY (id);


--
-- Name: GuestMemory GuestMemory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestMemory"
    ADD CONSTRAINT "GuestMemory_pkey" PRIMARY KEY (id);


--
-- Name: LegacyClaim LegacyClaim_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegacyClaim"
    ADD CONSTRAINT "LegacyClaim_pkey" PRIMARY KEY (id);


--
-- Name: LegacyContact LegacyContact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegacyContact"
    ADD CONSTRAINT "LegacyContact_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_tokenHash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_tokenHash_key" UNIQUE ("tokenHash");


--
-- Name: ProfileAccessCode ProfileAccessCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileAccessCode"
    ADD CONSTRAINT "ProfileAccessCode_pkey" PRIMARY KEY (id);


--
-- Name: ProfileAccess ProfileAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileAccess"
    ADD CONSTRAINT "ProfileAccess_pkey" PRIMARY KEY (id);


--
-- Name: ProfileDispute ProfileDispute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileDispute"
    ADD CONSTRAINT "ProfileDispute_pkey" PRIMARY KEY (id);


--
-- Name: ProfileMergeRequest ProfileMergeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileMergeRequest"
    ADD CONSTRAINT "ProfileMergeRequest_pkey" PRIMARY KEY (id);


--
-- Name: Profile Profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_pkey" PRIMARY KEY (id);


--
-- Name: QrPlaque QrPlaque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QrPlaque"
    ADD CONSTRAINT "QrPlaque_pkey" PRIMARY KEY (id);


--
-- Name: TgLoginToken TgLoginToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TgLoginToken"
    ADD CONSTRAINT "TgLoginToken_pkey" PRIMARY KEY (id);


--
-- Name: TimelineEvent TimelineEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_action_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_createdAt_idx" ON public."AuditLog" USING btree (action, "createdAt");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: AuditLog_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_createdAt_idx" ON public."AuditLog" USING btree ("userId", "createdAt");


--
-- Name: CandleLight_fingerprint_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandleLight_fingerprint_createdAt_idx" ON public."CandleLight" USING btree (fingerprint, "createdAt");


--
-- Name: CandleLight_profileId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandleLight_profileId_createdAt_idx" ON public."CandleLight" USING btree ("profileId", "createdAt");


--
-- Name: CandleLight_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CandleLight_userId_idx" ON public."CandleLight" USING btree ("userId");


--
-- Name: ContentBlock_profileId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContentBlock_profileId_order_key" ON public."ContentBlock" USING btree ("profileId", "order");


--
-- Name: ContentBlock_profileId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentBlock_profileId_type_idx" ON public."ContentBlock" USING btree ("profileId", type);


--
-- Name: FamilyClan_treeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FamilyClan_treeId_idx" ON public."FamilyClan" USING btree ("treeId");


--
-- Name: FamilyClan_treeId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FamilyClan_treeId_name_key" ON public."FamilyClan" USING btree ("treeId", name);


--
-- Name: FamilyConnection_fromNodeId_toNodeId_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FamilyConnection_fromNodeId_toNodeId_type_key" ON public."FamilyConnection" USING btree ("fromNodeId", "toNodeId", type);


--
-- Name: FamilyConnection_fromNodeId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FamilyConnection_fromNodeId_type_idx" ON public."FamilyConnection" USING btree ("fromNodeId", type);


--
-- Name: FamilyConnection_toNodeId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FamilyConnection_toNodeId_type_idx" ON public."FamilyConnection" USING btree ("toNodeId", type);


--
-- Name: FamilyNode_lastName_firstName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FamilyNode_lastName_firstName_idx" ON public."FamilyNode" USING btree ("lastName", "firstName");


--
-- Name: FamilyNode_treeId_generation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FamilyNode_treeId_generation_idx" ON public."FamilyNode" USING btree ("treeId", generation);


--
-- Name: FamilyTree_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FamilyTree_ownerId_idx" ON public."FamilyTree" USING btree ("ownerId");


--
-- Name: GalleryItem_profileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GalleryItem_profileId_idx" ON public."GalleryItem" USING btree ("profileId");


--
-- Name: GalleryItem_profileId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GalleryItem_profileId_order_key" ON public."GalleryItem" USING btree ("profileId", "order");


--
-- Name: GuestMemory_authorUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GuestMemory_authorUserId_idx" ON public."GuestMemory" USING btree ("authorUserId");


--
-- Name: GuestMemory_profileId_isApproved_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GuestMemory_profileId_isApproved_idx" ON public."GuestMemory" USING btree ("profileId", "isApproved");


--
-- Name: LegacyClaim_claimantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyClaim_claimantId_idx" ON public."LegacyClaim" USING btree ("claimantId");


--
-- Name: LegacyClaim_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyClaim_expiresAt_idx" ON public."LegacyClaim" USING btree ("expiresAt");


--
-- Name: LegacyClaim_legacyContactId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyClaim_legacyContactId_idx" ON public."LegacyClaim" USING btree ("legacyContactId");


--
-- Name: LegacyClaim_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyClaim_status_idx" ON public."LegacyClaim" USING btree (status);


--
-- Name: LegacyContact_heirEmail_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyContact_heirEmail_idx" ON public."LegacyContact" USING btree ("heirEmail");


--
-- Name: LegacyContact_heirUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyContact_heirUserId_idx" ON public."LegacyContact" USING btree ("heirUserId");


--
-- Name: LegacyContact_inviteTokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LegacyContact_inviteTokenHash_key" ON public."LegacyContact" USING btree ("inviteTokenHash");


--
-- Name: LegacyContact_ownerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LegacyContact_ownerId_key" ON public."LegacyContact" USING btree ("ownerId");


--
-- Name: LegacyContact_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyContact_status_idx" ON public."LegacyContact" USING btree (status);


--
-- Name: LegacyContact_triggeredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegacyContact_triggeredAt_idx" ON public."LegacyContact" USING btree ("triggeredAt");


--
-- Name: Media_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Media_kind_idx" ON public."Media" USING btree (kind);


--
-- Name: Media_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Media_uploadedById_idx" ON public."Media" USING btree ("uploadedById");


--
-- Name: PasswordResetToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PasswordResetToken_expiresAt_idx" ON public."PasswordResetToken" USING btree ("expiresAt");


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


--
-- Name: ProfileAccessCode_profileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileAccessCode_profileId_idx" ON public."ProfileAccessCode" USING btree ("profileId");


--
-- Name: ProfileAccess_profileId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProfileAccess_profileId_userId_key" ON public."ProfileAccess" USING btree ("profileId", "userId");


--
-- Name: ProfileAccess_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileAccess_userId_idx" ON public."ProfileAccess" USING btree ("userId");


--
-- Name: ProfileDispute_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileDispute_createdAt_idx" ON public."ProfileDispute" USING btree ("createdAt");


--
-- Name: ProfileDispute_duplicateOfProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileDispute_duplicateOfProfileId_idx" ON public."ProfileDispute" USING btree ("duplicateOfProfileId");


--
-- Name: ProfileDispute_mergeRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProfileDispute_mergeRequestId_key" ON public."ProfileDispute" USING btree ("mergeRequestId");


--
-- Name: ProfileDispute_profileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileDispute_profileId_idx" ON public."ProfileDispute" USING btree ("profileId");


--
-- Name: ProfileDispute_reason_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileDispute_reason_idx" ON public."ProfileDispute" USING btree (reason);


--
-- Name: ProfileDispute_reporterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileDispute_reporterId_idx" ON public."ProfileDispute" USING btree ("reporterId");


--
-- Name: ProfileDispute_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileDispute_status_idx" ON public."ProfileDispute" USING btree (status);


--
-- Name: ProfileMergeRequest_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileMergeRequest_createdAt_idx" ON public."ProfileMergeRequest" USING btree ("createdAt");


--
-- Name: ProfileMergeRequest_requesterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileMergeRequest_requesterId_idx" ON public."ProfileMergeRequest" USING btree ("requesterId");


--
-- Name: ProfileMergeRequest_sourceProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileMergeRequest_sourceProfileId_idx" ON public."ProfileMergeRequest" USING btree ("sourceProfileId");


--
-- Name: ProfileMergeRequest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileMergeRequest_status_idx" ON public."ProfileMergeRequest" USING btree (status);


--
-- Name: ProfileMergeRequest_targetProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProfileMergeRequest_targetProfileId_idx" ON public."ProfileMergeRequest" USING btree ("targetProfileId");


--
-- Name: Profile_coverPhotoId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profile_coverPhotoId_key" ON public."Profile" USING btree ("coverPhotoId");


--
-- Name: Profile_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Profile_deletedAt_idx" ON public."Profile" USING btree ("deletedAt");


--
-- Name: Profile_familyNodeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profile_familyNodeId_key" ON public."Profile" USING btree ("familyNodeId");


--
-- Name: Profile_fullName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Profile_fullName_idx" ON public."Profile" USING btree ("fullName");


--
-- Name: Profile_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Profile_ownerId_idx" ON public."Profile" USING btree ("ownerId");


--
-- Name: Profile_searchVector_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Profile_searchVector_idx" ON public."Profile" USING gin ("searchVector");


--
-- Name: Profile_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profile_slug_key" ON public."Profile" USING btree (slug);


--
-- Name: Profile_visibility_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Profile_visibility_idx" ON public."Profile" USING btree (visibility);


--
-- Name: QrPlaque_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "QrPlaque_code_key" ON public."QrPlaque" USING btree (code);


--
-- Name: QrPlaque_profileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QrPlaque_profileId_idx" ON public."QrPlaque" USING btree ("profileId");


--
-- Name: TgLoginToken_status_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TgLoginToken_status_expiresAt_idx" ON public."TgLoginToken" USING btree (status, "expiresAt");


--
-- Name: TgLoginToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TgLoginToken_token_key" ON public."TgLoginToken" USING btree (token);


--
-- Name: TimelineEvent_category_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_category_date_idx" ON public."TimelineEvent" USING btree (category, date);


--
-- Name: TimelineEvent_createdById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_createdById_idx" ON public."TimelineEvent" USING btree ("createdById");


--
-- Name: TimelineEvent_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_deletedAt_idx" ON public."TimelineEvent" USING btree ("deletedAt");


--
-- Name: TimelineEvent_familyNodeId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_familyNodeId_date_idx" ON public."TimelineEvent" USING btree ("familyNodeId", date);


--
-- Name: TimelineEvent_profileId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_profileId_date_idx" ON public."TimelineEvent" USING btree ("profileId", date);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_telegramId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_telegramId_key" ON public."User" USING btree ("telegramId");


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CandleLight CandleLight_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandleLight"
    ADD CONSTRAINT "CandleLight_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CandleLight CandleLight_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CandleLight"
    ADD CONSTRAINT "CandleLight_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ContentBlock ContentBlock_photoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContentBlock"
    ADD CONSTRAINT "ContentBlock_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ContentBlock ContentBlock_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContentBlock"
    ADD CONSTRAINT "ContentBlock_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FamilyClan FamilyClan_treeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyClan"
    ADD CONSTRAINT "FamilyClan_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES public."FamilyTree"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FamilyConnection FamilyConnection_fromNodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyConnection"
    ADD CONSTRAINT "FamilyConnection_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES public."FamilyNode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FamilyConnection FamilyConnection_toNodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyConnection"
    ADD CONSTRAINT "FamilyConnection_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES public."FamilyNode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FamilyNode FamilyNode_clanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyNode"
    ADD CONSTRAINT "FamilyNode_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES public."FamilyClan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FamilyNode FamilyNode_photoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyNode"
    ADD CONSTRAINT "FamilyNode_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FamilyNode FamilyNode_treeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FamilyNode"
    ADD CONSTRAINT "FamilyNode_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES public."FamilyTree"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GalleryItem GalleryItem_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryItem"
    ADD CONSTRAINT "GalleryItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GalleryItem GalleryItem_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryItem"
    ADD CONSTRAINT "GalleryItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuestMemory GuestMemory_authorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestMemory"
    ADD CONSTRAINT "GuestMemory_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GuestMemory GuestMemory_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestMemory"
    ADD CONSTRAINT "GuestMemory_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GuestMemory GuestMemory_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestMemory"
    ADD CONSTRAINT "GuestMemory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LegacyClaim LegacyClaim_claimantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegacyClaim"
    ADD CONSTRAINT "LegacyClaim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LegacyClaim LegacyClaim_legacyContactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegacyClaim"
    ADD CONSTRAINT "LegacyClaim_legacyContactId_fkey" FOREIGN KEY ("legacyContactId") REFERENCES public."LegacyContact"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LegacyContact LegacyContact_heirUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegacyContact"
    ADD CONSTRAINT "LegacyContact_heirUserId_fkey" FOREIGN KEY ("heirUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LegacyContact LegacyContact_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegacyContact"
    ADD CONSTRAINT "LegacyContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileAccessCode ProfileAccessCode_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileAccessCode"
    ADD CONSTRAINT "ProfileAccessCode_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileAccess ProfileAccess_grantedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileAccess"
    ADD CONSTRAINT "ProfileAccess_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProfileAccess ProfileAccess_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileAccess"
    ADD CONSTRAINT "ProfileAccess_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileAccess ProfileAccess_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileAccess"
    ADD CONSTRAINT "ProfileAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileDispute ProfileDispute_duplicateOfProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileDispute"
    ADD CONSTRAINT "ProfileDispute_duplicateOfProfileId_fkey" FOREIGN KEY ("duplicateOfProfileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProfileDispute ProfileDispute_mergeRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileDispute"
    ADD CONSTRAINT "ProfileDispute_mergeRequestId_fkey" FOREIGN KEY ("mergeRequestId") REFERENCES public."ProfileMergeRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProfileDispute ProfileDispute_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileDispute"
    ADD CONSTRAINT "ProfileDispute_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileDispute ProfileDispute_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileDispute"
    ADD CONSTRAINT "ProfileDispute_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileMergeRequest ProfileMergeRequest_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileMergeRequest"
    ADD CONSTRAINT "ProfileMergeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileMergeRequest ProfileMergeRequest_sourceProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileMergeRequest"
    ADD CONSTRAINT "ProfileMergeRequest_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileMergeRequest ProfileMergeRequest_targetProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileMergeRequest"
    ADD CONSTRAINT "ProfileMergeRequest_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Profile Profile_coverPhotoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Profile Profile_familyNodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_familyNodeId_fkey" FOREIGN KEY ("familyNodeId") REFERENCES public."FamilyNode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Profile Profile_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profile"
    ADD CONSTRAINT "Profile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QrPlaque QrPlaque_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QrPlaque"
    ADD CONSTRAINT "QrPlaque_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TgLoginToken TgLoginToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TgLoginToken"
    ADD CONSTRAINT "TgLoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TimelineEvent TimelineEvent_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TimelineEvent TimelineEvent_familyNodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_familyNodeId_fkey" FOREIGN KEY ("familyNodeId") REFERENCES public."FamilyNode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TimelineEvent TimelineEvent_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."Profile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OpJ0KQ1yXnyG0khTPHSpmfPDpKHAX6ZghtZc8Qo8s2VLYEKIwkg2qSQSfA0DwG8

