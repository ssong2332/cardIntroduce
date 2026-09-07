/**
 * LikeLion Official Vector Assets & Unified Card Components
 * Provides:
 * 1. Monogram Card Back using user's provided official logo rotated 45 degrees in repeated pattern.
 * 2. Super Clean Card Front strictly containing: Team Leader Status, Name, Role, Stack tags.
 */

import officialLogoUrl from './assets/likelion_logo_official.png';

export const OFFICIAL_LOGO_PATH = officialLogoUrl;

/**
 * Returns LikeLion Card Back HTML
 * Features:
 * - 45-degree rotated official orange logo repeated in geometric diamond grid
 * - Luxury gold/orange double-line card borders with corner studs
 * - Center medallion featuring upright official emblem and 'LIKE LION' brand
 */
/**
 * Returns LikeLion Card Back HTML
 * Distinct luxury themes:
 * - track1: Cyber Sapphire & Neon Cyan Futuristic Vector Art
 * - track2: Luxury 24K Gold & LikeLion Classic Orange Monogram
 */
export function getLikeLionCardBackHtml(trackTheme = 'track2') {
  const isTrack1 = trackTheme === 'track1' || trackTheme === 'track1-cyan';

  if (isTrack1) {
    // 1트랙: 사이버 사파이어 & 일렉트릭 시안 테마
    return `
      <div class="card-face poker-card-back theme-track1-back">
        <svg class="card-back-svg-art" viewBox="0 0 100 145" preserveAspectRatio="none">
          <defs>
            <pattern id="likelion-t1-pattern" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="18" height="18" fill="#060c18"/>
              <image href="${OFFICIAL_LOGO_PATH}" x="2" y="2" width="14" height="14" preserveAspectRatio="xMidYMid meet" opacity="0.32" style="filter: hue-rotate(170deg) brightness(1.2);"/>
              <circle cx="1" cy="1" r="0.8" fill="#00e5ff" opacity="0.65"/>
            </pattern>

            <linearGradient id="t1-cyan-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#e0f7fa"/>
              <stop offset="45%" stop-color="#00e5ff"/>
              <stop offset="100%" stop-color="#0369a1"/>
            </linearGradient>

            <radialGradient id="t1-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#082f49"/>
              <stop offset="85%" stop-color="#071526"/>
              <stop offset="100%" stop-color="#020617"/>
            </radialGradient>
          </defs>

          <!-- Base Card Surface -->
          <rect width="100" height="145" rx="6" fill="#060c18"/>

          <!-- Repeated Pattern -->
          <rect x="4" y="4" width="92" height="137" rx="4" fill="url(#likelion-t1-pattern)"/>

          <!-- Cyber Frames -->
          <rect x="3.5" y="3.5" width="93" height="138" rx="5" fill="none" stroke="url(#t1-cyan-grad)" stroke-width="1.2"/>
          <rect x="6.5" y="6.5" width="87" height="132" rx="3.5" fill="none" stroke="#00e5ff" stroke-width="0.6" stroke-opacity="0.85"/>

          <!-- Corner Cyber Studs -->
          <circle cx="6.5" cy="6.5" r="1.3" fill="#00e5ff"/>
          <circle cx="93.5" cy="6.5" r="1.3" fill="#00e5ff"/>
          <circle cx="6.5" cy="138.5" r="1.3" fill="#00e5ff"/>
          <circle cx="93.5" cy="138.5" r="1.3" fill="#00e5ff"/>

          <!-- Center Emblem Medallion (Hexagonal Tech Shield) -->
          <polygon points="50,51 68,61.5 68,83.5 50,94 32,83.5 32,61.5" fill="url(#t1-center-glow)" stroke="url(#t1-cyan-grad)" stroke-width="1.4"/>
          <polygon points="50,54 65,63 65,82 50,91 35,82 35,63" fill="none" stroke="#00e5ff" stroke-width="0.6" stroke-dasharray="1.8 1.2" stroke-opacity="0.85"/>

          <!-- Logo Image -->
          <image href="${OFFICIAL_LOGO_PATH}" x="37" y="59.5" width="26" height="20" preserveAspectRatio="xMidYMid meet" style="filter: hue-rotate(170deg) brightness(1.3);"/>

          <!-- Typography -->
          <text x="50" y="85" font-family="'Montserrat', sans-serif" font-weight="900" font-size="4.2" fill="#ffffff" text-anchor="middle" letter-spacing="0.8">TRACK 01</text>
          <text x="50" y="89.5" font-family="'Montserrat', sans-serif" font-weight="700" font-size="2.4" fill="#00e5ff" text-anchor="middle" letter-spacing="0.6">TECH BUILD</text>
        </svg>
        <div class="card-sheen-overlay"></div>
      </div>
    `;
  }

  // 2트랙: 클래식 럭셔리 24K 골드 & 라이언 오렌지 테마
  return `
    <div class="card-face poker-card-back theme-track2-back">
      <svg class="card-back-svg-art" viewBox="0 0 100 145" preserveAspectRatio="none">
        <defs>
          <!-- 45-degree rotated official logo repeated pattern -->
          <pattern id="likelion-diag-pattern" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="18" height="18" fill="#141416"/>
            <image href="${OFFICIAL_LOGO_PATH}" x="2" y="2" width="14" height="14" preserveAspectRatio="xMidYMid meet" opacity="0.38"/>
            <circle cx="1" cy="1" r="0.8" fill="#FF7710" opacity="0.5"/>
          </pattern>

          <linearGradient id="back-gold-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fed7aa"/>
            <stop offset="50%" stop-color="#FF7710"/>
            <stop offset="100%" stop-color="#9a3412"/>
          </linearGradient>

          <radialGradient id="back-medallion-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#241e1b"/>
            <stop offset="85%" stop-color="#121214"/>
            <stop offset="100%" stop-color="#0a0a0c"/>
          </radialGradient>
        </defs>

        <!-- Base Card Surface -->
        <rect width="100" height="145" rx="6" fill="#121214"/>

        <!-- 45-degree Rotated Repeated Logo Pattern -->
        <rect x="4" y="4" width="92" height="137" rx="4" fill="url(#likelion-diag-pattern)"/>

        <!-- Double Gold Luxury Outer & Inner Frames -->
        <rect x="3.5" y="3.5" width="93" height="138" rx="5" fill="none" stroke="url(#back-gold-grad)" stroke-width="1.2"/>
        <rect x="6.5" y="6.5" width="87" height="132" rx="3.5" fill="none" stroke="#FF7710" stroke-width="0.6" stroke-opacity="0.75"/>

        <!-- Corner Filigree Studs -->
        <circle cx="6.5" cy="6.5" r="1.3" fill="#FF7710"/>
        <circle cx="93.5" cy="6.5" r="1.3" fill="#FF7710"/>
        <circle cx="6.5" cy="138.5" r="1.3" fill="#FF7710"/>
        <circle cx="93.5" cy="138.5" r="1.3" fill="#FF7710"/>

        <!-- Center Emblem Medallion -->
        <circle cx="50" cy="72.5" r="22" fill="url(#back-medallion-glow)" stroke="url(#back-gold-grad)" stroke-width="1.4"/>
        <circle cx="50" cy="72.5" r="19" fill="none" stroke="#FF7710" stroke-width="0.6" stroke-dasharray="1.8 1.2" stroke-opacity="0.8"/>

        <!-- Center Official Logo Image -->
        <image href="${OFFICIAL_LOGO_PATH}" x="37" y="58.5" width="26" height="20" preserveAspectRatio="xMidYMid meet"/>

        <!-- Typography -->
        <text x="50" y="84" font-family="'Montserrat', sans-serif" font-weight="900" font-size="4.2" fill="#ffffff" text-anchor="middle" letter-spacing="0.7">LIKE LION</text>
        <text x="50" y="88.5" font-family="'Montserrat', sans-serif" font-weight="700" font-size="2.4" fill="#FF7710" text-anchor="middle" letter-spacing="0.5">EST. 2013</text>
      </svg>
      <div class="card-sheen-overlay"></div>
    </div>
  `;
}

/**
 * Returns Card Front HTML strictly containing:
 * 1. Leader Status (팀장 여부)
 * 2. Profile Avatar
 * 3. Name (이름)
 * 4. Role (역할: 기획, 디자인, 프론트엔드, 백엔드 등)
 * 5. Stack (스택)
 */
export function getCardFrontHtml(member, trackTheme = 'track2') {
  const tier = member.cardTier || 'regular';
  const isTrack1 = trackTheme === 'track1' || trackTheme === 'track1-cyan';
  const themeClass = isTrack1 ? 'card-front-track1' : 'card-front-track2';

  let tierBadge = '팀원';
  let tierClass = 'tier-regular';

  if (tier === 'leader') {
    tierBadge = '👑 팀장';
    tierClass = 'tier-leader';
  } else {
    // Requirement #5: 우선 선발되는 인원과 일반 팀원의 디자인을 동일하게 '팀원'으로 사용
    tierBadge = '팀원';
    tierClass = 'tier-regular';
  }

  const rawTags = member.tags || [];
  const tagCount = rawTags.length;
  const tagCountClass = tagCount <= 2 ? 'tags-few' : (tagCount <= 4 ? 'tags-normal' : 'tags-many');

  let tagsHtml = '';
  if (tagCount <= 2) {
    // 1~2개: 모든 뷰에서 100% 큼직하고 온전하게 표시
    tagsHtml = rawTags.map(t => `<span class="person-tag-pill">${t}</span>`).join('');
  } else {
    // 3개 이상: 앞 2개는 테이블 및 대형 뷰 공통 온전한 단어 표시
    const firstTwo = rawTags.slice(0, 2).map(t => `<span class="person-tag-pill">${t}</span>`).join('');
    // 3번째 이후 태그: 대형 뷰(스포트라이트, 쇼케이스, 3D)에서는 2줄로 모두 표시, 테이블 소형 뷰에서는 숨김
    const rest = rawTags.slice(2);
    const restHtml = rest.map(t => `<span class="person-tag-pill tag-extra-pill">${t}</span>`).join('');
    // 테이블 소형 뷰(118px)에서만 나타나는 '+N' 스마트 축약 배지
    const tableMoreHtml = `<span class="person-tag-pill tag-more-pill table-only-pill" title="${rest.join(', ')}">+${rest.length}</span>`;

    tagsHtml = firstTwo + restHtml + tableMoreHtml;
  }

  return `
    <div class="card-face poker-card-front ${tierClass} ${themeClass}" data-member-id="${member.id}">
      <!-- 1. Leader / Tier Status Badge -->
      <div class="person-top-bar">
        <span class="person-tier-badge">${tierBadge}</span>
      </div>

      <!-- 2. Profile Avatar Frame -->
      <div class="person-avatar-frame">
        <img class="person-avatar-img" src="${member.avatar}" alt="${member.name}" />
      </div>

      <!-- 3. Name & 4. Role -->
      <div class="person-meta-content">
        <h3 class="person-name-text">${member.name}</h3>
        <p class="person-role-text">${member.role}</p>
      </div>

      <!-- 5. Tech Stack -->
      <div class="person-tags-wrap ${tagCountClass}">
        ${tagsHtml}
      </div>

      <div class="card-sheen-overlay"></div>
    </div>
  `;
}
