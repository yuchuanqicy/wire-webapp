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

import {Self} from '@wireapp/api-client/dist/self';
import {actionRoot} from '.';
import {mockStoreFactory} from '../../util/test/mockStoreFactory';
import {SelfActionCreator} from './creator/';

describe('SelfAction', () => {
  it('fetches the self user', async () => {
    const selfUser = ({assets: [], id: 'selfUserId'} as unknown) as Self;
    const team = {teams: [{binding: true, id: 'team'}]};
    const expectedSelfUser = ({assets: [], id: 'selfUserId', team: 'team'} as unknown) as Self;
    const spies = {
      doCheckPasswordState: jasmine.createSpy().and.returnValue(() => Promise.resolve()),
    };
    const mockedActions = {
      selfAction: {
        doCheckPasswordState: spies.doCheckPasswordState,
      },
    };
    const mockedApiClient = {
      self: {
        api: {
          getSelf: () => Promise.resolve(selfUser),
        },
      },
      teams: {
        team: {
          api: {
            getTeams: () => Promise.resolve(team),
          },
        },
      },
    };
    const mockedCore = {};

    const store = mockStoreFactory({
      actions: mockedActions,
      apiClient: mockedApiClient,
      core: mockedCore,
    })({});
    await store.dispatch(actionRoot.selfAction.fetchSelf());

    expect(store.getActions()).toEqual([
      SelfActionCreator.startFetchSelf(),
      SelfActionCreator.successfulFetchSelf(expectedSelfUser),
    ]);

    expect(spies.doCheckPasswordState.calls.count()).toEqual(1);
  });

  it('handles failed self user fetch', async () => {
    const error = new Error('testerror');

    const mockedActions = {
      selfAction: {},
    };
    const mockedApiClient = {
      self: {
        api: {
          getSelf: () => Promise.reject(error),
        },
      },
    };

    const store = mockStoreFactory({
      actions: mockedActions,
      apiClient: mockedApiClient,
    })({});
    try {
      await store.dispatch(actionRoot.selfAction.fetchSelf());
      fail();
    } catch (backendError) {
      expect(store.getActions()).toEqual([
        SelfActionCreator.startFetchSelf(),
        SelfActionCreator.failedFetchSelf(error),
      ]);
    }
  });

  it('fetches the set password state', async () => {
    const mockedApiClient = {
      self: {api: {headPassword: () => Promise.resolve({status: 200})}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    await store.dispatch(actionRoot.selfAction.doCheckPasswordState());

    expect(store.getActions()).toEqual([
      SelfActionCreator.startSetPasswordState(),
      SelfActionCreator.successfulSetPasswordState({hasPassword: true}),
    ]);
  });

  it('fetches the unset password state', async () => {
    const mockedApiClient = {
      self: {api: {headPassword: () => Promise.reject({response: {status: 404}})}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    await store.dispatch(actionRoot.selfAction.doCheckPasswordState());

    expect(store.getActions()).toEqual([
      SelfActionCreator.startSetPasswordState(),
      SelfActionCreator.successfulSetPasswordState({hasPassword: false}),
    ]);
  });

  it('handles failed password check', async () => {
    const error = ({response: {status: 400}} as unknown) as Error;
    const mockedApiClient = {
      self: {api: {headPassword: () => Promise.reject(error)}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    try {
      await store.dispatch(actionRoot.selfAction.doCheckPasswordState());
      fail();
    } catch (backendError) {
      expect(store.getActions()).toEqual([
        SelfActionCreator.startSetPasswordState(),
        SelfActionCreator.failedSetPasswordState(error),
      ]);
    }
  });

  it('can set the self email', async () => {
    const email = 'myemail@mail.com';
    const mockedApiClient = {
      self: {api: {putEmail: () => Promise.resolve()}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    await store.dispatch(actionRoot.selfAction.doSetEmail(email));

    expect(store.getActions()).toEqual([
      SelfActionCreator.startSetSelfEmail(),
      SelfActionCreator.successfulSetSelfEmail(email),
    ]);
  });

  it('handles failed attempt to set self email', async () => {
    const email = 'myemail@mail.com';
    const error = new Error('testerror');
    const mockedApiClient = {
      self: {api: {putEmail: () => Promise.reject(error)}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    try {
      await store.dispatch(actionRoot.selfAction.doSetEmail(email));
      fail();
    } catch (backendError) {
      expect(store.getActions()).toEqual([
        SelfActionCreator.startSetSelfEmail(),
        SelfActionCreator.failedSetSelfEmail(error),
      ]);
    }
  });

  it('can set the self password', async () => {
    const password = 'password';
    const mockedApiClient = {
      self: {api: {putPassword: () => Promise.resolve()}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    await store.dispatch(actionRoot.selfAction.doSetPassword({new_password: password}));

    expect(store.getActions()).toEqual([
      SelfActionCreator.startSetSelfPassword(),
      SelfActionCreator.successfulSetSelfPassword(),
    ]);
  });

  it('handles failed attempt to set self password', async () => {
    const password = 'password';
    const error = new Error('testerror');
    const mockedApiClient = {
      self: {api: {putPassword: () => Promise.reject(error)}},
    };

    const store = mockStoreFactory({
      apiClient: mockedApiClient,
    })({});
    try {
      await store.dispatch(actionRoot.selfAction.doSetPassword({new_password: password}));
      fail();
    } catch (backendError) {
      expect(store.getActions()).toEqual([
        SelfActionCreator.startSetSelfPassword(),
        SelfActionCreator.failedSetSelfPassword(error),
      ]);
    }
  });
});
