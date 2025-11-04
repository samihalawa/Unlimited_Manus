const fs = require('fs').promises;
const path = require('path');
const { getDirpath } = require('@src/utils/electron');

const PLAN_CACHE_DIR = getDirpath('Caches/plan');

const ensureDirectory = async () => {
  try {
    await fs.mkdir(PLAN_CACHE_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const resolvePlanPath = (conversationId) => {
  if (!conversationId) {
    throw new Error('conversation_id is required to persist plan state.');
  }
  return path.join(PLAN_CACHE_DIR, `${conversationId}.json`);
};

const readPlanFile = async (conversationId) => {
  await ensureDirectory();
  const filepath = resolvePlanPath(conversationId);
  try {
    const raw = await fs.readFile(filepath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const writePlanFile = async (conversationId, data) => {
  await ensureDirectory();
  const filepath = resolvePlanPath(conversationId);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
};

const normalisePhaseStatus = (status) => {
  if (status === 'running' || status === 'in_progress') {
    return 'running';
  }
  if (status === 'completed' || status === 'success' || status === 'done') {
    return 'completed';
  }
  return 'pending';
};

const initialisePhases = (phases = [], activePhaseId) => {
  const activeIndex = phases.findIndex(phase => phase.id === activePhaseId);
  return phases.map((phase, index) => {
    let status = 'pending';
    if (activeIndex === -1) {
      status = index === 0 ? 'running' : 'pending';
    } else if (index < activeIndex) {
      status = 'completed';
    } else if (index === activeIndex) {
      status = 'running';
    }
    return {
      id: phase.id,
      title: phase.title,
      capabilities: phase.capabilities || {},
      status,
    };
  });
};

const ensureSequentialAdvance = (phases = [], currentId, nextId) => {
  const currentIndex = phases.findIndex(phase => phase.id === currentId);
  if (currentIndex === -1) {
    throw new Error(`Current phase ${currentId} not found in existing plan.`);
  }
  const nextIndex = phases.findIndex(phase => phase.id === nextId);
  if (nextIndex === -1) {
    throw new Error(`Next phase ${nextId} not found in existing plan.`);
  }
  if (nextIndex !== currentIndex + 1) {
    throw new Error('next_phase_id must be the sequential phase following current_phase_id.');
  }
  return { currentIndex, nextIndex };
};

const updatePlan = async (conversationId, { goal, phases, current_phase_id }) => {
  if (!goal || typeof goal !== 'string') {
    throw new Error('goal must be a non-empty string.');
  }
  if (!Array.isArray(phases) || phases.length === 0) {
    throw new Error('phases must be a non-empty array.');
  }

  const normalisedPhases = phases.map((phase, index) => {
    if (typeof phase.id !== 'number' && typeof phase.id !== 'string') {
      throw new Error(`Phase at index ${index} is missing a valid id.`);
    }
    if (!phase.title || typeof phase.title !== 'string') {
      throw new Error(`Phase at index ${index} requires a title.`);
    }
    return {
      id: phase.id,
      title: phase.title,
      capabilities: phase.capabilities || {},
      status: normalisePhaseStatus(phase.status),
    };
  });

  const activePhaseId = current_phase_id ?? (normalisedPhases[0] && normalisedPhases[0].id);
  const phasesWithStatus = initialisePhases(normalisedPhases, activePhaseId);
  const resolvedActiveId = phasesWithStatus.find(phase => phase.status === 'running')
    ? phasesWithStatus.find(phase => phase.status === 'running').id
    : (phasesWithStatus[0] ? phasesWithStatus[0].id : null);

  const plan = {
    goal,
    phases: phasesWithStatus,
    current_phase_id: resolvedActiveId,
    updated_at: new Date().toISOString(),
  };

  await writePlanFile(conversationId, plan);
  return plan;
};

const advancePlan = async (conversationId, { current_phase_id, next_phase_id }) => {
  const existing = await readPlanFile(conversationId);
  if (!existing) {
    throw new Error('No existing plan found. Use the update action first.');
  }
  const { phases } = existing;
  const { currentIndex, nextIndex } = ensureSequentialAdvance(phases, current_phase_id, next_phase_id);

  phases[currentIndex].status = 'completed';
  phases[nextIndex].status = 'running';

  const plan = {
    ...existing,
    phases,
    current_phase_id: next_phase_id,
    updated_at: new Date().toISOString(),
  };
  await writePlanFile(conversationId, plan);
  return plan;
};

module.exports = {
  readPlanFile,
  writePlanFile,
  updatePlan,
  advancePlan,
};
