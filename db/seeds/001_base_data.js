"use strict";

const bcrypt = require("bcrypt");
const PASSWORD_HASH = bcrypt.hashSync("Checkpoint1!", 10);

const ORG_ACME   = "a1000000-0000-4000-8000-000000000001";
const ORG_BEIRUT = "a2000000-0000-4000-8000-000000000002";

const USR_ACME_ADMIN = "b1000000-0000-4000-8000-000000000001";
const USR_ACME_MEM1  = "b2000000-0000-4000-8000-000000000002";
const USR_ACME_MEM2  = "b3000000-0000-4000-8000-000000000003";
const USR_BEI_ADMIN  = "b4000000-0000-4000-8000-000000000004";
const USR_BEI_MEM1   = "b5000000-0000-4000-8000-000000000005";

const PRJ_ACME_1 = "c1000000-0000-4000-8000-000000000001";
const PRJ_ACME_2 = "c2000000-0000-4000-8000-000000000002";
const PRJ_BEI_1  = "c3000000-0000-4000-8000-000000000003";
const PRJ_BEI_2  = "c4000000-0000-4000-8000-000000000004";

const NOW = new Date().toISOString();

function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
}

const organizations = [
  { id: ORG_ACME,   name: "Acme Consulting",  slug: "acme",            created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: ORG_BEIRUT, name: "Beirut Builders",  slug: "beirut-builders", created_at: NOW, updated_at: NOW, deleted_at: null },
];

const users = [
  { id: USR_ACME_ADMIN, organization_id: ORG_ACME,   email: "layla.hassan@acme.example",              first_name: "Layla",  last_name: "Hassan",  password_hash: PASSWORD_HASH, role: "admin",  created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: USR_ACME_MEM1,  organization_id: ORG_ACME,   email: "omar.farouk@acme.example",               first_name: "Omar",   last_name: "Farouk",  password_hash: PASSWORD_HASH, role: "member", created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: USR_ACME_MEM2,  organization_id: ORG_ACME,   email: "priya.nair@acme.example",                first_name: "Priya",  last_name: "Nair",    password_hash: PASSWORD_HASH, role: "member", created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: USR_BEI_ADMIN,  organization_id: ORG_BEIRUT, email: "kareem.mansour@beirut-builders.example", first_name: "Kareem", last_name: "Mansour", password_hash: PASSWORD_HASH, role: "admin",  created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: USR_BEI_MEM1,   organization_id: ORG_BEIRUT, email: "nadia.khalil@beirut-builders.example",   first_name: "Nadia",  last_name: "Khalil",  password_hash: PASSWORD_HASH, role: "member", created_at: NOW, updated_at: NOW, deleted_at: null },
];

const projects = [
  { id: PRJ_ACME_1, organization_id: ORG_ACME,   owner_id: USR_ACME_ADMIN, name: "Client Portal Redesign",        description: "Redesign the self-service client portal for Q3 launch.", status: "active", created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: PRJ_ACME_2, organization_id: ORG_ACME,   owner_id: USR_ACME_ADMIN, name: "Internal Reporting Dashboard",  description: "Build an executive dashboard for KPI tracking.",          status: "active", created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: PRJ_BEI_1,  organization_id: ORG_BEIRUT, owner_id: USR_BEI_ADMIN,  name: "Hamra Tower - Phase 1",         description: "Foundation and structural work for the Hamra Tower.",      status: "active", created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: PRJ_BEI_2,  organization_id: ORG_BEIRUT, owner_id: USR_BEI_ADMIN,  name: "Verdun Renovation",             description: "Heritage renovation of the Verdun commercial block.",       status: "active", created_at: NOW, updated_at: NOW, deleted_at: null },
];

const tasks = [
  { id: "d1000000-0000-4000-8000-000000000001", organization_id: ORG_ACME,   project_id: PRJ_ACME_1, title: "Audit current portal UX",                        status: "done",        priority: "high",   assigned_to: USR_ACME_MEM1,  created_by: USR_ACME_ADMIN, due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d2000000-0000-4000-8000-000000000002", organization_id: ORG_ACME,   project_id: PRJ_ACME_1, title: "Create wireframes for redesigned dashboard",      status: "done",        priority: "high",   assigned_to: USR_ACME_MEM2,  created_by: USR_ACME_ADMIN, due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d3000000-0000-4000-8000-000000000003", organization_id: ORG_ACME,   project_id: PRJ_ACME_1, title: "Implement new authentication flow",               status: "in_progress", priority: "high",   assigned_to: USR_ACME_MEM1,  created_by: USR_ACME_ADMIN, due_date: daysFromNow(5), created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d4000000-0000-4000-8000-000000000004", organization_id: ORG_ACME,   project_id: PRJ_ACME_1, title: "Migrate client documents to new storage layer",   status: "in_progress", priority: "medium", assigned_to: null,           created_by: USR_ACME_ADMIN, due_date: daysFromNow(10),created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d5000000-0000-4000-8000-000000000005", organization_id: ORG_ACME,   project_id: PRJ_ACME_1, title: "Write end-to-end tests for portal checkout",     status: "todo",        priority: "medium", assigned_to: null,           created_by: USR_ACME_ADMIN, due_date: daysFromNow(14),created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d6000000-0000-4000-8000-000000000006", organization_id: ORG_ACME,   project_id: PRJ_ACME_2, title: "Define KPI requirements with stakeholders",       status: "done",        priority: "high",   assigned_to: USR_ACME_ADMIN, created_by: USR_ACME_ADMIN, due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d7000000-0000-4000-8000-000000000007", organization_id: ORG_ACME,   project_id: PRJ_ACME_2, title: "Set up data pipeline from Postgres to analytics", status: "in_progress", priority: "high",   assigned_to: USR_ACME_MEM1,  created_by: USR_ACME_ADMIN, due_date: daysFromNow(7), created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d8000000-0000-4000-8000-000000000008", organization_id: ORG_ACME,   project_id: PRJ_ACME_2, title: "Build revenue by region chart component",         status: "in_progress", priority: "medium", assigned_to: USR_ACME_MEM2,  created_by: USR_ACME_ADMIN, due_date: daysFromNow(9), created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d9000000-0000-4000-8000-000000000009", organization_id: ORG_ACME,   project_id: PRJ_ACME_2, title: "Add role-based access control to dashboard",      status: "todo",        priority: "medium", assigned_to: USR_ACME_ADMIN, created_by: USR_ACME_ADMIN, due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d0000000-0000-4000-8000-000000000010", organization_id: ORG_ACME,   project_id: PRJ_ACME_2, title: "Schedule automated weekly report emails",         status: "todo",        priority: "low",    assigned_to: null,           created_by: USR_ACME_ADMIN, due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d1000000-0000-4000-8000-000000000011", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_1,  title: "Complete soil survey and geotechnical report",    status: "done",        priority: "high",   assigned_to: USR_BEI_ADMIN,  created_by: USR_BEI_ADMIN,  due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d2000000-0000-4000-8000-000000000012", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_1,  title: "Pour concrete for foundation slab east wing",     status: "in_progress", priority: "high",   assigned_to: USR_BEI_MEM1,   created_by: USR_BEI_ADMIN,  due_date: daysFromNow(3), created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d3000000-0000-4000-8000-000000000013", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_1,  title: "Procure rebar and structural steel floors 1-4",   status: "in_progress", priority: "medium", assigned_to: USR_BEI_ADMIN,  created_by: USR_BEI_ADMIN,  due_date: daysFromNow(6), created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d4000000-0000-4000-8000-000000000014", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_1,  title: "Submit architectural drawings to municipality",   status: "todo",        priority: "medium", assigned_to: USR_BEI_ADMIN,  created_by: USR_BEI_ADMIN,  due_date: daysFromNow(12),created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d5000000-0000-4000-8000-000000000015", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_1,  title: "Coordinate crane rental and safety briefing",     status: "todo",        priority: "low",    assigned_to: null,           created_by: USR_BEI_ADMIN,  due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d6000000-0000-4000-8000-000000000016", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_2,  title: "Document facade conditions with photogrammetry",  status: "done",        priority: "medium", assigned_to: USR_BEI_MEM1,   created_by: USR_BEI_ADMIN,  due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d7000000-0000-4000-8000-000000000017", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_2,  title: "Strip interior finishes and hazmat abatement",   status: "in_progress", priority: "high",   assigned_to: USR_BEI_MEM1,   created_by: USR_BEI_ADMIN,  due_date: daysFromNow(4), created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d8000000-0000-4000-8000-000000000018", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_2,  title: "Restore Ottoman-era stonework on ground floor",   status: "todo",        priority: "low",    assigned_to: USR_BEI_ADMIN,  created_by: USR_BEI_ADMIN,  due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d9000000-0000-4000-8000-000000000019", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_2,  title: "Install electrical conduit and panel floors 1-3", status: "todo",        priority: "medium", assigned_to: null,           created_by: USR_BEI_ADMIN,  due_date: daysFromNow(11),created_at: NOW, updated_at: NOW, deleted_at: null },
  { id: "d0000000-0000-4000-8000-000000000020", organization_id: ORG_BEIRUT, project_id: PRJ_BEI_2,  title: "Prepare snag list and final inspection checklist",status: "todo",        priority: "low",    assigned_to: null,           created_by: USR_BEI_ADMIN,  due_date: null,           created_at: NOW, updated_at: NOW, deleted_at: null },
];

exports.seed = async function seed(knex) {
  await knex.transaction(async (trx) => {
    await trx("tasks").del();
    await trx("projects").del();
    await trx("users").del();
    await trx("organizations").del();
    await trx("organizations").insert(organizations);
    await trx("users").insert(users);
    await trx("projects").insert(projects);
    await trx("tasks").insert(tasks);
  });
};
