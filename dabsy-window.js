import { StudyObject } from '../objects/object-base.js';
import { el } from '../utilities/dom.js';
import { DabsyBridge } from './dabsy-bridge.js';

/**
 * DABSy companion window — calm, secondary
 */
export class DabsyObject extends StudyObject {
  constructor(data = {}, bridge = null) {
    super({
      ...data,
      type: 'dabsy',
      width: data.width ?? 280,
      height: data.height ?? 260,
      title: data.title ?? 'DABSy',
    });
    this.bridge = bridge;
    this.state = { ...data.state };
  }

  buildContent(container) {
    container.innerHTML = '';
    const root = this.el;
    if (root) root.classList.add('dabsy-object');

    const content = el('div', { className: 'dabsy-content' });

    const header = el('div', { className: 'dabsy-header' });
    header.append(
      el('div', { className: 'dabsy-avatar', textContent: '◇' }),
      el('span', { className: 'dabsy-name', textContent: 'DABSy' }),
      el('span', { className: 'dabsy-status', textContent: 'local' })
    );

    const messages = el('div', { className: 'dabsy-messages' });
    const hint = el('div', {
      className: 'dabsy-context-hint',
      textContent: this.bridge ? this.bridge.getSummary() : 'Ready',
    });
    messages.append(
      el('div', {
        className: 'dabsy-message system',
        textContent: 'Quiet companion. Ask about your desk.',
      }),
      hint
    );

    const inputRow = el('div', { className: 'dabsy-input-row' });
    const input = el('input', {
      className: 'dabsy-input',
      type: 'text',
      placeholder: 'Ask quietly…',
      'aria-label': 'Message DABSy',
    });
    const send = el('button', {
      className: 'dabsy-send',
      type: 'button',
      'aria-label': 'Send',
      innerHTML: '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    });

    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      messages.appendChild(
        el('div', { className: 'dabsy-message user', textContent: text })
      );
      messages.scrollTop = messages.scrollHeight;

      const reply = this.bridge
        ? await this.bridge.ask(text)
        : 'Bridge not ready.';

      messages.appendChild(
        el('div', { className: 'dabsy-message', textContent: reply })
      );
      if (this.bridge) {
        hint.textContent = this.bridge.getSummary();
      }
      messages.scrollTop = messages.scrollHeight;
    };

    send.addEventListener('click', (e) => {
      e.stopPropagation();
      sendMessage();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    inputRow.addEventListener('pointerdown', (e) => e.stopPropagation());

    inputRow.append(input, send);
    content.append(header, messages, inputRow);
    container.append(content);
  }
}
