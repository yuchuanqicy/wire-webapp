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
import {Notification} from '@wireapp/api-client/dist/notification/Notification';
import {WebSocketClient} from '@wireapp/api-client/dist/tcp/WebSocketClient';
import {amplify} from 'amplify';

import {Logger, getLogger} from 'Util/Logger';

import {WarningsViewModel} from '../view_model/WarningsViewModel';
import {WebAppEvents} from './WebApp';

enum CHANGE_TRIGGER {
  CLEANUP = 'CHANGE_TRIGGER.CLEANUP',
  CLOSE = 'CHANGE_TRIGGER.CLOSE',
  ERROR = 'CHANGE_TRIGGER.ERROR',
  LOGOUT = 'CHANGE_TRIGGER.LOGOUT',
  OFFLINE = 'CHANGE_TRIGGER.OFFLINE',
  ONLINE = 'CHANGE_TRIGGER.ONLINE',
  PAGE_NAVIGATION = 'CHANGE_TRIGGER.PAGE_NAVIGATION',
  PING_INTERVAL = 'CHANGE_TRIGGER.PING_INTERVAL',
  READY_STATE = 'CHANGE_TRIGGER.READY_STATE',
  WARNING_BAR = 'CHANGE_TRIGGER.WARNING_BAR',
}

export type OnNotificationCallback = (notification: Notification) => void;

export class WebSocketService {
  private readonly apiClient: APIClient;
  private readonly logger: Logger;
  private onNotification?: OnNotificationCallback;
  private firstConnect: boolean;

  static get CHANGE_TRIGGER(): typeof CHANGE_TRIGGER {
    return CHANGE_TRIGGER;
  }

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
    this.logger = getLogger('WebSocketService');

    this.firstConnect = true;
    this.onNotification = undefined;
  }

  /**
   * Establish the WebSocket connection.
   * @param onNotification Function to be called on incoming notifications
   * @returns Resolves once the WebSocket connects
   */
  async connect(onNotification: OnNotificationCallback): Promise<void> {
    this.onNotification = onNotification;

    this.apiClient.transport.ws.on(WebSocketClient.TOPIC.ON_ERROR, event => {
      this.logger.error('WebSocket connection error.', event);
      this.logger.error('WebSocketClient.TOPIC.ON_ERROR', event);
      amplify.publish(WebAppEvents.WARNING.SHOW, WarningsViewModel.TYPE.CONNECTIVITY_RECONNECT);
    });
    this.apiClient.transport.ws.on(WebSocketClient.TOPIC.ON_INVALID_TOKEN, event => {
      this.logger.error('WebSocketClient.TOPIC.ON_INVALID_TOKEN', event);
    });
    this.apiClient.transport.ws.on(WebSocketClient.TOPIC.ON_MESSAGE, notification => {
      this.logger.error('WebSocketClient.TOPIC.ON_MESSAGE', notification);
      this.onNotification(notification);
    });
    this.apiClient.transport.ws.on(WebSocketClient.TOPIC.ON_STATE_CHANGE, event => {
      this.logger.error('WebSocketClient.TOPIC.ON_STATE_CHANGE', event);
      if (event === 0) {
        // CLOSED
      }
      if (event === 1) {
        // OPEN / RECONNECT
      }
    });

    await this.apiClient.connect(async () => {
      if (!this.firstConnect) {
        amplify.publish(WebAppEvents.WARNING.DISMISS, WarningsViewModel.TYPE.CONNECTIVITY_RECONNECT);
        this.logger.warn('Re-established WebSocket connection.');
        amplify.publish(WebAppEvents.CONNECTION.ONLINE);
      } else {
        this.firstConnect = false;
      }
    });
  }
}
