import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createSeededRandom, shuffleWithSeed, TeamDeckManager } from '../src/seedDeck.js';

describe('Seed & Deck Logic Unit Tests (TDD)', () => {
  test('createSeededRandom: same seed produces identical pseudo-random sequence', () => {
    const rng1 = createSeededRandom('my-club-seed-2026');
    const rng2 = createSeededRandom('my-club-seed-2026');

    const seq1 = [rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2()];

    assert.deepEqual(seq1, seq2, 'Sequences with same seed must be strictly identical');
  });

  test('createSeededRandom: different seeds produce different sequences', () => {
    const rngA = createSeededRandom('seed-alpha');
    const rngB = createSeededRandom('seed-beta');

    assert.notEqual(rngA(), rngB(), 'Different seeds should produce different outputs');
  });

  test('shuffleWithSeed: deterministically shuffles members without mutating original', () => {
    const originalList = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'David' }
    ];

    const shuffled1 = shuffleWithSeed(originalList, 'vibe-secret-42');
    const shuffled2 = shuffleWithSeed(originalList, 'vibe-secret-42');
    const shuffledOther = shuffleWithSeed(originalList, 'vibe-secret-999');

    // Original array must not be mutated
    assert.equal(originalList[0].id, '1');

    // Identical seed produces identical order
    assert.deepEqual(shuffled1.map(m => m.id), shuffled2.map(m => m.id));

    // Elements should be preserved
    assert.equal(shuffled1.length, originalList.length);
    assert.deepEqual(new Set(shuffled1.map(m => m.id)), new Set(originalList.map(m => m.id)));

    // Different seed likely produces different order
    assert.notDeepEqual(shuffled1.map(m => m.id), shuffledOther.map(m => m.id));
  });

  test('TeamDeckManager: manages leader separation, sequential draw, and completion state', () => {
    const teamData = {
      leader: { id: 'leader-1', name: 'Team Leader', role: 'PM / FullStack' },
      members: [
        { id: 'mem-1', name: 'Member A', role: 'Frontend' },
        { id: 'mem-2', name: 'Member B', role: 'Backend' },
        { id: 'mem-3', name: 'Member C', role: 'Designer' },
        { id: 'mem-4', name: 'Member D', role: 'DevOps' }
      ]
    };

    const manager = new TeamDeckManager(teamData, { seed: 'club-test-seed' });

    assert.equal(manager.getLeader().id, 'leader-1');
    assert.equal(manager.getRemainingCount(), 4);
    assert.equal(manager.isComplete(), false);

    // Draw cards one by one
    const drawn1 = manager.drawNext();
    assert.ok(drawn1, 'First card must be drawn');
    assert.equal(manager.getRemainingCount(), 3);
    assert.equal(manager.getDrawnMembers().length, 1);
    assert.equal(manager.isComplete(), false);

    const drawn2 = manager.drawNext();
    const drawn3 = manager.drawNext();
    const drawn4 = manager.drawNext();

    assert.equal(manager.getRemainingCount(), 0);
    assert.equal(manager.getDrawnMembers().length, 4);
    assert.equal(manager.isComplete(), true);

    // Drawing when empty returns null
    const drawn5 = manager.drawNext();
    assert.equal(drawn5, null);
  });

  test('TeamDeckManager: supports manual fixed order override', () => {
    const teamData = {
      leader: { id: 'leader-1', name: 'Leader' },
      members: [
        { id: 'mem-1', name: 'Member A' },
        { id: 'mem-2', name: 'Member B' },
        { id: 'mem-3', name: 'Member C' }
      ]
    };

    // Explicit manual order override: mem-3, then mem-1, then mem-2
    const manager = new TeamDeckManager(teamData, {
      seed: 'arbitrary-seed',
      forcedOrder: ['mem-3', 'mem-1', 'mem-2']
    });

    const d1 = manager.drawNext();
    const d2 = manager.drawNext();
    const d3 = manager.drawNext();

    assert.equal(d1.id, 'mem-3');
    assert.equal(d2.id, 'mem-1');
    assert.equal(d3.id, 'mem-2');
  });
});
