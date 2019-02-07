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

    this.hasSuggestions = ko.pureComputed(() => this.suggestions() && this.suggestions().length > 0);

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

  detectMentionEdgeDeletion(lengthDifference, selectionStart, selectionEnd, previousSelectionStart) {
    const hadSelection = selectionStart !== selectionEnd;
    if (hadSelection) {
      return null;
    }
    if (lengthDifference >= 0) {
      return null;
    }
    const forwardDeleted = previousSelectionStart === selectionStart;
    const checkPosition = forwardDeleted ? previousSelectionStart + 1 : previousSelectionStart;
    return this.findMentionAtPosition(checkPosition, this.currentList());
  }

  updateMentions(previousValue, newValue, selectionStart, selectionEnd, previousSelectionStart, setSelection) {
    const lengthDifference = newValue.length - previousValue.length;
    const edgeMention = this.detectMentionEdgeDeletion(
      lengthDifference,
      selectionStart,
      selectionEnd,
      previousSelectionStart
    );
    if (edgeMention) {
      setSelection(edgeMention.startIndex, edgeMention.endIndex);
    }
  }

  doesCaptureKey(key) {
    const capturedKeys = [
      z.util.KeyboardUtil.KEY.ARROW_UP,
      z.util.KeyboardUtil.KEY.ARROW_DOWN,
      z.util.KeyboardUtil.KEY.ENTER,
      z.util.KeyboardUtil.KEY.TAB,
    ];
    return this.hasSuggestions() && capturedKeys.includes(key);
  }

  handleMentionFlow(text, selectionStart, selectionEnd) {
    const mentionCandidate = this.getMentionCandidate(selectionStart, selectionEnd, text);
    this.editedMention(mentionCandidate);
  }

  endFlow() {
    this.editedMention(undefined);
  }
}
