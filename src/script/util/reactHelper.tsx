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
import React, {ComponentType} from 'react';
import ReactDOM from 'react-dom';

export function wrapReactComponent(
  Component: ComponentType,
  name: string,
  paramMapper: Record<string, string[]>,
): void {
  ko.components.register(name, {
    template: '<!-- ignore me -->',
    viewModel: {
      createViewModel(params: Record<string, ko.Observable>, {element}: {element: HTMLElement}) {
        const reactParams = !paramMapper
          ? params
          : Object.entries(paramMapper).reduce((newParams: Record<string, unknown>, [name, [varName, setterName]]) => {
              if (varName) {
                newParams[varName] = params[name]();
              }
              if (setterName) {
                newParams[setterName] = (value: unknown) => params[name](value);
              }
              return newParams;
            }, {});

        ReactDOM.render(<Component {...reactParams} />, element);
      },
    },
  });
}
