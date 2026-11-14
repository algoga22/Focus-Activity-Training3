// One small illustration per question ("incident scene"), built with HTML/CSS + Font Awesome icons.
// Sizes are in em, so the same scene works on the projector and on a phone.

const i = (name, cls = '') => `<i class="fa-solid fa-${name} ${cls}"></i>`;

export const SCENES = {
  // Which of these are incidents? A radar scanning four situations
  q1: `<div class="scene s-radar">
      <div class="radar"><span class="sweep"></span>${i('triangle-exclamation', 'center-icon')}</div>
      <span class="blip b1">${i('mobile-screen-button')}</span><span class="blip b2">${i('key')}</span>
      <span class="blip b3">${i('envelopes-bulk')}</span><span class="blip b4">${i('address-book')}</span>
    </div>`,
  // Ransom screen
  q2: `<div class="scene s-ransom">
      <div class="monitor"><div class="screen">
        ${i('lock', 'lock')}
        <div class="glitch" data-text="YOUR FILES ARE LOCKED">YOUR FILES ARE LOCKED</div>
        <div class="pay">PAY €500 <i class="fa-brands fa-bitcoin"></i></div>
        <div class="countdown">23:59:42</div>
      </div></div><div class="stand"></div>
    </div>`,
  // Friday evening, strange link, coordinator gone
  q3: `<div class="scene s-friday">
      <div class="clock-card"><span>FRIDAY</span><b>18:00</b></div>
      <div class="laptop">${i('laptop')}<span class="bug">${i('bug')}</span></div>
      <div class="door">${i('door-closed')}<small>Coordinator<br>gone home</small></div>
    </div>`,
  // Writing things down
  q4: `<div class="scene s-notes">
      <div class="notepad"><b>Incident notes</b><span>What happened?</span><span>When?</span><span>What did I see?</span>${i('pencil', 'pencil')}</div>
      <div class="photo">${i('camera')}<span class="flash"></span></div>
    </div>`,
  // "Just delete it"
  q5: `<div class="scene s-mail">
      <div class="mail">${i('envelope')}<span class="hook">${i('fish')}</span></div>
      <div class="bubble">"Just delete it and forget about it!"</div>
    </div>`,
};
