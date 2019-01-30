/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

class RichTextInput {
  static get CONFIG() {
    return {
      MENTION_CLASS: 'input-mention',
    };
  }
  constructor(params, {element}) {
    this.inputElement = element.querySelector('.rich-text-editable');
    this.placeholder = params.placeholder;
    this.inputObservable = params.inputObservable;
    this.addTextObservable = params.addTextObservable;
    this.onKeyDown = params.onKeyDown;
    this.onInputKeyUp = params.onInputKeyUp;
    this.onEnter = params.onEnter;
    //this.inputObservable.subscribe(text => (this.inputElement.textContent = text));
    this.selectionStart = params.selectionStart;
    this.selectionEnd = params.selectionEnd;
    this.mentionInput = params.mentionInput;
    this.emojiInput = params.emojiInput;
    this.onKeyUp = this.onKeyUp.bind(this);

    this.richText = ko.pureComputed(() => {
      const mentionAttributes = ` class="${RichTextInput.CONFIG.MENTION_CLASS}" data-uie-name="item-input-mention"`;
      const pieces = this.mentionInput
        .currentList()
        .slice()
        .reverse()
        .reduce(
          (currentPieces, mentionEntity) => {
            const currentPiece = currentPieces.shift();
            currentPieces.unshift(currentPiece.substr(mentionEntity.endIndex));
            currentPieces.unshift(currentPiece.substr(mentionEntity.startIndex, mentionEntity.length));
            currentPieces.unshift(currentPiece.substr(0, mentionEntity.startIndex));
            return currentPieces;
          },
          [this.inputObservable()]
        );

      return pieces
        .map((piece, index) => {
          if (piece.length === 0) {
            return '';
          }
          const textPiece = z.util.SanitizationUtil.escapeString(piece).replace(/[\r\n]/g, '<br>');
          const isMention = index % 2;
          return isMention ? `<span${mentionAttributes}>${textPiece}</span>` : textPiece;
        })
        .join('')
        .replace(/<br><\/span>$/, '<br>&nbsp;</span>');
    });

    params.onInit();

    this.richText.subscribe(richText => {
      this.inputElement.innerHTML = richText; // eslint-disable-line no-unsanitized/property
      this.restoreSelection();
    });
  }

  onSelectStart() {}
  onClick() {}
  onInput(data, event) {
    const previousText = this.inputObservable();
    const newText = this.inputElement.textContent;
    this.updateSelection();
    this.inputObservable(newText);
    this.mentionInput.updateMentions(event, previousText, newText);
    this.mentionInput.handleMentionFlow(this.inputElement.textContent, this.selectionStart(), this.selectionEnd());
  }

  onKeyUp(data, keyboardEvent) {
    if (!this.mentionInput.editedMention()) {
      this.emojiInput.onInputKeyUp(data, keyboardEvent);
    }
    if (keyboardEvent.key !== z.util.KeyboardUtil.KEY.ESC) {
      this.mentionInput.handleMentionFlow(this.inputElement.textContent, this.selectionStart(), this.selectionEnd());
    }
  }

  updateSelection() {
    const selection = document.getSelection();
    const anchorMention = this.getClosestMention(selection.anchorNode);
    const focusMention = this.getClosestMention(selection.focusNode);
    const range = selection.getRangeAt(0);
    const position = selection.anchorNode.compareDocumentPosition(selection.focusNode);
    const isBeforeInSameNode = !position && selection.anchorOffset < selection.focusOffset;
    const isLtr = isBeforeInSameNode || position !== Node.DOCUMENT_POSITION_PRECEDING;
    if (anchorMention) {
      if (isLtr) {
        range.setStartBefore(anchorMention);
      } else {
        range.setEndAfter(anchorMention);
      }
    }
    if (focusMention) {
      if (isLtr) {
        range.setEndAfter(focusMention);
      } else {
        range.setStartBefore(focusMention);
      }
    }
    this.selectionStart(this.getStartFromRange(range.startContainer, range.startOffset));
    const length = range.toString().length;
    this.selectionEnd(this.selectionStart() + length);

    return true;
  }
  getClosestMention(node) {
    const element = node.nodeType === 3 ? node.parentNode : node;
    return element.closest(RichTextInput.CONFIG.MENTION_CLASS);
  }

  restoreSelection() {
    const inputNodes = Array.from(this.inputElement.childNodes);
    const len = node => (node ? node.textContent.length : 0);
    const findNodeAt = (nodes, pos) => {
      let index = 0;
      let lenSum = len(nodes[index]);
      while (nodes[index + 1] && pos > lenSum) {
        index += 1;
        lenSum += len(nodes[index]);
      }
      return {
        node: nodes[index] || this.inputElement,
        offset: pos - (lenSum - len(nodes[index])),
      };
    };
    const selection = document.getSelection();
    const range = document.createRange();
    const start = findNodeAt(inputNodes, this.selectionStart());
    const end = findNodeAt(inputNodes, this.selectionEnd());
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  getStartFromRange(startContainer, startOffset) {
    const inputNodes = Array.from(this.inputElement.childNodes);
    const isTextNode = startContainer.nodeType === 3;
    const startLength = isTextNode ? startOffset : 0;
    const countNodes = isTextNode ? inputNodes.indexOf(startContainer) : startOffset;
    return inputNodes
      .slice(0, countNodes)
      .reduce((textLength, node) => textLength + node.textContent.length, startLength);
  }

  setSelection(start, end) {
    if (start !== undefined) {
      this.selectionStart(start);
    }
    if (end !== undefined) {
      this.selectionEnd(end);
    }
  }

  insertText(text) {}
}

ko.components.register('rich-text-input', {
  template: `
    <div
      class="rich-text-editable"
      contenteditable
      dir="auto"
      data-bind="
        event:{
          keydown: onKeyDown,
          keyup: onKeyUp,
          input: onInput,
          mouseup: updateSelection,
        },
        click: onClick,
        enter: onEnter,
        attr: {
          'data-placeholder': placeholder
        },
    "></div>
  `,
  viewModel: {
    createViewModel(params, componentInfo) {
      return new RichTextInput(params, componentInfo);
    },
  },
});
