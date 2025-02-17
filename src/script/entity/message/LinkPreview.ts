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

import {obfuscate} from 'Util/StringUtil';
import {AssetRemoteData} from '../../assets/AssetRemoteData';
import {ITweet} from '@wireapp/protocol-messaging';
import {LinkPreviewMetaDataType} from '../../links/LinkPreviewMetaDataType';

export class LinkPreview {
  private readonly image_resource: ko.Observable<AssetRemoteData>;
  private title: string;
  public url: string;
  public meta_data_type?: LinkPreviewMetaDataType;
  public meta_data?: ITweet;

  constructor(title?: string, url?: string) {
    this.title = title || '';
    this.url = url || '';

    this.image_resource = ko.observable();
    this.meta_data = undefined;
    this.meta_data_type = undefined;
  }

  obfuscate(): void {
    this.title = obfuscate(this.title);
    this.url = obfuscate(this.url);

    this.image_resource(undefined);
    this.meta_data = undefined;
    this.meta_data_type = undefined;
  }
}
