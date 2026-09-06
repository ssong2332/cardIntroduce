import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MultiTeamManager } from '../src/multiTeamManager.js';

describe('MultiTeamManager Unit Tests (TDD)', () => {
  const mockConfig = {
    track: {
      id: 'track-1',
      title: '트랙 1: AI & 풀스택 웹 서비스 개발',
      description: '실제 사용자를 위한 고성능 풀스택 웹 프로덕트 제작 트랙'
    },
    teams: [
      {
        id: 'team-1',
        name: 'Team Alpha',
        leaders: [{ id: 'l-1', name: '박민준', role: 'Team Leader' }],
        priorityMembers: [
          { id: 'p-1', name: '이지우', role: 'UI/UX Designer' },
          { id: 'p-2', name: '강동원', role: 'Frontend Engineer' }
        ],
        assignedMembers: []
      },
      {
        id: 'team-2',
        name: 'Team Beta',
        leaders: [{ id: 'l-2', name: '김도현', role: 'Team Leader' }],
        priorityMembers: [
          { id: 'p-3', name: '윤하은', role: 'Frontend Engineer' },
          { id: 'p-4', name: '송민호', role: 'Backend Engineer' }
        ],
        assignedMembers: []
      },
      {
        id: 'team-3',
        name: 'Team Gamma',
        leaders: [
          { id: 'l-3a', name: '최서연', role: 'Co-Leader (AI)' },
          { id: 'l-3b', name: '정수빈', role: 'Co-Leader (Infra)' }
        ],
        priorityMembers: [
          { id: 'p-5', name: '한재원', role: 'Data Analyst' },
          { id: 'p-6', name: '오세훈', role: 'ML Ops' }
        ],
        assignedMembers: []
      }
    ],
    remainingPool: [
      { id: 'r-1', name: '배수지', role: 'Fullstack Dev', targetTeamId: 'team-1' },
      { id: 'r-2', name: '남주혁', role: 'DevOps Specialist', targetTeamId: 'team-2' },
      { id: 'r-3', name: '김태리', role: 'Security & QA', targetTeamId: 'team-3' }
    ]
  };

  test('MultiTeamManager initializes 3 teams with correct leaders (1, 1, 2) and priority members', () => {
    const manager = new MultiTeamManager(mockConfig, { seed: 'test-seed-2026' });

    assert.equal(manager.getTeams().length, 3);
    assert.equal(manager.getTeam('team-1').leaders.length, 1);
    assert.equal(manager.getTeam('team-2').leaders.length, 1);
    assert.equal(manager.getTeam('team-3').leaders.length, 2);

    assert.equal(manager.getTeam('team-1').priorityMembers.length, 2);
    assert.equal(manager.getTeam('team-2').priorityMembers.length, 2);
    assert.equal(manager.getTeam('team-3').priorityMembers.length, 2);
  });

  test('MultiTeamManager draws remaining pool members and assigns them to respective teams', () => {
    const manager = new MultiTeamManager(mockConfig, { seed: 'test-seed-2026' });

    assert.equal(manager.getRemainingDeckCount(), 3);
    assert.equal(manager.isComplete(), false);

    const firstDraw = manager.drawNext();
    assert.ok(firstDraw);
    assert.ok(firstDraw.assignedTeamId);
    assert.equal(manager.getRemainingDeckCount(), 2);

    const secondDraw = manager.drawNext();
    const thirdDraw = manager.drawNext();

    assert.equal(manager.getRemainingDeckCount(), 0);
    assert.equal(manager.isComplete(), true);

    // Each team now has 1 assigned member from remaining pool
    assert.equal(manager.getTeam('team-1').assignedMembers.length, 1);
    assert.equal(manager.getTeam('team-2').assignedMembers.length, 1);
    assert.equal(manager.getTeam('team-3').assignedMembers.length, 1);
  });

  test('MultiTeamManager respects deterministic seed for shuffling remaining pool', () => {
    const manager1 = new MultiTeamManager(mockConfig, { seed: 'deterministic-42' });
    const manager2 = new MultiTeamManager(mockConfig, { seed: 'deterministic-42' });

    const seq1 = [manager1.drawNext().id, manager1.drawNext().id, manager1.drawNext().id];
    const seq2 = [manager2.drawNext().id, manager2.drawNext().id, manager2.drawNext().id];

    assert.deepEqual(seq1, seq2, 'Same seed must yield identical draw order');
  });

  test('MultiTeamManager supports Track 1 single team of 6 members (1 leader + 5 regular)', async () => {
    const { track1Config } = await import('../src/teamConfig.js');
    const manager = new MultiTeamManager(track1Config, { seed: 'track1-seed' });

    assert.equal(manager.getTeams().length, 1);
    const team1 = manager.getTeam('team-1');
    assert.ok(team1);
    assert.equal(team1.leaders.length, 1);
    assert.equal(team1.priorityMembers.length, 0);
    assert.equal(manager.getRemainingDeckCount(), 5);

    const draws = [];
    while (manager.getRemainingDeckCount() > 0) {
      draws.push(manager.drawNext());
    }

    assert.equal(draws.length, 5);
    assert.equal(manager.isComplete(), true);
    assert.equal(team1.assignedMembers.length, 5);

    // Total roster in track 1: 1 leader + 5 assigned = exactly 6 members
    const totalCount = team1.leaders.length + team1.priorityMembers.length + team1.assignedMembers.length;
    assert.equal(totalCount, 6);
  });
});
