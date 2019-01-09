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

import ko from 'knockout';

export default class MentionInput {
  constructor(conversationEntity, searchRepository) {
    this.suggestions = ko.observable();
    this.editedMention = ko.observable();
    this.currentList = ko.observableArray();

    this.editedMention.subscribe(editedMention => {
      if (!editedMention || !conversationEntity()) {
        return this.suggestions([]);
      }

      const candidates = conversationEntity()
        .participating_user_ets()
        .filter(userEntity => !userEntity.isService);
      this.suggestions(searchRepository.searchUserInSet(editedMention.term, candidates));
    });
  }

  /**
   * Returns a term which is a mention match together with its starting position.
   * If nothing could be matched, it returns `undefined`.
   *
   * @param {number} selectionStart - Current caret position or start of selection  (if text is marked)
   * @param {number} selectionEnd - Current caret position or end of selection (if text is marked)
   * @param {string} value - Text input
   * @returns {undefined|{startIndex: number, term: string}} Matched mention info
   */
  getMentionCandidate(selectionStart, selectionEnd, value) {
    const textInSelection = value.substring(selectionStart, selectionEnd);
    const wordBeforeSelection = value.substring(0, selectionStart).replace(/[^]*\s/, '');
    const isSpaceSelected = /\s/.test(textInSelection);

    const startOffset = wordBeforeSelection.length ? wordBeforeSelection.length - 1 : 1;
    const isSelectionStartMention = this.findMentionAtPosition(selectionStart - startOffset, this.currentList());
    const isSelectionEndMention = this.findMentionAtPosition(selectionEnd, this.currentList());
    const isOverMention = isSelectionStartMention || isSelectionEndMention;
    const isOverValidMentionString = /^@\S*$/.test(wordBeforeSelection);

    if (!isSpaceSelected && !isOverMention && isOverValidMentionString) {
      const wordAfterSelection = value.substring(selectionEnd).replace(/\s[^]*/, '');

      const term = `${wordBeforeSelection.replace(/^@/, '')}${textInSelection}${wordAfterSelection}`;
      const startIndex = selectionStart - wordBeforeSelection.length;
      return {startIndex, term};
    }

    return undefined;
  }

  updateMentionRanges(mentions, start, end, difference) {
    const remainingMentions = mentions.filter(({startIndex, endIndex}) => endIndex <= start || startIndex >= end);

    remainingMentions.forEach(mention => {
      if (mention.startIndex >= end) {
        mention.startIndex += difference;
      }
    });

    return remainingMentions;
  }

  findMentionAtPosition(position, mentions) {
    return mentions.find(({startIndex, endIndex}) => position > startIndex && position < endIndex);
  }

  detectMentionEdgeDeletion(textarea, lengthDifference) {
    const hadSelection = this.selectionStart() !== this.selectionEnd();
    if (hadSelection) {
      return null;
    }
    if (lengthDifference >= 0) {
      return null;
    }
    const currentSelectionStart = textarea.selectionStart;
    const forwardDeleted = currentSelectionStart === this.selectionStart();
    const checkPosition = forwardDeleted ? currentSelectionStart + 1 : currentSelectionStart;
    return this.findMentionAtPosition(checkPosition, this.currentList());
  }

  updateMentions(event) {
    const textarea = event.target;
    const value = textarea.value;
    const previousValue = this.input();

    const lengthDifference = value.length - previousValue.length;
    const edgeMention = this.detectMentionEdgeDeletion(textarea, lengthDifference);
    if (edgeMention) {
      textarea.value = this.input();
      textarea.selectionStart = edgeMention.startIndex;
      textarea.selectionEnd = edgeMention.endIndex;
    }
  }

  handleMentionFlow(text, selectionStart, selectionEnd) {
    const mentionCandidate = this.getMentionCandidate(selectionStart, selectionEnd, text);
    this.editedMention(mentionCandidate);
  }

  endMentionFlow() {
    this.editedMention(undefined);
    this.updateSelectionState();
  }
}
