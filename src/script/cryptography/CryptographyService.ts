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

import {APIClient} from '@wireapp/api-client';
import {ClientPreKey, PreKey} from '@wireapp/api-client/dist/auth';
import {UserClients} from '@wireapp/api-client/dist/conversation';
import {UserPreKeyBundleMap} from '@wireapp/api-client/dist/user';

export class CryptographyService {
  private readonly apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Gets a pre-key for a client of a user.
   * @see https://staging-nginz-https.zinfra.io/swagger-ui/#!/users/getPrekey
   *
   * @param {string} userId User ID
   * @param {string} clientId Client ID
   * @returns {Promise} Resolves with a pre-key for given the client of the user
   */
  getUserPreKeyByIds(userId: string, clientId: string): Promise<ClientPreKey> {
    return this.apiClient.user.api.getClientPreKey(userId, clientId);
  }

  /**
   * Gets a pre-key for each client of a user client map.
   * @see https://staging-nginz-https.zinfra.io/swagger-ui/#!/users/getMultiPrekeyBundles
   *
   * @param {Object} recipients User client map to request pre-keys for
   * @returns {Promise} Resolves with a pre-key for each client of the given map
   */
  getUsersPreKeys(recipients: UserClients): Promise<UserPreKeyBundleMap> {
    return this.apiClient.user.api.postMultiPreKeyBundles(recipients);
  }

  /**
   * Put pre-keys for client to be used by remote clients for session initialization.
   *
   * @param {string} clientId Local client ID
   * @param {Array<string>} serializedPreKeys Additional pre-keys to be made available
   * @returns {Promise} Resolves once the pre-keys are accepted
   */
  putClientPreKeys(clientId: string, serializedPreKeys: PreKey[]): Promise<void> {
    return this.apiClient.client.api.putClient(clientId, {prekeys: serializedPreKeys});
  }
}
