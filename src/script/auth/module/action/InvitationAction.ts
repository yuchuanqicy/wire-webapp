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

import {NewTeamInvitation} from '@wireapp/api-client/dist/team';
import {Role} from '@wireapp/api-client/dist/team/member';
import {ThunkAction} from '../reducer';
import * as InviteSelector from '../selector/InviteSelector';
import * as languageSelector from '../selector/LanguageSelector';
import * as selfSelector from '../selector/SelfSelector';
import {BackendError} from './BackendError';
import {InvitationActionCreator} from './creator/';

export class InvitationAction {
  invite = (invitation: {email: string}): ThunkAction => {
    return async (dispatch, getState, {apiClient}) => {
      dispatch(InvitationActionCreator.startAddInvite());
      const state = getState();
      const inviteList = InviteSelector.getInvites(state);
      const invitationEmail = invitation.email?.toLowerCase();
      const alreadyInvited = inviteList.find(inviteItem => inviteItem.email.toLowerCase() === invitationEmail);
      if (alreadyInvited) {
        const error = new BackendError({
          code: 409,
          label: BackendError.LABEL.ALREADY_INVITED,
          message: 'This email has already been invited',
        });
        dispatch(InvitationActionCreator.failedAddInvite(error));
        throw error;
      }

      const newInvite: NewTeamInvitation = {
        email: invitationEmail,
        inviter_name: selfSelector.getSelfName(state),
        locale: languageSelector.getLanguage(state),
        role: Role.MEMBER,
      };

      const teamId = selfSelector.getSelfTeamId(state);
      try {
        const createdInvite = await apiClient.teams.invitation.api.postInvitation(teamId, newInvite);
        dispatch(InvitationActionCreator.successfulAddInvite(createdInvite));
      } catch (error) {
        dispatch(InvitationActionCreator.failedAddInvite(error));
        throw error;
      }
    };
  };

  resetInviteErrors = (): ThunkAction => {
    return async dispatch => {
      dispatch(InvitationActionCreator.resetError());
    };
  };
}

export const invitationAction = new InvitationAction();
