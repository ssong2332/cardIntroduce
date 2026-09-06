import { shuffleWithSeed } from './seedDeck.js';

/**
 * MultiTeamManager coordinates the 3-team pipeline:
 * 1. Track overview
 * 2. Leaders reveal (1, 1, 2)
 * 3. Priority drafted members (2 per team)
 * 4. Remaining pool deterministic shuffle & draw
 * 5. Full team assembly and per-team showcase
 */
export class MultiTeamManager {
  constructor(config, options = {}) {
    this.config = config;
    this.seed = options.seed || 'aetheria-metal-2026';
    this.forcedOrder = options.forcedOrder || null;

    this.teams = [];
    this.remainingDeck = [];
    this.drawnMembers = [];

    this.init();
  }

  init() {
    // Deep clone teams
    this.teams = this.config.teams.map(t => ({
      id: t.id,
      name: t.name,
      accentColor: t.accentColor || '#38bdf8',
      leaders: [...t.leaders],
      priorityMembers: [...t.priorityMembers],
      assignedMembers: []
    }));

    this.drawnMembers = [];

    // Setup remaining pool
    const pool = [...(this.config.remainingPool || [])];

    if (Array.isArray(this.forcedOrder) && this.forcedOrder.length > 0) {
      const poolMap = new Map(pool.map(m => [m.id, m]));
      const ordered = [];
      for (const id of this.forcedOrder) {
        if (poolMap.has(id)) {
          ordered.push(poolMap.get(id));
          poolMap.delete(id);
        }
      }
      for (const rem of poolMap.values()) {
        ordered.push(rem);
      }
      this.remainingDeck = ordered;
    } else {
      // Organize round-robin by team sequence: 1팀 -> 2팀 -> 3팀 -> 1팀 -> 2팀...
      const buckets = {
        'team-1': [],
        'team-2': [],
        'team-3': []
      };
      const unassigned = [];

      pool.forEach(member => {
        const teamKey = member.targetTeamId;
        if (teamKey && buckets[teamKey]) {
          buckets[teamKey].push(member);
        } else {
          unassigned.push(member);
        }
      });

      const roundRobinOrdered = [];
      const teamKeys = ['team-1', 'team-2', 'team-3'];
      let hasMore = true;

      while (hasMore) {
        hasMore = false;
        for (const key of teamKeys) {
          if (buckets[key].length > 0) {
            roundRobinOrdered.push(buckets[key].shift());
            hasMore = true;
          }
        }
      }

      unassigned.forEach(m => roundRobinOrdered.push(m));
      this.remainingDeck = roundRobinOrdered;
    }
  }

  reset(seed, forcedOrder) {
    if (seed !== undefined) this.seed = seed;
    if (forcedOrder !== undefined) this.forcedOrder = forcedOrder;
    this.init();
  }

  getTrack() {
    return this.config.track;
  }

  getTeams() {
    return this.teams;
  }

  getTeam(teamId) {
    return this.teams.find(t => t.id === teamId);
  }

  getRemainingDeckCount() {
    return this.remainingDeck.length;
  }

  getDrawnMembers() {
    return [...this.drawnMembers];
  }

  isComplete() {
    return this.remainingDeck.length === 0;
  }

  /**
   * Draw the next card from the remaining pool and assign to its target team.
   * If member doesn't have targetTeamId, round-robin among teams.
   */
  drawNext() {
    if (this.remainingDeck.length === 0) {
      return null;
    }

    const member = this.remainingDeck.shift();
    let assignedTeamId = member.targetTeamId;

    if (!assignedTeamId) {
      // Find team with lowest total members
      const teamWithLeast = [...this.teams].sort((a, b) => {
        const countA = a.leaders.length + a.priorityMembers.length + a.assignedMembers.length;
        const countB = b.leaders.length + b.priorityMembers.length + b.assignedMembers.length;
        return countA - countB;
      })[0];
      assignedTeamId = teamWithLeast ? teamWithLeast.id : this.teams[0].id;
    }

    const team = this.getTeam(assignedTeamId);
    if (team) {
      team.assignedMembers.push(member);
    }

    const drawnResult = {
      ...member,
      assignedTeamId
    };

    this.drawnMembers.push(drawnResult);
    return drawnResult;
  }
}
