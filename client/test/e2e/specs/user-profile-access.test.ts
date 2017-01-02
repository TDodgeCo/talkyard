/// <reference path="../test-types.ts"/>
/// <reference path="../../../../modules/definitely-typed/lodash/lodash.d.ts"/>
/// <reference path="../../../../modules/definitely-typed/mocha/mocha.d.ts"/>

import * as _ from 'lodash';
import server = require('../utils/server');
import utils = require('../utils/utils');
import pagesFor = require('../utils/pages-for');
import settings = require('../utils/settings');
import buildSite = require('../utils/site-builder');
import assert = require('assert');
import logAndDie = require('../utils/log-and-die');
import c = require('../test-constants');

declare let browser: any;

let forum;

let everyone;
let owen;
let owensBrowser;
let mons;
let monsBrowser;
let modya;
let modyasBrowser;
let maria;
let mariasBrowser;
let michael;
let michaelsBrowser;
let mallory;
let mallorysBrowser;
let guest;
let guestsBrowser;

let idAddress: IdAddress;
let forumTitle = "User Profile Access Test Forum";

let mariasPublicReplyToMichael = "Maria's public reply to Michael";
let mariasPrivateMessageTitle = "Maria's private message to Michael";
let mariasPrivateMessageBody = "Maria's private message to Michael";
let michaelPublicReplyToMarias = "Michael's public reply to Maria";
let michaelPrivateMessageReply = "Michael's private message reply";

let numPublicTopicsByMaria = 3;
let numPublicPostsByMaria = 4;


describe("user profile access:", () => {

  it("import a site", () => {
    browser.perhapsDebugBefore();
    forum = buildSite().addLargeForum({ title: forumTitle });
    idAddress = server.importSiteData(forum.siteData);
  });

  it("initialize people", () => {
    browser = _.assign(browser, pagesFor(browser));
    everyone = browser;
    owen = forum.members.owen;
    owensBrowser = browser;

    mons = forum.members.mons;
    monsBrowser = browser;
    modya = forum.members.modya;
    modyasBrowser = browser;
    maria = forum.members.maria;
    mariasBrowser = browser;
    michael = forum.members.michael;
    michaelsBrowser = browser;
    mallory = forum.members.mallory;
    mallorysBrowser = browser;
    guest = forum.guests.gunnar;
    guestsBrowser = browser;
  });


  // ----- Maria posts stuff

  it("Member Maria logs in", () => {
    mariasBrowser.go(idAddress.origin + '/' + forum.topics.byMichaelCategoryA.slug);
    mariasBrowser.complex.loginWithPasswordViaTopbar(maria);
  });

  it("... and replies to Michael", () => {
    mariasBrowser.complex.replyToOrigPost(mariasPublicReplyToMichael);
  });

  it("... and sends him a private message", () => {
    mariasBrowser.complex.sendMessageToPageAuthor(
        mariasPrivateMessageTitle, mariasPrivateMessageBody);
  });


  // ----- Michael replies

  it("Michael logs in", () => {
    mariasBrowser.topbar.clickLogout({ waitForLoginButton: false });
    michaelsBrowser.assertNotFoundError();
    michaelsBrowser.go('/' + forum.topics.byMichaelCategoryA.slug);
    michaelsBrowser.complex.loginWithPasswordViaTopbar(michael);
  });

  it("... and replies to Maria's public reply", () => {
    michaelsBrowser.complex.replyToPostNr(2, michaelPublicReplyToMarias)
  });

  it("... and clicks a notification about Maria's private message", () => {
    michaelsBrowser.topbar.openNotfToMe();
  });

  it("... and replies to it", () => {
    michaelsBrowser.complex.replyToOrigPost(michaelPrivateMessageReply);
  });


  // ----- Members see only public activity

  it("Michael opens Maria's profile page", () => {
    michaelsBrowser.complex.openPageAuthorProfilePage();
  });

  it("... he sees Maria's posts and the reply to him, in Maria's activity list", () => {
    let posts = michaelsBrowser.userProfilePage.activity.posts;
    posts.assertPostTextVisible(mariasPrivateMessageBody);
    posts.assertPostTextVisible(mariasPublicReplyToMichael);
    posts.assertPostTextVisible(forum.topics.byMariaCategoryA.body);
    posts.assertPostTextVisible(forum.topics.byMariaCategoryANr2.body);
    posts.assertPostTextVisible(forum.topics.byMariaCategoryB.body);
    posts.assertPostTextAbsent(forum.topics.byMariaUnlistedCat.body);
    posts.assertPostTextAbsent(forum.topics.byMariaStaffOnlyCat.body);
    posts.assertPostTextAbsent(forum.topics.byMariaDeletedCat.body);
    posts.assertExactly(numPublicPostsByMaria + 1); // 1 = private message to Michael
  });

  it("... and he doesn't see the Notifications tab", () => {
    assert(!browser.userProfilePage.isNotfsTabVisible());
  });

  it("... and not the Preferences tab", () => {
    assert(!browser.userProfilePage.isPrefsTabVisible());
  });

  it("... he sees Maria's topics, incl the private message to him", () => {
    michaelsBrowser.userProfilePage.activity.switchToTopics({ shallFindTopics: true });
    let topics = michaelsBrowser.userProfilePage.activity.topics;
    topics.assertTopicTitleVisible(forum.topics.byMariaCategoryA.title);
    topics.assertTopicTitleVisible(forum.topics.byMariaCategoryANr2.title);
    topics.assertTopicTitleVisible(forum.topics.byMariaCategoryB.title);
    topics.assertTopicTitleVisible(mariasPrivateMessageTitle);
    topics.assertTopicTitleAbsent(forum.topics.byMariaUnlistedCat.title);
    topics.assertTopicTitleAbsent(forum.topics.byMariaStaffOnlyCat.title);
    topics.assertTopicTitleAbsent(forum.topics.byMariaDeletedCat.title);
    topics.assertExactly(numPublicTopicsByMaria + 1);  // 1 = private message to Michael
  });


  // ----- Mallory won't see private stuff

  it("Mallory logs in", () => {
    michaelsBrowser.topbar.clickLogout();
    mallorysBrowser.refresh();
    mallorysBrowser.complex.loginWithPasswordViaTopbar(mallory);
  });

  it("... he doesn't see the private message topic", () => {
    let topics = mallorysBrowser.userProfilePage.activity.topics;
    topics.assertTopicTitleVisible(forum.topics.byMariaCategoryA.title);
    topics.assertTopicTitleVisible(forum.topics.byMariaCategoryANr2.title);
    topics.assertTopicTitleVisible(forum.topics.byMariaCategoryB.title);
    topics.assertTopicTitleAbsent(mariasPrivateMessageTitle);
    topics.assertExactly(numPublicTopicsByMaria);
  });

  it("... and doesn't see Maria's private message post", () => {
    mallorysBrowser.userProfilePage.activity.switchToPosts({ shallFindPosts: true });
    let posts = mallorysBrowser.userProfilePage.activity.posts;
    posts.assertPostTextVisible(mariasPublicReplyToMichael);
    posts.assertPostTextAbsent(mariasPrivateMessageBody);
    posts.assertExactly(numPublicPostsByMaria);
  });


  // ----- Strangers also see only public activity


  // ----- Moderators see more activity

  it("Moderator Modya logs in", () => {
  });

  it("... Modya sees Maria's pages and public reply", () => {
  });

  it("... but not the private message", () => {
  });

  it("... and not the Notifications tab", () => {
  });


  // ----- Maria see everything

  // TODO Maria should see the unlisted topic, because she created it.

  // ----- Admins see everything

  // TODO they should first click some "See private stuff, to deal with troublemakers" button?

  it("Admin Alice logs in", () => {
  });

  it("... she sees all Marias activity, incl the private message", () => {
  });

  it("... and the Notifications tab, incl all notifiations", () => {
  });


  it("Done", () => {
    everyone.perhapsDebug();
  });

});
