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
import {amplify} from 'amplify';

import {isEscapeKey} from 'Util/KeyboardUtil';

import {WebAppEvents} from '../../event/WebApp';
import {MessageCategory} from '../../message/MessageCategory';
import {ContentViewModel} from '../ContentViewModel';
import {CollectionDetailsViewModel} from './CollectionDetailsViewModel';
import {ConversationRepository} from '../../conversation/ConversationRepository';
import {Conversation} from '../../entity/Conversation';
import {ContentMessage} from '../../entity/message/ContentMessage';

export class CollectionViewModel {
  private readonly collectionDetails: CollectionDetailsViewModel;
  private readonly conversationRepository: ConversationRepository;
  private readonly conversationEntity: ko.Observable<Conversation>;
  private readonly audio: ko.ObservableArray<ContentMessage>;
  private readonly files: ko.ObservableArray<ContentMessage>;
  private readonly images: ko.ObservableArray<ContentMessage>;
  private readonly links: ko.ObservableArray<ContentMessage>;
  private readonly searchInput: ko.Observable<string>;

  constructor(contentViewModel: ContentViewModel, repositories: {conversation: ConversationRepository}) {
    this.collectionDetails = contentViewModel.collectionDetails;
    this.conversationRepository = repositories.conversation;

    this.conversationEntity = ko.observable();

    this.audio = ko.observableArray().extend({rateLimit: 1});
    this.files = ko.observableArray().extend({rateLimit: 1});
    this.images = ko.observableArray().extend({rateLimit: 1});
    this.links = ko.observableArray().extend({rateLimit: 1});

    this.searchInput = ko.observable('');
  }

  addedToView = (): void => {
    amplify.subscribe(WebAppEvents.CONVERSATION.EPHEMERAL_MESSAGE_TIMEOUT, this.messageRemoved);
    amplify.subscribe(WebAppEvents.CONVERSATION.MESSAGE.ADDED, this.itemAdded);
    amplify.subscribe(WebAppEvents.CONVERSATION.MESSAGE.REMOVED, this.itemRemoved);
    document.addEventListener('keydown', this.handleEscapeKey);
  };

  handleEscapeKey = (event: KeyboardEvent): void => {
    if (isEscapeKey(event)) {
      this.closeView();
    }
  };

  searchInConversation = (query: string): Promise<void> =>
    this.conversationRepository.searchInConversation(this.conversationEntity(), query);

  onInputChange = (input: string): void => this.searchInput(input || '');

  itemAdded = (messageEntity: ContentMessage): void => {
    const isCurrentConversation = this.conversationEntity().id === messageEntity.conversation_id;
    if (isCurrentConversation) {
      this._populateItems([messageEntity]);
    }
  };

  itemRemoved = (messageId: string, conversationId: string): void => {
    const isCurrentConversation = this.conversationEntity().id === conversationId;
    if (isCurrentConversation) {
      const _removeItem = (messageEntity: ContentMessage) => messageEntity.id === messageId;
      [this.audio, this.files, this.images, this.links].forEach(array => array.remove(_removeItem));
    }
  };

  messageRemoved = (messageEntity: ContentMessage): void =>
    this.itemRemoved(messageEntity.id, messageEntity.conversation_id);

  removedFromView = (): void => {
    amplify.unsubscribe(WebAppEvents.CONVERSATION.EPHEMERAL_MESSAGE_TIMEOUT, this.messageRemoved);
    amplify.unsubscribe(WebAppEvents.CONVERSATION.MESSAGE.ADDED, this.itemAdded);
    amplify.unsubscribe(WebAppEvents.CONVERSATION.MESSAGE.REMOVED, this.itemRemoved);
    document.removeEventListener('keydown', this.handleEscapeKey);
    this.conversationEntity(null);
    this.searchInput('');
    [this.images, this.files, this.links, this.audio].forEach(array => array.removeAll());
  };

  setConversation = (conversationEntity = this.conversationRepository.active_conversation()): void => {
    if (conversationEntity) {
      this.conversationEntity(conversationEntity);

      this.conversationRepository
        .get_events_for_category(conversationEntity, MessageCategory.LINK_PREVIEW)
        .then(messageEntities => this._populateItems(messageEntities));
    }
  };

  _populateItems(messageEntities: ContentMessage[]): void {
    messageEntities.forEach(messageEntity => {
      if (!messageEntity.is_expired()) {
        // TODO: create binary map helper
        const isImage = messageEntity.category & MessageCategory.IMAGE;
        const isGif = messageEntity.category & MessageCategory.GIF;
        if (isImage && !isGif) {
          return this.images.push(messageEntity);
        }

        const isFile = messageEntity.category & MessageCategory.FILE;
        if (isFile) {
          const isAudio = messageEntity.get_first_asset().is_audio();
          return isAudio ? this.audio.push(messageEntity) : this.files.push(messageEntity);
        }

        const isLinkPreview = messageEntity.category & MessageCategory.LINK_PREVIEW;
        if (isLinkPreview) {
          this.links.push(messageEntity);
        }
      }
      return null;
    });
  }

  clickOnMessage = (messageEntity: ContentMessage): void => {
    amplify.publish(WebAppEvents.CONVERSATION.SHOW, this.conversationEntity(), {exposeMessage: messageEntity});
  };

  closeView = () => amplify.publish(WebAppEvents.CONVERSATION.SHOW, this.conversationEntity());

  clickOnSection(category: string, items: ContentMessage[]): void {
    this.collectionDetails.setConversation(this.conversationEntity(), category, [].concat(items));
    amplify.publish(WebAppEvents.CONTENT.SWITCH, ContentViewModel.STATE.COLLECTION_DETAILS);
  }

  clickOnImage = (messageEntity: ContentMessage): void => {
    amplify.publish(WebAppEvents.CONVERSATION.DETAIL_VIEW.SHOW, messageEntity, this.images(), 'collection');
  };
}
