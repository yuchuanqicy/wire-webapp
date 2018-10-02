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

'use strict';

window.z = window.z || {};
window.z.components = z.components || {};

z.components.RichTextInput = class RichTextInput {
  constructor(params, {element}) {
    this.inputElement = element.querySelector('.rich-text-editable');
    this.placeholder = params.placeholder;
    this.mentionsObservable = params.mentionsObservable;
    this.inputObservable = params.inputObservable;
    this.addTextObservable = params.addTextObservable;
  }

  onKeyDown() {}
  onKeyUp() {}
  onSelectStart() {}
  onInput() {
    this.inputObservable(this.inputElement.textContent);
  }
  onEnter() {}
  onClick() {}
};

ko.components.register('rich-text-input', {
  template: `
    <div
      class="rich-text-editable"
      contenteditable
      data-bind="
        events:{
          keydown: onKeyDown,
          keyup: onKeyUp,
          selectstart: onSelectStart
          input: onInput
        },
        click: onClick,
        enter: onEnter,
        attr: {
          'data-placeholder': placeholder
        }
    "></div>
  `,
  viewModel: {
    createViewModel(params, componentInfo) {
      return new z.components.RichTextInput(params, componentInfo);
    },
  },
});
