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

import {getLogger} from 'Util/Logger';
import {t} from 'Util/LocalizerUtil';
import {formatTimestamp} from 'Util/TimeUtil';

import {Config} from '../../Config';
import {WebAppEvents} from '../../event/WebApp';
import {MotionDuration} from '../../motion/MotionDuration';
import {ContentViewModel} from '../ContentViewModel';

window.z = window.z || {};
window.z.viewModel = z.viewModel || {};
window.z.viewModel.content = z.viewModel.content || {};

z.viewModel.content.PreferencesDeviceDetailsViewModel = class PreferencesDeviceDetailsViewModel {
  static get SESSION_RESET_STATE() {
    return {
      CONFIRMATION: 'confirmation',
      ONGOING: 'ongoing',
      RESET: 'reset',
    };
  }

  constructor(mainViewModel, contentViewModel, repositories) {
    this.clientRepository = repositories.client;
    this.conversationRepository = repositories.conversation;
    this.cryptographyRepository = repositories.cryptography;
    this.logger = getLogger('z.viewModel.content.PreferencesDeviceDetailsViewModel');

    this.actionsViewModel = mainViewModel.actions;
    this.selfUser = this.clientRepository.selfUser;

    this.activationDate = ko.observable();
    this.device = ko.observable();
    this.fingerprint = ko.observableArray([]);
    this.sessionResetState = ko.observable(PreferencesDeviceDetailsViewModel.SESSION_RESET_STATE.RESET);
    this.brandName = Config.getConfig().BRAND_NAME;

    this.device.subscribe(clientEntity => {
      if (clientEntity) {
        this.sessionResetState(PreferencesDeviceDetailsViewModel.SESSION_RESET_STATE.RESET);
        this._updateFingerprint();
        const date = formatTimestamp(clientEntity.time);
        this.activationDate(t('preferencesDevicesActivatedOn', {date}));
      }
    });
  }

  _updateFingerprint() {
    this.fingerprint([]);

    this.cryptographyRepository
      .getRemoteFingerprint(this.selfUser().id, this.device().id)
      .then(fingerprint => this.fingerprint(fingerprint));
  }

  clickOnDetailsClose() {
    amplify.publish(WebAppEvents.CONTENT.SWITCH, ContentViewModel.STATE.PREFERENCES_DEVICES);
    this.device(null);
  }

  clickOnResetSession() {
    this.sessionResetState(PreferencesDeviceDetailsViewModel.SESSION_RESET_STATE.ONGOING);

    const selfConversationId = this.conversationRepository.self_conversation().id;
    this.conversationRepository
      .reset_session(this.selfUser().id, this.device().id, selfConversationId)
      .then(() => {
        window.setTimeout(() => {
          this.sessionResetState(PreferencesDeviceDetailsViewModel.SESSION_RESET_STATE.CONFIRMATION);
        }, MotionDuration.LONG);

        window.setTimeout(() => {
          this.sessionResetState(PreferencesDeviceDetailsViewModel.SESSION_RESET_STATE.RESET);
        }, 5000);
      })
      .catch(error => {
        this.sessionResetState(PreferencesDeviceDetailsViewModel.SESSION_RESET_STATE.RESET);
        throw error;
      });
  }

  clickOnRemoveDevice() {
    this.actionsViewModel.deleteClient(this.device()).then(() => this.clickOnDetailsClose());
  }

  toggleDeviceVerification() {
    const toggleVerified = !this.device().meta.isVerified();
    this.clientRepository.verifyClient(this.selfUser().id, this.device(), toggleVerified);
  }
};
