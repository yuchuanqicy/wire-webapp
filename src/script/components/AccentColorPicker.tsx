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

import {AccentColorID} from '@wireapp/commons/dist/commonjs/util/AccentColor';
import React from 'react';

interface AccentColorPickerProps {
  accentId: AccentColorID;
  setSelected: (id: AccentColorID) => void;
}

const accentColorPicker = ({accentId, setSelected}: AccentColorPickerProps) => {
  const accentColorIds: AccentColorID[] = [1, 2, 4, 5, 6, 7];
  return accentColorIds.map(id => (
    <React.Fragment key={id}>
      <input
        type="radio"
        name="accent"
        id={`accent${id}`}
        defaultChecked={accentId === id}
        onClick={() => setSelected(id)}
      />
      <label htmlFor={`accent${id}`} className={`accent-color-${id}`} />
    </React.Fragment>
  ));
};

export default accentColorPicker;
