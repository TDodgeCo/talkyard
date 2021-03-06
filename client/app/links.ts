/*
 * Copyright (c) 2016 Kaj Magnus Lindberg
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// In this file: Constructs links, e.g. to a user's profile page.
// Usage: MenuItemLink({ href: linkToCurrentUserProfilePage(store) }, "View your profile")

/// <reference path="prelude.ts"/>
/// <reference path="utils/utils.ts"/>

//------------------------------------------------------------------------------
   namespace debiki2 {
//------------------------------------------------------------------------------

const origin = eds.isInEmbeddedCommentsIframe ? eds.serverOrigin : '';


export function assetsOrigin(): string {
  // CLEAN_UP incl assetsOrigin in the data from the server, rather than eds.uploadsUrlPrefix.
  // This removes the url path from '(https:)//cdn-or-server-origin/-/u/', and ensures
  // the protocol is ... hmm, that of the current page. Might not work, if testing on
  // localhost with http:, and using a https-CDN-assets-origin.
  return location.protocol +
    eds.uploadsUrlPrefix.replace('/-/u/', '').replace('https:', '').replace('http:', '');
}

export function linkToPageId(pageId: PageId): string {
  return origin + '/-' + pageId;
}


export function linkToPostNr(pageId: PageId, postNr: PostNr): string {
  return linkToPageId(pageId) + '#post-' + postNr;
}


export function linkToAdminPage(me: Myself): string {
  // By default, redirects to path not available to non-admins. So send non-admins to reviews section.
  const morePath = me.isAdmin ? '' : 'review/all';
  return origin + '/-/admin/' + morePath;
}

export function linkToAdminPageAdvancedSettings(hostname?: string): string {
  const origin = hostname ? '//' + hostname : '';   // ?? or just reuse 'origin' from above ?
  return origin + '/-/admin/settings/advanced';
}

export function linkToUserInAdminArea(userId: UserId): string {
  return '/-/admin/users/id/' + userId;
}

export function linkToReviewPage(): string {
  return '/-/admin/review/all';
}


export function linkToUserProfilePage(userIdOrUsername: UserId | string): string {
  return origin + '/-/users/' + userIdOrUsername;
}

export function linkToUsersNotfs(userIdOrUsername: UserId | string): string {
  return linkToUserProfilePage(userIdOrUsername) + '/notifications';
}

export function linkToSendMessage(userIdOrUsername: UserId | string): string {
  return linkToUserProfilePage(userIdOrUsername) + '/activity/posts#writeMessage';
}

export function linkToInvitesFromUser(userId: UserId): string {
  return linkToUserProfilePage(userId) + '/invites';
}

export function linkToMyProfilePage(store: Store): string {
  return origin + '/-/users/' + store.me.id;
}


export function linkToNotificationSource(notf: Notification): string {
  if (notf.pageId && notf.postNr) {
    return '/-' + notf.pageId + '#post-' + notf.postNr;
  }
  else {
    die("Unknown notification type [EsE5GUKW2]")
  }
}


export function linkToRedirToAboutCategoryPage(categoryId: CategoryId): string {
  return '/-/redir-to-about?categoryId=' + categoryId;
}


export function linkToTermsOfUse(): string {
  return '/-/terms-of-use';
}

export function linkToAboutPage(): string {
  return '/about';
}


export function rememberBackUrl(url: string) {
  // Skip API pages — those are the ones we're returning *from*. (Don't require === 0 match;
  // there might be a hostname. Matching anywhere is ok, because the prefix is '/-/' and
  // that substring isn't allowed in other non-api paths.)
  if (url.search(ApiUrlPathPrefix) >= 0) {
    return;
  }
  debiki2.putInSessionStorage('returnToSiteUrl', url);
}


/**
 * Navigates back to the page that the user viewed before s/he entered the admin or
 * about-user area, or to the homepage ('/') if there's no previous page.
 */
export function goBackToSite() {
  // Hmm, could inline this instead. Was more complicated in the past, when using
  // an URL param instead of sessionStorage.
  const previousUrl = getFromSessionStorage('returnToSiteUrl') || '/';
  window.location.replace(previousUrl);
}


export function externalLinkToAdminHelp(): string {
  return 'https://www.talkyard.io/forum/latest/support';
}

//------------------------------------------------------------------------------
   }
//------------------------------------------------------------------------------
// vim: fdm=marker et ts=2 sw=2 tw=0 fo=r list
