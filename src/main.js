import { clubTracks, clubTrackConfig } from './teamConfig.js';
import { MultiTeamManager } from './multiTeamManager.js';
import { ParticleEngine } from './particles.js';
import { soundFx } from './audioFx.js';
import { getLikeLionCardBackHtml, getCardFrontHtml } from './likelionAssets.js';

// Application State
let currentTrackKey = 'track2'; // Default: 2트랙 (track2)
let activeTrackConfig = clubTracks[currentTrackKey];
let currentSeed = 'likelion-poker-2026';
let forcedOrder = null;
let teamManager = null;
let particleEngine = null;

// Stage Flow Management:
let currentStep = 0;
let currentSpotlight = null; // Holds currently paused spotlight cards
let currentFocusTeamIdx = 0;
let isBusy = false;

// DOM Elements
const canvas = document.getElementById('particle-canvas');
const deckStack = document.getElementById('deck-stack');
const track1StashDock = document.getElementById('track1-stash-dock');
const track1StashCards = document.getElementById('track1-stash-cards');
const btnDealerAction = document.getElementById('btn-dealer-action');
const btnShowcaseOpen = document.getElementById('btn-showcase-open');
const hudTrackLabel = document.getElementById('hud-track-label');

// Flying Cards Layer
const flyingDimmer = document.getElementById('flying-dimmer');
const flyingCardsLayer = document.getElementById('flying-cards-layer');

// Headers
const headers = {
  team1: document.getElementById('header-team-1'),
  team2: document.getElementById('header-team-2'),
  team3: document.getElementById('header-team-3')
};

// Rows for 3 Teams
const rows = {
  team1: {
    leader: document.getElementById('row-leader-team-1'),
    priority: document.getElementById('row-priority-team-1'),
    regular: document.getElementById('row-regular-team-1')
  },
  team2: {
    leader: document.getElementById('row-leader-team-2'),
    priority: document.getElementById('row-priority-team-2'),
    regular: document.getElementById('row-regular-team-2')
  },
  team3: {
    leader: document.getElementById('row-leader-team-3'),
    priority: document.getElementById('row-priority-team-3'),
    regular: document.getElementById('row-regular-team-3')
  }
};

// Focus Modal Elements
const teamFocusModal = document.getElementById('team-focus-modal');
const focusTeamHeading = document.getElementById('focus-team-heading');
const focusPageText = document.getElementById('focus-page-text');
const focusBodyCards = document.getElementById('focus-body-cards');
const btnFocusPrev = document.getElementById('btn-focus-prev');
const btnFocusNext = document.getElementById('btn-focus-next');
const btnFocusClose = document.getElementById('btn-focus-close');

// Single Card 3D Tilt Inspector Modal Elements
const cardInspectModal = document.getElementById('card-inspect-modal');
const inspectModalBackdrop = document.getElementById('inspect-modal-backdrop');
const inspectCardStage = document.getElementById('inspect-card-stage');
const btnInspectClose = document.getElementById('btn-inspect-close');

// Tools & Admin
const adminModal = document.getElementById('admin-modal');
const btnSecretAdmin = document.getElementById('btn-secret-admin');
const btnCloseAdmin = document.getElementById('btn-close-admin');
const btnCancelAdmin = document.getElementById('btn-cancel-admin');
const btnApplyAdmin = document.getElementById('btn-apply-admin');
const adminSeedInput = document.getElementById('admin-seed-input');
const adminShareUrl = document.getElementById('admin-share-url');
const btnCopyShareUrl = document.getElementById('btn-copy-share-url');

const btnSoundToggle = document.getElementById('btn-sound-toggle');
const btnResetApp = document.getElementById('btn-reset-app');

// Toast message suppressed per user request (Requirement #4)
function showToast() {
  // Permanently quiet per user instruction
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('seed')) {
    currentSeed = params.get('seed').trim() || currentSeed;
  }
  if (params.has('order')) {
    const orderStr = params.get('order').trim();
    if (orderStr) {
      forcedOrder = orderStr.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
}

/**
 * Helper to get currently active track card visual theme
 */
function getActiveCardTheme() {
  return (activeTrackConfig && activeTrackConfig.track && activeTrackConfig.track.cardTheme) || 'track2';
}

/**
 * Update Deck Stack visuals with current track theme
 */
function updateDeckStackTheme() {
  if (!deckStack) return;
  deckStack.classList.remove('is-empty');
  const theme = getActiveCardTheme();
  const backHtml = getLikeLionCardBackHtml(theme);
  deckStack.innerHTML = `
    <div class="deck-stack-card">${backHtml}</div>
    <div class="deck-stack-card">${backHtml}</div>
    <div class="deck-stack-card">${backHtml}</div>
    <div class="deck-stack-card">${backHtml}</div>
    <div class="deck-stack-card">${backHtml}</div>
  `;
}

/**
 * Creates Poker Card element placed on table
 * Unified strict dimensions across all cards
 */
function createTableCardElement(member) {
  const theme = getActiveCardTheme();
  const card = document.createElement('div');
  card.className = 'poker-card-element';
  card.setAttribute('title', `${member.name} 클릭 시 3D 확대 뷰`);
  card.innerHTML = `
    ${getLikeLionCardBackHtml(theme)}
    ${getCardFrontHtml(member, theme)}
  `;

  card.addEventListener('click', (e) => {
    e.stopPropagation();
    openSingleCardInspector(member);
  });

  return card;
}

/**
 * Creates a Flying Card DOM wrapper
 */
function createFlyingCardWrapper(member) {
  const theme = getActiveCardTheme();
  const wrap = document.createElement('div');
  wrap.className = 'flying-card-wrapper';
  wrap.innerHTML = `
    <div class="flying-card-inner">
      ${getLikeLionCardBackHtml(theme)}
      ${getCardFrontHtml(member, theme)}
    </div>
  `;
  return wrap;
}

/**
 * Requirement #2: Smooth FLIP (First, Last, Invert, Play) Card Settlement
 * Smoothly shifts existing table cards horizontally when a new card joins the row!
 * Important: translate3d MUST precede rotateY(180deg) to avoid inverted X-displacement!
 */
function settleCardWithOrganicShift(targetRow, member) {
  // 1. First: Record positions of all currently present cards in this row
  const existingCards = Array.from(targetRow.querySelectorAll('.poker-card-element'));
  const firstRects = existingCards.map(el => el.getBoundingClientRect().left);

  // 2. Append new card to DOM
  const tableCard = createTableCardElement(member);
  targetRow.appendChild(tableCard);

  // 3. Last & Invert: Calculate displacement and invert instantly in parent table coordinates
  const lastRects = existingCards.map(el => el.getBoundingClientRect().left);

  existingCards.forEach((el, idx) => {
    const deltaX = firstRects[idx] - lastRects[idx];
    if (Math.abs(deltaX) > 0.5) {
      el.style.transition = 'none';
      el.style.transform = `translate3d(${deltaX}px, 0, 0) rotateY(180deg)`;
    }
  });

  // 4. Play: Transition all existing cards smoothly to their new resting positions!
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      existingCards.forEach(el => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.25, 1), box-shadow 0.25s ease';
        el.style.transform = 'translate3d(0, 0, 0) rotateY(180deg)';
      });
    });
  });

  return tableCard;
}

/**
 * Requirement #1:
 * Reveal Track 1 Full Roster (Leader + 5 Regular Members = 6 members) ALL at once sequentially!
 * - 6 cards fly out from deck and align in 1 horizontal row in center
 * - Pause for 700ms on card-backs for suspense
 * - Sequentially flip left-to-right (Leader ➔ Member 1~5) with 380ms pacing!
 */
function spotlightTrack1FullRoster() {
  return new Promise((resolve) => {
    isBusy = true;
    flyingDimmer.classList.add('active');

    const t1 = clubTracks.track1;
    const allMembers = [
      ...t1.teams[0].leaders,
      ...t1.remainingPool
    ]; // exactly 6 members!

    const deckRect = deckStack.getBoundingClientRect();
    const startX = deckRect.left + deckRect.width / 2;
    const startY = deckRect.top + deckRect.height / 2;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.42;

    // 6 cards horizontally spaced: pitch = 210px
    const offsets = [-525, -315, -105, 105, 315, 525];
    const wrappers = [];

    allMembers.forEach((member, idx) => {
      const wrap = createFlyingCardWrapper(member);
      flyingCardsLayer.appendChild(wrap);

      wrap.style.left = `${startX}px`;
      wrap.style.top = `${startY}px`;
      wrap.style.transform = 'translate(-50%, -50%) scale(0.35)';

      wrappers.push({
        member,
        wrap,
        inner: wrap.querySelector('.flying-card-inner'),
        targetX: centerX + offsets[idx]
      });
    });

    // Banner placed well above cards to prevent overlap
    const bannerEl = document.createElement('div');
    bannerEl.className = 'spotlight-team-banner team-1-banner';
    bannerEl.textContent = '1팀 (6인 라인업 순차 공개)';
    bannerEl.style.left = `${centerX}px`;
    bannerEl.style.top = `${centerY - 220}px`;
    flyingCardsLayer.appendChild(bannerEl);

    soundFx.playShuffle();

    // Fly out to center with integer pixel precision
    requestAnimationFrame(() => {
      wrappers.forEach((item) => {
        item.wrap.style.left = `${Math.round(item.targetX)}px`;
        item.wrap.style.top = `${Math.round(centerY)}px`;
        item.wrap.style.transform = 'translate(-50%, -50%) scale(0.75)';
      });
      bannerEl.classList.add('visible');
    });

    // Requirement #3: Sequential 3D Flip from 0 (Leader) to 5 (Last Member) - slower, graceful pacing
    const initialPause = 900;
    const flipInterval = 620;

    wrappers.forEach((item, idx) => {
      setTimeout(() => {
        item.inner.classList.add('is-flipped');
        soundFx.playFlip();
        particleEngine.spawnBurst(Math.round(item.targetX), Math.round(centerY), '#00e5ff', 24);
      }, initialPause + idx * flipInterval);
    });

    setTimeout(() => {
      currentSpotlight = {
        type: 'track1-full',
        wrappers,
        bannerEl,
        allMembers
      };
      isBusy = false;
      resolve();
    }, initialPause + wrappers.length * flipInterval + 400);
  });
}

/**
 * Requirement #4:
 * Stash Track 1 cards into corner vault dock, and prepare table for Track 2!
 */
function stashTrack1CardsToDock() {
  return new Promise((resolve) => {
    if (!currentSpotlight || currentSpotlight.type !== 'track1-full') {
      resolve();
      return;
    }

    isBusy = true;
    const { wrappers, bannerEl, allMembers } = currentSpotlight;
    currentSpotlight = null;

    if (bannerEl) {
      bannerEl.classList.remove('visible');
      setTimeout(() => bannerEl.remove(), 400);
    }

    // Corner Dock Rect (Left bottom)
    const dockRect = track1StashDock.getBoundingClientRect();
    const dockTargetX = dockRect.left + dockRect.width / 2;
    const dockTargetY = dockRect.top + dockRect.height / 2;

    // Stash glide animation
    wrappers.forEach((item, idx) => {
      item.wrap.style.transition = 'all 0.65s cubic-bezier(0.2, 0.9, 0.25, 1)';
      item.wrap.style.left = `${Math.round(dockTargetX + (idx - 2.5) * 8)}px`;
      item.wrap.style.top = `${Math.round(dockTargetY)}px`;
      item.wrap.style.transform = 'translate(-50%, -50%) scale(0.18)';
      item.wrap.style.opacity = '0.7';
    });

    setTimeout(() => {
      soundFx.playSnap();
      wrappers.forEach(item => item.wrap.remove());

      // Render mini cards inside the vault dock
      track1StashCards.innerHTML = allMembers.map(m => `
        <div class="stash-dock-mini-card" title="${m.name} (${m.role})">
          <img src="${m.avatar}" alt="${m.name}" />
        </div>
      `).join('');

      track1StashDock.classList.add('visible');

      // Click vault dock to inspect Track 1 anytime!
      track1StashDock.onclick = () => openTrack1ShowcaseModal(allMembers);

      // Now switch active track config to Track 2!
      currentTrackKey = 'track2';
      activeTrackConfig = clubTracks.track2;
      teamManager = new MultiTeamManager(activeTrackConfig, {
        seed: currentSeed,
        forcedOrder: forcedOrder
      });

      // Show Track 2 3-teams arena
      const arena = document.querySelector('.table-teams-arena');
      if (arena) arena.classList.remove('is-single-team');

      // Reset deck stack to Track 2 theme
      updateDeckStackTheme();

      flyingDimmer.classList.remove('active');
      isBusy = false;
      resolve();
    }, 700);
  });
}

/**
 * Open Track 1 Showcase Modal
 */
function openTrack1ShowcaseModal(allMembers) {
  focusTeamHeading.textContent = `1팀 // 전체 라인업 (6인)`;
  focusPageText.textContent = `1 / 1`;
  btnFocusPrev.style.display = 'none';
  btnFocusNext.style.display = 'none';
  focusBodyCards.innerHTML = '';

  allMembers.forEach(m => {
    const cardEl = document.createElement('div');
    cardEl.className = 'poker-card-element theme-track1';
    cardEl.setAttribute('title', `${m.name} 클릭 시 3D 확대 뷰`);
    cardEl.innerHTML = `
      ${getLikeLionCardBackHtml('track1-cyan')}
      ${getCardFrontHtml(m, 'track1-cyan')}
    `;
    cardEl.addEventListener('click', () => openSingleCardInspector(m));
    focusBodyCards.appendChild(cardEl);
  });

  teamFocusModal.classList.add('active');
}

/**
 * Reveal 2-Track Team Leaders in ONE turn with clear team separation and badges!
 */
function spotlightAllLeadersRow() {
  return new Promise((resolve) => {
    isBusy = true;
    flyingDimmer.classList.add('active');

    const leadersData = [
      { member: activeTrackConfig.teams[0].leaders[0], targetRow: rows.team1.leader, header: headers.team1 },
      { member: activeTrackConfig.teams[1].leaders[0], targetRow: rows.team2.leader, header: headers.team2 },
      { member: activeTrackConfig.teams[2].leaders[0], targetRow: rows.team3.leader, header: headers.team3, offsetIndex: 0 },
      { member: activeTrackConfig.teams[2].leaders[1], targetRow: rows.team3.leader, header: headers.team3, offsetIndex: 1 }
    ];

    const deckRect = deckStack.getBoundingClientRect();
    const startX = deckRect.left + deckRect.width / 2;
    const startY = deckRect.top + deckRect.height / 2;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.40;

    const offsets = [-570, -60, 310, 520];
    const wrappers = [];

    leadersData.forEach((item, idx) => {
      const wrap = createFlyingCardWrapper(item.member);
      flyingCardsLayer.appendChild(wrap);

      wrap.style.left = `${startX}px`;
      wrap.style.top = `${startY}px`;
      wrap.style.transform = 'translate(-50%, -50%) scale(0.35)';

      wrappers.push({ ...item, wrap, inner: wrap.querySelector('.flying-card-inner'), targetX: centerX + offsets[idx] });
    });

    // Team Identification Banners (Placed higher to never overlap card badges!)
    const bannerTop = centerY - 210;
    const banners = [
      { text: '1팀 (팀장)', cls: 'team-1-banner', x: centerX - 570 },
      { text: '2팀 (팀장)', cls: 'team-2-banner', x: centerX - 60 },
      { text: '3팀 (공동팀장)', cls: 'team-3-banner', x: centerX + 415 }
    ];

    const bannerEls = [];
    banners.forEach(b => {
      const bannerEl = document.createElement('div');
      bannerEl.className = `spotlight-team-banner ${b.cls}`;
      bannerEl.textContent = b.text;
      bannerEl.style.left = `${Math.round(b.x)}px`;
      bannerEl.style.top = `${Math.round(bannerTop)}px`;
      flyingCardsLayer.appendChild(bannerEl);
      bannerEls.push(bannerEl);
    });

    soundFx.playShuffle();

    // Fly out to center with pixel precision
    requestAnimationFrame(() => {
      wrappers.forEach((item) => {
        item.wrap.style.left = `${Math.round(item.targetX)}px`;
        item.wrap.style.top = `${Math.round(centerY)}px`;
        item.wrap.style.transform = 'translate(-50%, -50%) scale(0.84)';
      });
      bannerEls.forEach(el => el.classList.add('visible'));
    });

    // Requirement #3: Pause on card backs first (800ms) then flip with 680ms pacing!
    const initialPause = 800;
    const flipInterval = 680;

    wrappers.forEach((item, idx) => {
      setTimeout(() => {
        item.inner.classList.add('is-flipped');
        soundFx.playFlip();
        particleEngine.spawnBurst(Math.round(item.targetX), Math.round(centerY), '#FF7710', 28);
      }, initialPause + idx * flipInterval);
    });

    // Pause in center after last card flips!
    setTimeout(() => {
      currentSpotlight = {
        type: 'all-leaders',
        wrappers,
        banners: bannerEls
      };
      isBusy = false;
      resolve();
    }, initialPause + wrappers.length * flipInterval + 300);
  });
}

/**
 * Land team leader(s) simultaneously to their respective seats
 */
function landAllLeadersRow() {
  return new Promise((resolve) => {
    if (!currentSpotlight || currentSpotlight.type !== 'all-leaders') {
      resolve();
      return;
    }

    isBusy = true;
    const { wrappers, banners } = currentSpotlight;
    currentSpotlight = null;

    if (banners && banners.length) {
      banners.forEach(b => {
        b.classList.remove('visible');
        setTimeout(() => b.remove(), 400);
      });
    }

    wrappers.forEach((item) => {
      const targetRect = item.targetRow.getBoundingClientRect();
      const endY = targetRect.top + targetRect.height / 2;
      let endX = targetRect.left + targetRect.width / 2;

      // 3팀 공동팀장 좌우 나란히 안착 (144px 넉넉한 간격으로 카드 겹침 원천 방지)
      if (item.offsetIndex === 0) endX -= 72;
      if (item.offsetIndex === 1) endX += 72;

      item.wrap.style.transition = 'all 0.52s cubic-bezier(0.2, 0.9, 0.25, 1)';
      item.wrap.style.left = `${Math.round(endX)}px`;
      item.wrap.style.top = `${Math.round(endY)}px`;
      item.wrap.style.transform = 'translate(-50%, -50%) scale(0.45)';
    });

    setTimeout(() => {
      soundFx.playSnap();

      wrappers.forEach((item) => {
        item.wrap.remove();
        settleCardWithOrganicShift(item.targetRow, item.member);
        if (item.header) item.header.classList.add('visible');
      });

      particleEngine.celebrate(1500);
      flyingDimmer.classList.remove('active');
      isBusy = false;
      resolve();
    }, 550);
  });
}

/**
 * Spotlight Single Card & Pause
 * Requirement #3: Card stays on card-back for 750ms before flipping!
 */
function spotlightSingleCard(member, targetRow, teamHeader) {
  return new Promise((resolve) => {
    isBusy = true;
    flyingDimmer.classList.add('active');

    const deckRect = deckStack.getBoundingClientRect();
    const startX = deckRect.left + deckRect.width / 2;
    const startY = deckRect.top + deckRect.height / 2;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const flyingWrap = createFlyingCardWrapper(member);
    const inner = flyingWrap.querySelector('.flying-card-inner');
    flyingCardsLayer.appendChild(flyingWrap);

    flyingWrap.style.left = `${startX}px`;
    flyingWrap.style.top = `${startY}px`;
    flyingWrap.style.transform = 'translate(-50%, -50%) scale(0.35)';

    soundFx.playShuffle();

    requestAnimationFrame(() => {
      flyingWrap.style.left = `${Math.round(centerX)}px`;
      flyingWrap.style.top = `${Math.round(centerY)}px`;
      flyingWrap.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Requirement #3: 750ms pause on back for suspense, then 3D flip
    setTimeout(() => {
      inner.classList.add('is-flipped');
      soundFx.playFlip();
      particleEngine.spawnBurst(Math.round(centerX), Math.round(centerY), '#FF7710', 35);

      currentSpotlight = {
        type: 'single',
        member,
        targetRow,
        teamHeader,
        flyingWrap
      };
      isBusy = false;
      resolve();
    }, 750);
  });
}

/**
 * Land Single Card to Seat with Predictive In-flight Simultaneous Shifting!
 * Requirement #2:
 * 1. Calculate the exact landing slot coordinate for the incoming card.
 * 2. In-flight simultaneous shift: while flyingWrap flies to its destination slot,
 *    all existing cards in targetRow smoothly shift horizontally (0.52s ease) to make room!
 * 3. Upon arrival, DOM append happens seamlessly with 0 jump or flash!
 */
function landCurrentSingleSpotlight() {
  return new Promise((resolve) => {
    if (!currentSpotlight || currentSpotlight.type !== 'single') {
      resolve();
      return;
    }

    isBusy = true;
    const { member, targetRow, teamHeader, flyingWrap } = currentSpotlight;
    currentSpotlight = null;

    // Measure existing cards in target row
    const existingCards = Array.from(targetRow.querySelectorAll('.poker-card-element'));
    const k = existingCards.length;

    const cardW = 118;
    const gap = 12;
    const pitch = cardW + gap; // 130px

    const targetRect = targetRow.getBoundingClientRect();
    const rowCenterX = targetRect.left + targetRect.width / 2;
    const rowCenterY = targetRect.top + targetRect.height / 2;

    // Width after k+1 cards are settled
    const totalWidthAfter = (k + 1) * cardW + k * gap;
    const startLeftAfter = rowCenterX - totalWidthAfter / 2;

    // Exact destination slot center for the incoming card (slot index k)
    const slotNewCenterX = startLeftAfter + k * pitch + cardW / 2;
    const slotNewCenterY = rowCenterY;

    // Symmetrical center expansion means existing cards shift left by exactly half a pitch (-65px)
    const shiftX = -pitch / 2;

    // 1. Incoming card glides smoothly to its exact calculated slot
    flyingWrap.style.transition = 'all 0.52s cubic-bezier(0.2, 0.9, 0.25, 1)';
    flyingWrap.style.left = `${Math.round(slotNewCenterX)}px`;
    flyingWrap.style.top = `${Math.round(slotNewCenterY)}px`;
    flyingWrap.style.transform = 'translate(-50%, -50%) scale(0.44)';

    // 2. Existing cards simultaneously slide left in sync with incoming card!
    // Important: translate3d MUST precede rotateY(180deg) so that the translation applies in parent table space without X-axis reversal!
    if (k > 0) {
      existingCards.forEach((card) => {
        card.style.transition = 'transform 0.52s cubic-bezier(0.2, 0.9, 0.25, 1)';
        card.style.transform = `translate3d(${shiftX}px, 0, 0) rotateY(180deg)`;
      });
    }

    setTimeout(() => {
      flyingWrap.remove();
      soundFx.playSnap();

      // Append new card into DOM
      const tableCard = createTableCardElement(member);
      targetRow.appendChild(tableCard);

      // Flexbox automatically positions k+1 items at the exact coordinates, so reset temporary transform cleanly
      if (k > 0) {
        existingCards.forEach((card) => {
          card.style.transition = 'none';
          card.style.transform = 'rotateY(180deg)';
        });
        requestAnimationFrame(() => {
          existingCards.forEach((card) => {
            card.style.transition = '';
          });
        });
      }

      if (teamHeader) teamHeader.classList.add('visible');
      flyingDimmer.classList.remove('active');
      isBusy = false;
      resolve();
    }, 520);
  });
}

/**
 * Spotlight Pair of Cards & Pause
 */
function spotlightPairCards(member1, member2, targetRow, teamHeader) {
  return new Promise((resolve) => {
    isBusy = true;
    flyingDimmer.classList.add('active');

    const deckRect = deckStack.getBoundingClientRect();
    const startX = deckRect.left + deckRect.width / 2;
    const startY = deckRect.top + deckRect.height / 2;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const center1X = centerX - 130;
    const center2X = centerX + 130;

    const wrap1 = createFlyingCardWrapper(member1);
    const wrap2 = createFlyingCardWrapper(member2);
    const inner1 = wrap1.querySelector('.flying-card-inner');
    const inner2 = wrap2.querySelector('.flying-card-inner');

    flyingCardsLayer.appendChild(wrap1);
    flyingCardsLayer.appendChild(wrap2);

    [wrap1, wrap2].forEach(w => {
      w.style.left = `${startX}px`;
      w.style.top = `${startY}px`;
      w.style.transform = 'translate(-50%, -50%) scale(0.35)';
    });

    soundFx.playShuffle();

    requestAnimationFrame(() => {
      wrap1.style.left = `${Math.round(center1X)}px`;
      wrap1.style.top = `${Math.round(centerY)}px`;
      wrap1.style.transform = 'translate(-50%, -50%) scale(0.95)';

      wrap2.style.left = `${Math.round(center2X)}px`;
      wrap2.style.top = `${Math.round(centerY)}px`;
      wrap2.style.transform = 'translate(-50%, -50%) scale(0.95)';
    });

    // Requirement #3: Card 1 flips after 750ms pause, Card 2 flips 680ms later!
    setTimeout(() => {
      inner1.classList.add('is-flipped');
      soundFx.playFlip();
      particleEngine.spawnBurst(Math.round(center1X), Math.round(centerY), '#FF7710', 26);
    }, 750);

    setTimeout(() => {
      inner2.classList.add('is-flipped');
      soundFx.playFlip();
      particleEngine.spawnBurst(Math.round(center2X), Math.round(centerY), '#FF7710', 26);

      currentSpotlight = {
        type: 'pair',
        member1,
        member2,
        targetRow,
        teamHeader,
        wrap1,
        wrap2
      };
      isBusy = false;
      resolve();
    }, 1430);
  });
}

/**
 * Land Pair of Priority Cards to Row with Organic Shifting
 */
function landCurrentPairSpotlight() {
  return new Promise((resolve) => {
    if (!currentSpotlight || currentSpotlight.type !== 'pair') {
      resolve();
      return;
    }

    isBusy = true;
    const { member1, member2, targetRow, teamHeader, wrap1, wrap2 } = currentSpotlight;
    currentSpotlight = null;

    const targetRect = targetRow.getBoundingClientRect();
    const endY = targetRect.top + targetRect.height / 2;
    const end1X = targetRect.left + targetRect.width / 2 - 58;
    const end2X = targetRect.left + targetRect.width / 2 + 58;

    [wrap1, wrap2].forEach(w => {
      w.style.transition = 'all 0.5s cubic-bezier(0.2, 0.9, 0.25, 1)';
    });

    wrap1.style.left = `${Math.round(end1X)}px`;
    wrap1.style.top = `${Math.round(endY)}px`;
    wrap1.style.transform = 'translate(-50%, -50%) scale(0.44)';

    wrap2.style.left = `${Math.round(end2X)}px`;
    wrap2.style.top = `${Math.round(endY)}px`;
    wrap2.style.transform = 'translate(-50%, -50%) scale(0.44)';

    setTimeout(() => {
      wrap1.remove();
      wrap2.remove();
      soundFx.playSnap();

      // Append both cards cleanly without sequential FLIP jump
      const card1 = createTableCardElement(member1);
      const card2 = createTableCardElement(member2);
      targetRow.appendChild(card1);
      targetRow.appendChild(card2);

      if (teamHeader) teamHeader.classList.add('visible');
      flyingDimmer.classList.remove('active');
      isBusy = false;
      resolve();
    }, 500);
  });
}

/**
 * Dynamic 3D Casino Deck Shuffle
 */
function triggerDynamicDeckShuffle(nextButtonHtml, nextStepIndex) {
  isBusy = true;
  btnDealerAction.disabled = true;
  btnDealerAction.innerHTML = `<span>🃏 덱 셔플 중...</span>`;

  deckStack.classList.add('shuffling');
  soundFx.playShuffle();

  setTimeout(() => {
    soundFx.playShuffle();
  }, 450);

  setTimeout(() => {
    deckStack.classList.remove('shuffling');
    currentStep = nextStepIndex;
    btnDealerAction.disabled = false;
    btnDealerAction.innerHTML = nextButtonHtml;
    isBusy = false;
  }, 1150);
}

/**
 * Master User-Driven Step Handler
 * Seamless Integrated Flow:
 * Step 0: Track 1 (6 members) reveal sequentially in 1 line
 * Step 1: Track 1 stash to corner dock ➔ Shuffle ➔ Track 2 start
 * Step 2: Track 2 Leaders reveal
 * Step 3: Track 2 Leaders land ➔ Shuffle
 * Step 4, 5, 6: Track 2 Priority members
 * Step 7: Priority land ➔ Shuffle
 * Step 8+: Track 2 Regular members draw with predictive in-flight simultaneous slide!
 */
async function handleMasterStep() {
  if (isBusy) return;

  btnDealerAction.disabled = true;

  // ================= STAGE 1: 1트랙 6명 전체 순차 공개 =================
  if (currentStep === 0) {
    await spotlightTrack1FullRoster();
    currentStep = 1;
    btnDealerAction.disabled = false;
    btnDealerAction.innerHTML = `<span>카드 정리 & 팀 빌딩 시작</span> ➔`;
    return;
  }

  // ================= STAGE 2: 1트랙 구석 보관함 안착 & 팀 빌딩 준비 =================
  if (currentStep === 1) {
    await stashTrack1CardsToDock();
    triggerDynamicDeckShuffle(`<span>팀장 공개</span> ➔`, 2);
    return;
  }

  // ================= STAGE 3: 2트랙 팀장 4인 일렬 공개 =================
  if (currentStep === 2) {
    await spotlightAllLeadersRow();
    currentStep = 3;
    btnDealerAction.disabled = false;
    btnDealerAction.innerHTML = `<span>팀장 안착</span> ➔`;
    return;
  }

  if (currentStep === 3) {
    await landAllLeadersRow();
    triggerDynamicDeckShuffle(`<span>1팀 선발</span> ➔`, 4);
    return;
  }

  // ================= STAGE 4: 2트랙 우선선발 3개 팀 순차 공개 =================
  if (currentStep === 4) {
    await spotlightPairCards(
      activeTrackConfig.teams[0].priorityMembers[0],
      activeTrackConfig.teams[0].priorityMembers[1],
      rows.team1.priority,
      headers.team1
    );
    currentStep = 5;
    btnDealerAction.disabled = false;
    btnDealerAction.innerHTML = `<span>2팀 선발</span> ➔`;
    return;
  }

  if (currentStep === 5) {
    await landCurrentPairSpotlight();
    await spotlightPairCards(
      activeTrackConfig.teams[1].priorityMembers[0],
      activeTrackConfig.teams[1].priorityMembers[1],
      rows.team2.priority,
      headers.team2
    );
    currentStep = 6;
    btnDealerAction.disabled = false;
    btnDealerAction.innerHTML = `<span>3팀 선발</span> ➔`;
    return;
  }

  if (currentStep === 6) {
    await landCurrentPairSpotlight();
    await spotlightPairCards(
      activeTrackConfig.teams[2].priorityMembers[0],
      activeTrackConfig.teams[2].priorityMembers[1],
      rows.team3.priority,
      headers.team3
    );
    currentStep = 7;
    btnDealerAction.disabled = false;
    btnDealerAction.innerHTML = `<span>선발 안착</span> ➔`;
    return;
  }

  if (currentStep === 7) {
    await landCurrentPairSpotlight();
    triggerDynamicDeckShuffle(`<span>팀원 추첨</span> ➔`, 8);
    return;
  }

  // ================= STAGE 5: 2트랙 일반 팀원 순차 라운드로빈 추첨 =================
  if (currentStep >= 8) {
    // 1. 현재 중앙에 떠 있는 스포트라이트 카드가 있다면 먼저 제자리로 안착!
    if (currentSpotlight) {
      await landCurrentSingleSpotlight();
    }

    // 2. 아직 덱에 뽑을 카드가 남아있다면 다음 카드 추첨!
    if (teamManager.getRemainingDeckCount() > 0) {
      const drawn = teamManager.drawNext();
      const remainingCount = teamManager.getRemainingDeckCount();

      // Requirement #5: 마지막 카드가 뽑혀서 날아가는 바로 그 순간 카드 뭉치 소진!
      if (remainingCount === 0 && deckStack) {
        deckStack.classList.add('is-empty');
      }

      const targetTeamId = drawn.assignedTeamId || drawn.targetTeamId || 'team-1';
      const teamKey = targetTeamId === 'team-1' ? 'team1' : (targetTeamId === 'team-2' ? 'team2' : 'team3');
      const targetRow = rows[teamKey].regular;
      const targetHeader = headers[teamKey];

      await spotlightSingleCard(drawn, targetRow, targetHeader);

      btnDealerAction.disabled = false;
      if (remainingCount > 0) {
        btnDealerAction.innerHTML = `<span>다음 팀원</span> ➔`;
      } else {
        btnDealerAction.innerHTML = `<span>팀원 안착</span> ➔`;
      }
      currentStep++;
      return;
    }

    // 3. 모든 카드가 뽑히고 안착까지 완료된 최종 완료 상태!
    currentStep = 999;
    btnDealerAction.style.display = 'none';
    btnShowcaseOpen.style.display = 'inline-flex';

    soundFx.playFanfare();
    particleEngine.celebrate(4500);
    return;
  }
}

/**
 * Requirement #1:
 * Single Card 3D Tilt Inspector with Continuous Hologram Light Dynamics
 * Seamlessly transitions between ambient idle breathing light & interactive cursor-tracking reflections!
 */
let inspectorAnimFrame = null;

function openSingleCardInspector(member) {
  const theme = getActiveCardTheme();
  inspectCardStage.innerHTML = `
    <div class="poker-card-element ${theme === 'track1-cyan' ? 'theme-track1' : 'theme-track2'}" style="width: 100%; height: 100%; transform: rotateY(180deg);">
      ${getLikeLionCardBackHtml(theme)}
      ${getCardFrontHtml(member, theme)}
    </div>
    <div class="inspect-dynamic-glare" id="inspect-glare"></div>
  `;

  cardInspectModal.classList.add('active');
  soundFx.playFlip();

  const glareEl = document.getElementById('inspect-glare');

  // LERP State variables
  let isHovered = false;
  let time = 0;

  // Current interpolated values (smooth transitions)
  let curRotX = 0;
  let curRotY = 0;
  let curGlareX = 50;
  let curGlareY = 50;
  let curGlareAngle = 120;
  let curGlareOpacity = 0.55;

  // Target values
  let targetRotX = 0;
  let targetRotY = 0;
  let targetGlareX = 50;
  let targetGlareY = 50;
  let targetGlareAngle = 120;
  let targetGlareOpacity = 0.55;

  function animLoop() {
    time += 0.024;

    if (!isHovered) {
      // Continuous Idle Breathing Light Angle & Subtle 3D Float (when NOT hovered)
      targetRotX = Math.sin(time * 0.8) * 3.5;
      targetRotY = Math.cos(time * 0.9) * 4.5;
      targetGlareX = 50 + Math.sin(time * 0.7) * 32;
      targetGlareY = 50 + Math.cos(time * 0.6) * 32;
      targetGlareAngle = 120 + Math.sin(time * 0.5) * 28;
      targetGlareOpacity = 0.55 + Math.sin(time * 1.1) * 0.15;
    }

    // Smooth LERP transition between idle and hovered states with shortest angular distance
    const lerpSpeed = isHovered ? 0.14 : 0.06;
    curRotX += (targetRotX - curRotX) * lerpSpeed;
    curRotY += (targetRotY - curRotY) * lerpSpeed;
    curGlareX += (targetGlareX - curGlareX) * lerpSpeed;
    curGlareY += (targetGlareY - curGlareY) * lerpSpeed;

    // Shortest angular lerp prevents sudden 360-degree flip glitch on the card's left side!
    let angleDiff = (targetGlareAngle - curGlareAngle) % 360;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    curGlareAngle += angleDiff * lerpSpeed;

    curGlareOpacity += (targetGlareOpacity - curGlareOpacity) * lerpSpeed;

    const shadowX = -curRotY * 1.5;
    const shadowY = curRotX * 1.5 + 20;

    const scaleVal = isHovered ? 1.05 : 1.0;
    inspectCardStage.style.transform = `perspective(1000px) rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg) scale3d(${scaleVal}, ${scaleVal}, ${scaleVal})`;
    inspectCardStage.style.boxShadow = `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 50px rgba(0, 0, 0, 0.95), 0 0 32px var(--lion-orange-glow)`;

    // Tier-Specific High-Fidelity Holographic Sheen (Requirement #4)
    const gx = curGlareX;
    const gy = curGlareY;
    const ga = curGlareAngle;
    const tier = member.cardTier || 'regular';

    let gradientStyle = '';
    if (tier === 'leader') {
      // 1. 팀장: 찬란한 24K 골드 & 앰버 오렌지 & 루비 골드 썬버스트
      gradientStyle = `
        linear-gradient(${ga.toFixed(1)}deg,
          transparent 0%,
          rgba(255, 245, 180, 0.08) ${Math.max(0, gx - 45).toFixed(1)}%,
          rgba(255, 120, 16, 0.8) ${Math.max(0, gx - 18).toFixed(1)}%,
          rgba(255, 255, 240, 0.98) ${gx.toFixed(1)}%,
          rgba(245, 158, 11, 0.88) ${Math.min(100, gx + 18).toFixed(1)}%,
          rgba(225, 29, 72, 0.5) ${Math.min(100, gx + 42).toFixed(1)}%,
          transparent 100%),
        radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%,
          rgba(255, 255, 230, 0.85) 0%,
          rgba(255, 140, 20, 0.45) 35%,
          transparent 75%)
      `;
    } else if (tier === 'priority') {
      // 2. 선발인원: 플래티넘 시안 블루 & 네온 일렉트릭 에메랄드 프리즘
      gradientStyle = `
        linear-gradient(${ga.toFixed(1)}deg,
          transparent 0%,
          rgba(210, 250, 255, 0.08) ${Math.max(0, gx - 45).toFixed(1)}%,
          rgba(56, 189, 248, 0.85) ${Math.max(0, gx - 18).toFixed(1)}%,
          rgba(255, 255, 255, 0.98) ${gx.toFixed(1)}%,
          rgba(45, 212, 191, 0.8) ${Math.min(100, gx + 18).toFixed(1)}%,
          rgba(99, 102, 241, 0.5) ${Math.min(100, gx + 42).toFixed(1)}%,
          transparent 100%),
        radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%,
          rgba(255, 255, 255, 0.85) 0%,
          rgba(56, 189, 248, 0.45) 35%,
          transparent 75%)
      `;
    } else {
      // 3. 팀원: 코스믹 오로라 펄 & 네온 마젠타 & 바이올렛 오로라
      gradientStyle = `
        linear-gradient(${ga.toFixed(1)}deg,
          transparent 0%,
          rgba(240, 220, 255, 0.08) ${Math.max(0, gx - 45).toFixed(1)}%,
          rgba(168, 85, 247, 0.8) ${Math.max(0, gx - 18).toFixed(1)}%,
          rgba(255, 255, 255, 0.95) ${gx.toFixed(1)}%,
          rgba(244, 63, 94, 0.75) ${Math.min(100, gx + 18).toFixed(1)}%,
          rgba(96, 165, 250, 0.5) ${Math.min(100, gx + 42).toFixed(1)}%,
          transparent 100%),
        radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(192, 132, 252, 0.4) 35%,
          transparent 75%)
      `;
    }

    glareEl.style.background = gradientStyle;
    glareEl.style.opacity = curGlareOpacity.toFixed(2);

    inspectorAnimFrame = requestAnimationFrame(animLoop);
  }

  // Single invocation of animation loop
  animLoop();

  function onPointerMove(e) {
    isHovered = true;
    const rect = inspectCardStage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    targetRotX = -Math.max(-20, Math.min(20, (deltaY / (rect.height / 2)) * 20));
    targetRotY = Math.max(-20, Math.min(20, (deltaX / (rect.width / 2)) * 20));

    // Dynamic 360-degree rainbow refraction angle tracking the cursor vector
    const angleDeg = (Math.atan2(deltaY, deltaX) * 180 / Math.PI) + 90;
    targetGlareAngle = angleDeg;

    // Glare focal center safely bounded within 24% - 76% (never disappears outside card)
    const normX = Math.max(-1, Math.min(1, deltaX / (rect.width / 2)));
    const normY = Math.max(-1, Math.min(1, deltaY / (rect.height / 2)));
    targetGlareX = 50 + normX * 26;
    targetGlareY = 50 + normY * 26;
    targetGlareOpacity = 0.96;
  }

  function onPointerLeave() {
    isHovered = false;
  }

  inspectCardStage.onmousemove = onPointerMove;
  inspectCardStage.onmouseleave = onPointerLeave;

  inspectCardStage.ontouchmove = onPointerMove;
  inspectCardStage.ontouchend = onPointerLeave;
}

function closeSingleCardInspector() {
  cardInspectModal.classList.remove('active');
  if (inspectorAnimFrame) {
    cancelAnimationFrame(inspectorAnimFrame);
    inspectorAnimFrame = null;
  }
  inspectCardStage.onmousemove = null;
  inspectCardStage.onmouseleave = null;
  inspectCardStage.ontouchmove = null;
  inspectCardStage.ontouchend = null;
}

/**
 * Open Large Showcase (1팀씩 크게 보기)
 */
function openFocusShowcase(teamIndex = 0) {
  const teams = teamManager.getTeams();
  const isSingleTeam = teams.length === 1;
  currentFocusTeamIdx = isSingleTeam ? 0 : Math.max(0, Math.min(teamIndex, teams.length - 1));
  const team = teams[currentFocusTeamIdx];
  if (!team) return;

  focusTeamHeading.textContent = `${team.name} // 전체 라인업`;
  focusPageText.textContent = isSingleTeam ? '1 / 1' : `${currentFocusTeamIdx + 1} / ${teams.length}`;
  btnFocusPrev.style.display = isSingleTeam ? 'none' : 'inline-flex';
  btnFocusNext.style.display = isSingleTeam ? 'none' : 'inline-flex';
  focusBodyCards.innerHTML = '';

  const all = [
    ...team.leaders,
    ...team.priorityMembers,
    ...team.assignedMembers
  ];

  const theme = getActiveCardTheme();
  all.forEach(m => {
    const cardEl = document.createElement('div');
    cardEl.className = `poker-card-element ${theme === 'track1-cyan' ? 'theme-track1' : 'theme-track2'}`;
    cardEl.setAttribute('title', `${m.name} 클릭 시 3D 확대 뷰`);
    cardEl.innerHTML = `
      ${getLikeLionCardBackHtml(theme)}
      ${getCardFrontHtml(m, theme)}
    `;

    cardEl.addEventListener('click', () => {
      openSingleCardInspector(m);
    });

    focusBodyCards.appendChild(cardEl);
  });

  teamFocusModal.classList.add('active');
}

/**
 * Reset Table State
 * Requirement #4: Unified Single Card Deck Session
 * Starts automatically with Track 1 (6 members), then smoothly flows to Track 2!
 */
function resetApplication() {
  currentStep = 0;
  currentSpotlight = null;
  currentTrackKey = 'track1';
  activeTrackConfig = clubTracks.track1;

  if (hudTrackLabel) {
    hudTrackLabel.textContent = '2026 TEAM BUILDING';
  }

  // Reset Track 1 corner stash dock
  if (track1StashDock) {
    track1StashDock.classList.remove('visible');
    track1StashDock.onclick = null;
  }

  teamManager = new MultiTeamManager(activeTrackConfig, {
    seed: currentSeed,
    forcedOrder: forcedOrder
  });

  const arena = document.querySelector('.table-teams-arena');
  if (arena) {
    arena.classList.remove('is-single-team');
  }

  const header1Title = headers.team1?.querySelector('.team-felt-title');
  if (header1Title) {
    header1Title.textContent = '1팀';
  }

  // Requirement #3 & #4: 카드 뭉치 복원 및 1트랙 사이버 사파이어 테마로 초기화
  if (deckStack) {
    deckStack.classList.remove('is-empty');
    const theme = 'track1-cyan';
    const backHtml = getLikeLionCardBackHtml(theme);
    deckStack.innerHTML = `
      <div class="deck-stack-card">${backHtml}</div>
      <div class="deck-stack-card">${backHtml}</div>
      <div class="deck-stack-card">${backHtml}</div>
      <div class="deck-stack-card">${backHtml}</div>
      <div class="deck-stack-card">${backHtml}</div>
    `;
  }

  Object.values(headers).forEach(h => h.classList.remove('visible'));
  Object.values(rows).forEach(teamRows => {
    teamRows.leader.innerHTML = '';
    teamRows.priority.innerHTML = '';
    teamRows.regular.innerHTML = '';
  });

  flyingDimmer.classList.remove('active');
  flyingCardsLayer.innerHTML = '';
  teamFocusModal.classList.remove('active');
  closeSingleCardInspector();

  btnDealerAction.style.display = 'inline-flex';
  btnDealerAction.disabled = false;
  btnDealerAction.innerHTML = `<span>1팀 공개</span> ➔`;
  btnShowcaseOpen.style.display = 'none';
}



/**
 * Admin Modal (Requirement #9)
 */
function setupAdminModal() {
  function updateUrl() {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('seed', adminSeedInput.value.trim() || currentSeed);
    adminShareUrl.value = url.toString();
  }

  btnSecretAdmin.addEventListener('click', () => {
    adminSeedInput.value = currentSeed;
    updateUrl();
    adminModal.style.display = 'flex';
    adminModal.style.opacity = '1';
  });

  const close = () => {
    adminModal.style.display = 'none';
    adminModal.style.opacity = '0';
  };

  btnCloseAdmin.addEventListener('click', close);
  btnCancelAdmin.addEventListener('click', close);

  btnApplyAdmin.addEventListener('click', () => {
    const val = adminSeedInput.value.trim();
    if (val) currentSeed = val;
    close();
    resetApplication();
  });

  btnCopyShareUrl.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(adminShareUrl.value);
    } catch {
      adminShareUrl.select();
      document.execCommand('copy');
    }
  });

  adminSeedInput.addEventListener('input', updateUrl);

  window.addEventListener('keydown', (e) => {
    if ((e.shiftKey && e.altKey && e.key.toLowerCase() === 's') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
      e.preventDefault();
      adminModal.style.display = 'flex';
      adminModal.style.opacity = '1';
    }
  });
}

function init() {
  parseUrlParams();

  particleEngine = new ParticleEngine(canvas);
  teamManager = new MultiTeamManager(activeTrackConfig, {
    seed: currentSeed,
    forcedOrder: forcedOrder
  });

  btnDealerAction.addEventListener('click', handleMasterStep);
  btnShowcaseOpen.addEventListener('click', () => openFocusShowcase(0));

  if (hudTrackLabel) {
    hudTrackLabel.textContent = '2026 TEAM BUILDING';
  }

  // Focus Navigation
  btnFocusPrev.addEventListener('click', () => {
    if (currentFocusTeamIdx > 0) {
      openFocusShowcase(currentFocusTeamIdx - 1);
    } else {
      openFocusShowcase(2);
    }
  });

  btnFocusNext.addEventListener('click', () => {
    if (currentFocusTeamIdx < 2) {
      openFocusShowcase(currentFocusTeamIdx + 1);
    } else {
      openFocusShowcase(0);
    }
  });

  btnFocusClose.addEventListener('click', () => {
    teamFocusModal.classList.remove('active');
  });

  btnInspectClose.addEventListener('click', closeSingleCardInspector);
  inspectModalBackdrop.addEventListener('click', closeSingleCardInspector);

  btnSoundToggle.addEventListener('click', () => {
    const muted = soundFx.toggleMute();
    btnSoundToggle.textContent = muted ? '🔇' : '🔊';
  });

  btnResetApp.addEventListener('click', resetApplication);

  setupAdminModal();
  resetApplication();
}

window.addEventListener('DOMContentLoaded', init);
