/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import {container} from 'tsyringe';

import UUID from 'uuidjs';
import {RichProfileRepository} from 'src/script/user/RichProfileRepository';
import {APIClientSingleton} from 'src/script/service/APIClientSingleton';

describe('RichProfileRepository', () => {
  let richProfileRepository;

  beforeEach(() => {
    richProfileRepository = new RichProfileRepository(container.resolve(APIClientSingleton).getClient());
  });

  describe('getUserRichProfile', () => {
    it("fetches the user's rich profile if it is not already in cache", () => {
      const userId = UUID.genV4().hexString;
      const response = [];
      spyOn(richProfileRepository.apiClient.user.api, 'getRichInfo').and.returnValue(Promise.resolve(response));

      return richProfileRepository.getUserRichProfile(userId).then(richProfile => {
        expect(richProfileRepository.apiClient.user.api.getRichInfo).toHaveBeenCalledTimes(1);
        expect(richProfile).toBe(response);
      });
    });
  });
});
