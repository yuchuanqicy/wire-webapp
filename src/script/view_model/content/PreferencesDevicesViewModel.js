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

import {WebAppEvents} from '../../event/WebApp';
import {ClientRepository} from '../../client/ClientRepository';
import {ContentViewModel} from '../ContentViewModel';
import {MotionDuration} from '../../motion/MotionDuration';
import {sortUserDevices} from 'Components/userDevices';

window.z = window.z || {};
window.z.viewModel = z.viewModel || {};
window.z.viewModel.content = z.viewModel.content || {};

z.viewModel.content.PreferencesDevicesViewModel = class PreferencesDevicesViewModel {
  static get CONFIG() {
    return {
      SAVE_ANIMATION_TIMEOUT: MotionDuration.X_LONG * 2,
    };
  }

  constructor(mainViewModel, contentViewModel, repositories) {
    this.clickOnRemoveDevice = this.clickOnRemoveDevice.bind(this);
    this.clickOnShowDevice = this.clickOnShowDevice.bind(this);
    this.updateDeviceInfo = this.updateDeviceInfo.bind(this);

    this.clientRepository = repositories.client;
    this.cryptographyRepository = repositories.cryptography;
    this.userRepository = repositories.user;
    this.logger = getLogger('z.viewModel.content.PreferencesDevicesViewModel');

    this.actionsViewModel = mainViewModel.actions;
    this.preferencesDeviceDetails = contentViewModel.preferencesDeviceDetails;
    this.currentClient = this.clientRepository.currentClient;
    this.displayClientId = ko.pureComputed(() => (this.currentClient() ? this.currentClient().formatId() : []));

    this.activationDate = ko.observable();
    // all clients except the current client
    this.devices = ko.pureComputed(() => {
      const clients = this.clientRepository
        .clients()
        .filter(clientEntity => clientEntity.id !== this.currentClient().id);
      return sortUserDevices(clients);
    });
    this.localFingerprint = ko.observableArray([]);
    this.selfUser = this.userRepository.self;
    this.isSSO = ko.pureComputed(() => this.selfUser() && this.selfUser().isSingleSignOn);
    this.labelSaved = ko.observable();
  }

  getLabel() {
    return this.currentClient().label;
  }

  changeLabel(viewModel, event) {
    const newLabel = event.target.value.trim();

    const isUnchanged = newLabel === this.getLabel();
    if (isUnchanged) {
      return event.target.blur();
    }

    const isValidName = newLabel.length >= ClientRepository.CONFIG.MINIMUM_LABEL_LENGTH;
    if (isValidName) {
      this.clientRepository.updateClientLabel(this.selfUser().id, this.currentClient().id, newLabel).then(() => {
        this.labelSaved(true);
        event.target.blur();
        window.setTimeout(() => this.labelSaved(false), PreferencesDevicesViewModel.CONFIG.SAVE_ANIMATION_TIMEOUT);
      });
    }
  }

  clickOnShowDevice(clientEntity) {
    this.preferencesDeviceDetails.device(clientEntity);
    amplify.publish(WebAppEvents.CONTENT.SWITCH, ContentViewModel.STATE.PREFERENCES_DEVICE_DETAILS);
  }

  clickOnRemoveDevice(clientEntity, event) {
    this.actionsViewModel.deleteClient(clientEntity);
    event.stopPropagation();
  }

  resetLabelInput() {
    // if (!this.labelSaved())
    //   this.label.notifySubscribers();
    // }
  }

  updateDeviceInfo() {
    if (this.currentClient() && !this.localFingerprint().length) {
      const date = formatTimestamp(this.currentClient().time);
      this.activationDate(t('preferencesDevicesActivatedOn', {date}));
      this.localFingerprint(this.cryptographyRepository.getLocalFingerprint());
    }
  }
};
