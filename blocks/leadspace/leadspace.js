import { createTag } from '../../scripts/scripts.js';

/**
 * Leadspace block
 *
 */
const selectors = Object.freeze({
  videoBlock: '.leadspace.video',
  videoWrapper: '.video-wrapper',
  playButton: '.video-control.play button',
  pauseButton: '.video-control.pause button',
  openButton: 'button.open-video',
  eventItem: '.leadspace.event p:not(.button-container)',
});

const buildOpenVideoButton = (label, duration) => {
  const watchBtn = createTag('button', { class: 'open-video', type: 'button', 'aria-label': 'Play video' });
  watchBtn.innerHTML = `<span><span>${label}</span><span>${duration}</span></span><span></span>`;
  const btnContent = watchBtn.querySelector('span:nth-child(1)');
  btnContent.classList.add('video-button-content');
  btnContent.querySelector('span:nth-child(1)').classList.add('video-button-title');
  btnContent.querySelector('span:nth-child(2)').classList.add('video-button-duration');
  watchBtn.querySelector(':scope > span:nth-child(2)').classList.add('video-button-icon');
  return watchBtn;
};

const buildVideoControlButton = (type, visible = true) => {
  const controlBtn = createTag('div', { class: `video-control ${type}` });
  controlBtn.innerHTML = '<button type="button"><span aria-hidden="true"></button>';
  const btn = controlBtn.querySelector('button');
  btn.setAttribute('aria-label', `${type} video`);
  btn.style.visibility = visible ? 'visible' : 'hidden';
  return controlBtn;
};

const openVideoOverlay = () => {
  console.log('open video overlay');
};

const togglePreviewVideo = (evt) => {
  const target = evt.currentTarget;
  const action = target.classList.contains('play') ? 'play' : 'pause';
  const block = target.closest(selectors.videoBlock);
  if (action === 'play') {
    // play preview video
    block.querySelector(`${selectors.videoWrapper} video`).play();
    block.querySelector(selectors.playButton).style.visibility = 'hidden';
    block.querySelector(selectors.pauseButton).style.visibility = 'visible';
  } else {
    // pause preview video
    block.querySelector(`${selectors.videoWrapper} video`).pause();
    block.querySelector(selectors.playButton).style.visibility = 'visible';
    block.querySelector(selectors.pauseButton).style.visibility = 'hidden';
  }
};

export default function decorate(block) {
  const col1 = block.firstElementChild?.children.item(0);
  const col2 = block.firstElementChild?.children.item(1);
  const leadspaceType = block.classList.contains('video') ? 'video' : 'image';

  // decorate video
  if (leadspaceType === 'video') {
    // decorate block for displaying a video
    if (col1) {
      // watch video button
      const videoLink = col1.querySelector('p > strong > a');
      const videoDuration = col1.querySelector('p:last-of-type');
      const button = buildOpenVideoButton(videoLink.textContent, videoDuration.textContent);

      // Display video overlay
      button.addEventListener('click', openVideoOverlay);

      col1.removeChild(videoLink.closest('p'));
      col1.removeChild(videoDuration);
      col1.appendChild(button);
    }

    if (col2) {
      // convert preview link into a video
      const previewLink = col2.querySelector('a');
      const video = createTag('div', { class: 'video-wrapper' });
      video.innerHTML = `<video autoplay controls muted playsinline loop preload="auto">
        <source src="${previewLink.href}" type="video/mp4">
        </video>`;
      col2.replaceChild(video, previewLink);

      // Add preview control buttons
      const playButton = buildVideoControlButton('play', false);
      const pauseButton = buildVideoControlButton('pause');

      playButton.addEventListener('click', togglePreviewVideo);
      pauseButton.addEventListener('click', togglePreviewVideo);

      col2.appendChild(playButton);
      col2.appendChild(pauseButton);
    }

    // add scroll border decoration
    const scrollBorder = createTag('div', { class: 'scroll-border-wrapper' });
    scrollBorder.innerHTML = '<span class="scroll-border-line"></span><span class="scroll-border-text">SCROLL</span>';
    block.append(scrollBorder);

    // add video overlay
    const videoOverlay = createTag('div', { class: 'video-modal', 'aria-modal': 'true', role: 'dialog' });

    block.append(videoOverlay);

    return;
  }

  // Default (aka non-video) processing

  if (col1) {
    // group buttons
    const buttonGroup = createTag('div', { class: 'button-group' });

    const buttons = [...col1.querySelectorAll('.button-container')] || [];

    buttons.forEach((button) => {
      const isPrimary = button.querySelector('strong');
      const isSecondary = button.querySelector('em');
      // position button
      if (isPrimary) {
        button.style.order = '1';
      } else if (isSecondary) {
        button.style.order = '2';
      } else {
        button.style.order = '3';
      }
      buttonGroup.append(button);
    });

    if (buttonGroup.children.length) {
      col1.append(buttonGroup);
    }

    // group events
    const eventItems = [...col1.querySelectorAll(`${selectors.eventItem} > em`)] || [];

    const eventGroup = createTag('div', { class: 'event-group' });

    eventItems.forEach((item, index) => {
      item.parentElement?.classList.add('event-item', index === 0 ? 'location' : 'date');
      eventGroup.appendChild(item.parentElement);
    });

    if (eventGroup.children.length) {
      col1.append(eventGroup);
    }
  }
}